import { NextRequest, NextResponse } from "next/server";
import { syncTransactionsForItem } from "@/lib/plaid/sync";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
    
    // Log the full webhook payload for debugging
    console.log("\n" + "=".repeat(60));
    console.log("📨 PLAID WEBHOOK RECEIVED");
    console.log("=".repeat(60));
    console.log("ID:", logId);
    console.log("Time:", new Date().toISOString());
    console.log("Type:", body.webhook_type);
    console.log("Code:", body.webhook_code);
    console.log("Item ID:", body.item_id);
    if (body.new_transactions) {
      console.log("New Transactions:", body.new_transactions);
    }
    if (body.error) {
      console.log("Error:", JSON.stringify(body.error, null, 2));
    }
    console.log("Full Payload:", JSON.stringify(body, null, 2));
    console.log("=".repeat(60) + "\n");

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
        await handleTransactionWebhook(body);
        break;
      
      case "ITEM":
        await handleItemWebhook(body);
        break;
      
      default:
        console.log("Unhandled webhook type:", body.webhook_type);
    }

    // Update log entry with success
    const entry = webhookLog.find(e => e.id === logId);
    if (entry) {
      entry.status = "processed";
      entry.processingTimeMs = Date.now() - startTime;
    }

    console.log(`✅ Webhook ${logId} processed in ${Date.now() - startTime}ms\n`);
    return NextResponse.json({ received: true, id: logId });

  } catch (error) {
    console.error("\n❌ WEBHOOK ERROR:", error);
    
    // Update log entry with error
    const entry = webhookLog.find(e => e.id === logId);
    if (entry) {
      entry.status = "error";
      entry.error = error instanceof Error ? error.message : String(error);
      entry.processingTimeMs = Date.now() - startTime;
    }
    
    return NextResponse.json(
      { error: "Webhook processing failed", id: logId },
      { status: 500 }
    );
  }
}

// GET endpoint to view webhook log (debug only)
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    total: webhookLog.length,
    webhooks: webhookLog,
    note: "This log resets when the server restarts",
  });
}

async function handleTransactionWebhook(payload: PlaidWebhookPayload) {
  const { webhook_code, item_id, new_transactions } = payload;

  switch (webhook_code as TransactionWebhookCode) {
    case "SYNC_UPDATES_AVAILABLE":
    case "INITIAL_UPDATE":
    case "HISTORICAL_UPDATE":
    case "DEFAULT_UPDATE":
      // New transactions available - trigger sync
      console.log(`Syncing ${new_transactions} new transactions for item ${item_id}`);
      await syncTransactionsForItem(item_id);
      break;

    case "TRANSACTIONS_REMOVED":
      // Handle removed transactions - sync will handle this
      console.log("Transactions removed:", payload.removed_transactions);
      await syncTransactionsForItem(item_id);
      break;

    default:
      console.log("Unhandled transaction webhook code:", webhook_code);
  }
}

async function handleItemWebhook(payload: PlaidWebhookPayload) {
  const { webhook_code, item_id, error } = payload;

  switch (webhook_code) {
    case "ERROR":
      console.error(`Item ${item_id} error:`, error);
      // Mark linked account as needing re-authentication
      await supabaseAdmin
        .from("linked_accounts")
        .update({ is_active: false })
        .eq("plaid_item_id", item_id);
      break;

    case "PENDING_EXPIRATION":
      console.warn(`Item ${item_id} access token expiring soon`);
      // TODO: Send notification to user to re-link account
      break;

    default:
      console.log("Unhandled item webhook code:", webhook_code);
  }
}
