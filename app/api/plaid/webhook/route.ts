import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { syncTransactionsForItem } from "@/lib/plaid/sync";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logJson } from "@/lib/log-json";
import { verifyPlaidWebhook } from "@/lib/plaid/verify-webhook";
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

/**
 * Plaid Webhook Handler
 * 
 * CRITICAL: This handler responds with 200 immediately (within a few hundred ms)
 * and processes the webhook asynchronously in the background.
 * 
 * Plaid expects a 200 response within 10 seconds, and will retry on failure.
 * By responding immediately, we ensure reliability.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const logId = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  // Get raw body for verification AND parsing
  // We need the raw text for signature verification
  const rawBody = await request.text();
  let body: PlaidWebhookPayload;
  
  try {
    body = JSON.parse(rawBody);
  } catch {
    logJson("error", "plaid.webhook.invalid_json", { trace_id: logId });
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Verify webhook authenticity
  const plaidVerificationHeader = request.headers.get("Plaid-Verification");
  const verification = await verifyPlaidWebhook(rawBody, plaidVerificationHeader);
  
  if (!verification.verified) {
    logJson("error", "plaid.webhook.verification_failed", {
      trace_id: logId,
      error: verification.error,
      webhook_type: body.webhook_type,
      webhook_code: body.webhook_code,
      item_id: body.item_id,
    });
    return NextResponse.json(
      { error: "Webhook verification failed", reason: verification.error },
      { status: 401 }
    );
  }

  logJson("info", "plaid.webhook.received", {
    trace_id: logId,
    webhook_type: body.webhook_type,
    webhook_code: body.webhook_code,
    item_id: body.item_id,
    new_transactions: body.new_transactions ?? null,
    has_error: Boolean(body.error),
    verification_skipped: verification.skipped ?? false,
    response_time_ms: Date.now() - startTime,
  });

  // Persist webhook receipt immediately (non-blocking)
  const persistPromise = (async () => {
    try {
      await supabaseAdmin.from("plaid_webhook_events").insert({
        trace_id: logId,
        item_id: body.item_id,
        webhook_type: body.webhook_type,
        webhook_code: body.webhook_code,
        payload: body,
        status: "received",
      });
    } catch (err: unknown) {
      logJson("warn", "plaid.webhook.persist_failed", { trace_id: logId, error: err });
    }
  })();

  // Process the webhook in the background using Vercel's waitUntil
  // This allows us to respond with 200 immediately while processing continues
  const processingPromise = processWebhookAsync(body, logId, startTime);

  // Use waitUntil to ensure processing completes even after response is sent
  // This works on Vercel and falls back to fire-and-forget locally
  const backgroundWork = Promise.all([persistPromise, processingPromise]);
  
  if (typeof waitUntil === "function") {
    try {
      waitUntil(backgroundWork);
    } catch {
      // waitUntil may not be available in all environments
      // Fall back to awaiting in development
      if (process.env.NODE_ENV === "development") {
        await backgroundWork;
      }
    }
  } else if (process.env.NODE_ENV === "development") {
    // In local dev without Vercel runtime, wait for processing
    await backgroundWork;
  }

  // Return 200 immediately - processing continues in background
  return NextResponse.json({ 
    received: true, 
    id: logId,
    response_time_ms: Date.now() - startTime,
  });
}

/**
 * Process webhook asynchronously (runs in background after 200 response)
 */
async function processWebhookAsync(
  body: PlaidWebhookPayload, 
  traceId: string, 
  startTime: number
): Promise<void> {
  try {
    // Handle different webhook types
    switch (body.webhook_type) {
      case "TRANSACTIONS":
        await handleTransactionWebhook(body, traceId);
        break;
      
      case "ITEM":
        await handleItemWebhook(body, traceId);
        break;
      
      default:
        logJson("warn", "plaid.webhook.unhandled_type", {
          trace_id: traceId,
          webhook_type: body.webhook_type,
          webhook_code: body.webhook_code,
          item_id: body.item_id,
        });
    }

    logJson("info", "plaid.webhook.processed", {
      trace_id: traceId,
      webhook_type: body.webhook_type,
      webhook_code: body.webhook_code,
      item_id: body.item_id,
      total_processing_ms: Date.now() - startTime,
    });

    // Update webhook event status
    await supabaseAdmin
      .from("plaid_webhook_events")
      .update({
        status: "processed",
        processing_time_ms: Date.now() - startTime,
      })
      .eq("trace_id", traceId);

  } catch (error) {
    logJson("error", "plaid.webhook.processing_error", {
      trace_id: traceId,
      webhook_type: body.webhook_type,
      webhook_code: body.webhook_code,
      item_id: body.item_id,
      error,
      total_processing_ms: Date.now() - startTime,
    });

    // Update webhook event with error
    await supabaseAdmin
      .from("plaid_webhook_events")
      .update({
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        processing_time_ms: Date.now() - startTime,
      })
      .eq("trace_id", traceId);
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

  // Also fetch recent sync runs for correlation
  const { data: syncRuns } = await supabaseAdmin
    .from("plaid_sync_runs")
    .select("trace_id, item_id, trigger, webhook_code, added_count, modified_count, removed_count, inserted_or_upserted, status, error, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return NextResponse.json({
    webhook_events: {
      total: events?.length || 0,
      events: events || [],
    },
    sync_runs: {
      total: syncRuns?.length || 0,
      runs: syncRuns || [],
    },
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
