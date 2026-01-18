import { NextRequest, NextResponse } from "next/server";
import { syncTransactionsForItem } from "@/lib/plaid/sync";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logJson } from "@/lib/log-json";
import { isDebugAuthorized } from "@/lib/debug-auth";

// Plaid Webhook Types
type PlaidWebhookType = 
  | "TRANSACTIONS" 
  | "ITEM" 
  | "AUTH" 
  | "ASSETS" 
  | "HOLDINGS" 
  | "INVESTMENTS_TRANSACTIONS"
  | "LIABILITIES";

type TransactionWebhookCode = 
  | "INITIAL_UPDATE"
  | "HISTORICAL_UPDATE"
  | "DEFAULT_UPDATE"
  | "TRANSACTIONS_REMOVED"
  | "SYNC_UPDATES_AVAILABLE";

interface PlaidWebhookPayload {
  webhook_type: PlaidWebhookType;
  webhook_code: string;
  item_id: string;
  error?: {
    error_type: string;
    error_code: string;
    error_message: string;
  };
  new_transactions?: number;
  removed_transactions?: string[];
}

// In-memory webhook log for debugging (resets on server restart)
// In production, you'd store this in a database
interface WebhookLogEntry {
  id: string;
  timestamp: string;
  payload: PlaidWebhookPayload;
  status: "received" | "processed" | "error";
  error?: string;
  processingTimeMs?: number;
}

const webhookLog: WebhookLogEntry[] = [];
const MAX_LOG_ENTRIES = 50;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const logId = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  try {
    const body: PlaidWebhookPayload = await request.json();
    
    logJson("info", "plaid.webhook.received", {
      trace_id: logId,
      webhook_type: body.webhook_type,
      webhook_code: body.webhook_code,
      item_id: body.item_id,
      new_transactions: body.new_transactions ?? null,
      has_error: Boolean(body.error),
    });

    // Persist webhook receipt for environments where logs aren't accessible (e.g., Vercel)
    try {
      await supabaseAdmin.from("plaid_webhook_events").insert({
        trace_id: logId,
        item_id: body.item_id,
        webhook_type: body.webhook_type,
        webhook_code: body.webhook_code,
        payload: body,
        status: "received",
      });
    } catch (persistError) {
      logJson("warn", "plaid.webhook.persist_failed", { trace_id: logId, error: persistError });
    }

    // Add to in-memory log
    const logEntry: WebhookLogEntry = {
      id: logId,
      timestamp: new Date().toISOString(),
      payload: body,
      status: "received",
    };
    webhookLog.unshift(logEntry);
    
    // Keep only last N entries
    if (webhookLog.length > MAX_LOG_ENTRIES) {
      webhookLog.pop();
    }

    // Handle different webhook types
    switch (body.webhook_type) {
      case "TRANSACTIONS":
        await handleTransactionWebhook(body, logId);
        break;
      
      case "ITEM":
        await handleItemWebhook(body, logId);
        break;
      
      default:
        logJson("warn", "plaid.webhook.unhandled_type", {
          trace_id: logId,
          webhook_type: body.webhook_type,
          webhook_code: body.webhook_code,
          item_id: body.item_id,
        });
    }

    // Update log entry with success
    const entry = webhookLog.find(e => e.id === logId);
    if (entry) {
      entry.status = "processed";
      entry.processingTimeMs = Date.now() - startTime;
    }

    logJson("info", "plaid.webhook.processed", {
      trace_id: logId,
      webhook_type: body.webhook_type,
      webhook_code: body.webhook_code,
      item_id: body.item_id,
      processing_ms: Date.now() - startTime,
    });

    try {
      await supabaseAdmin
        .from("plaid_webhook_events")
        .update({
          status: "processed",
          processing_time_ms: Date.now() - startTime,
        })
        .eq("trace_id", logId);
    } catch (persistError) {
      logJson("warn", "plaid.webhook.persist_failed", { trace_id: logId, error: persistError });
    }
    return NextResponse.json({ received: true, id: logId });

  } catch (error) {
    logJson("error", "plaid.webhook.error", {
      trace_id: logId,
      processing_ms: Date.now() - startTime,
      error,
    });
    
    // Update log entry with error
    const entry = webhookLog.find(e => e.id === logId);
    if (entry) {
      entry.status = "error";
      entry.error = error instanceof Error ? error.message : String(error);
      entry.processingTimeMs = Date.now() - startTime;
    }

    try {
      await supabaseAdmin
        .from("plaid_webhook_events")
        .update({
          status: "error",
          error: error instanceof Error ? error.message : String(error),
          processing_time_ms: Date.now() - startTime,
        })
        .eq("trace_id", logId);
    } catch (persistError) {
      logJson("warn", "plaid.webhook.persist_failed", { trace_id: logId, error: persistError });
    }
    
    return NextResponse.json(
      { error: "Webhook processing failed", id: logId },
      { status: 500 }
    );
  }
}

