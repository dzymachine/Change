import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { plaidClient } from "@/lib/plaid/client";
import { SandboxItemFireWebhookRequestWebhookCodeEnum } from "plaid";

/**
 * DEBUG ONLY - Fire a Plaid sandbox webhook
 * This triggers Plaid to send a webhook to your webhook URL
 * Useful for testing the webhook → sync → allocation flow
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const webhookCode = body.webhook_code || "DEFAULT_UPDATE";
    
    // Try to get user from session, but also allow passing user_id for curl testing
    let userId = body.user_id;
    
    if (!userId) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    // Build query for linked account
    let query = supabaseAdmin
      .from("linked_accounts")
      .select("plaid_access_token, plaid_item_id, institution_name, user_id")
      .eq("is_active", true)
      .neq("plaid_access_token", "mock_access_token"); // Exclude mock accounts
    
    if (userId) {
      query = query.eq("user_id", userId);
    }
    
    // Get linked account (first real one if no user specified)
    const { data: linkedAccount, error: fetchError } = await query.limit(1).single();

    if (fetchError || !linkedAccount) {
      return NextResponse.json(
        { 
          error: "No linked Plaid sandbox account found",
          hint: "Link a real Plaid sandbox account (user_good/pass_good) - mock accounts won't work"
        },
        { status: 404 }
      );
    }

    console.log("\n" + "=".repeat(60));
    console.log("🔥 FIRING SANDBOX WEBHOOK");
    console.log("=".repeat(60));
    console.log("Item ID:", linkedAccount.plaid_item_id);
    console.log("Institution:", linkedAccount.institution_name);
    console.log("Webhook Code:", webhookCode);
    console.log("=".repeat(60) + "\n");

    // Fire the webhook via Plaid sandbox API
    const response = await plaidClient.sandboxItemFireWebhook({
      access_token: linkedAccount.plaid_access_token,
      webhook_code: webhookCode as SandboxItemFireWebhookRequestWebhookCodeEnum,
    });

    console.log("✅ Webhook fired successfully!");
    console.log("Response:", JSON.stringify(response.data, null, 2));

    return NextResponse.json({
      success: true,
      message: `Webhook ${webhookCode} fired successfully`,
      item_id: linkedAccount.plaid_item_id,
      webhook_fired: response.data.webhook_fired,
      note: "Check /api/plaid/webhook (GET) to see received webhooks",
    });

  } catch (error) {
    console.error("Failed to fire webhook:", error);
    
    // Extract Plaid error details if available
    const plaidError = (error as { response?: { data?: unknown } })?.response?.data;
    
    return NextResponse.json(
      { 
        error: "Failed to fire webhook",
        details: plaidError || (error instanceof Error ? error.message : String(error))
      },
      { status: 500 }
    );
  }
}

// GET endpoint to show available webhook codes
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  // List all available linked accounts for easy testing
  const { data: accounts } = await supabaseAdmin
    .from("linked_accounts")
    .select("user_id, plaid_item_id, institution_name, plaid_access_token")
    .eq("is_active", true);
  
  const realAccounts = accounts?.filter(a => a.plaid_access_token !== "mock_access_token") || [];

  return NextResponse.json({
    description: "Fire Plaid sandbox webhooks for testing",
    usage: "POST /api/debug/fire-webhook with optional webhook_code and user_id",
    note: "If no user_id provided, uses first available real Plaid account",
    available_accounts: realAccounts.map(a => ({
      user_id: a.user_id,
      item_id: a.plaid_item_id,
      institution: a.institution_name,
    })),
    available_codes: [
      {
        code: "DEFAULT_UPDATE",
        description: "New transactions available (most common)",
      },
      {
        code: "INITIAL_UPDATE",
        description: "Initial transaction pull complete",
      },
      {
        code: "HISTORICAL_UPDATE", 
        description: "Historical transactions available",
      },
      {
        code: "SYNC_UPDATES_AVAILABLE",
        description: "New data available via /transactions/sync",
      },
    ],
    example: {
      method: "POST",
      body: { webhook_code: "DEFAULT_UPDATE" },
    },
  });
}
