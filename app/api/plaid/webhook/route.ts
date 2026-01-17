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

export async function POST(request: NextRequest) {
  try {
    const body: PlaidWebhookPayload = await request.json();
    
    console.log("Plaid webhook received:", {
      type: body.webhook_type,
      code: body.webhook_code,
      item_id: body.item_id,
    });

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

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
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