// GET endpoint to view webhook log (debug only)
export async function GET(request: NextRequest) {
  // In production, allow viewing via DEBUG_API_TOKEN for troubleshooting.
  if (!isDebugAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.max(1, Math.min(100, limitRaw ? Number.parseInt(limitRaw, 10) || 25 : 25));

  const { data: events, error } = await supabaseAdmin
    .from("plaid_webhook_events")
    .select("trace_id, item_id, webhook_type, webhook_code, status, error, processing_time_ms, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch webhook events",
        details: error.message,
        hint: "If this is 'relation does not exist', apply supabase migration 20260118040000_014_plaid_event_logs.sql",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    total: events?.length || 0,
    events: events || [],
    note: "Stored in Supabase (persistent)",
  });
}

async function handleTransactionWebhook(payload: PlaidWebhookPayload, traceId: string) {
  const { webhook_code, item_id, new_transactions } = payload;

  switch (webhook_code as TransactionWebhookCode) {
    case "SYNC_UPDATES_AVAILABLE":
    case "INITIAL_UPDATE":
    case "HISTORICAL_UPDATE":
    case "DEFAULT_UPDATE":
      // New transactions available - trigger sync
      logJson("info", "plaid.webhook.sync_requested", {
        trace_id: traceId,
        webhook_code,
        item_id,
        new_transactions: new_transactions ?? null,
      });
      await syncTransactionsForItem(item_id, { traceId, trigger: "webhook", webhook_code });
      break;

    case "TRANSACTIONS_REMOVED":
      // Handle removed transactions - sync will handle this
      logJson("info", "plaid.webhook.transactions_removed", {
        trace_id: traceId,
        webhook_code,
        item_id,
        removed_count: payload.removed_transactions?.length ?? 0,
      });
      await syncTransactionsForItem(item_id, { traceId, trigger: "webhook", webhook_code });
      break;

    default:
      logJson("warn", "plaid.webhook.unhandled_code", {
        trace_id: traceId,
        webhook_type: "TRANSACTIONS",
        webhook_code,
        item_id,
      });
  }
}

async function handleItemWebhook(payload: PlaidWebhookPayload, traceId: string) {
  const { webhook_code, item_id, error } = payload;

  switch (webhook_code) {
    case "ERROR":
      logJson("error", "plaid.webhook.item_error", {
        trace_id: traceId,
        item_id,
        error,
      });
      // Mark linked account as needing re-authentication
      await supabaseAdmin
        .from("linked_accounts")
        .update({ is_active: false })
        .eq("plaid_item_id", item_id);
      break;

    case "PENDING_EXPIRATION":
      logJson("warn", "plaid.webhook.item_pending_expiration", {
        trace_id: traceId,
        item_id,
      });
      // TODO: Send notification to user to re-link account
      break;

    default:
      logJson("info", "plaid.webhook.item_unhandled_code", {
        trace_id: traceId,
        item_id,
        webhook_code,
      });
  }
}
