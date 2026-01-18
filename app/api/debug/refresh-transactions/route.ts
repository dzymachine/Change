import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { plaidClient } from "@/lib/plaid/client";
import { isDebugAuthorized } from "@/lib/debug-auth";

/**
 * DEBUG ONLY - Trigger Plaid sandbox transaction refresh
 * 
 * This calls /transactions/refresh which:
 * 1. Generates new sandbox transactions for the Item
 * 2. Fires a SYNC_UPDATES_AVAILABLE webhook to your webhook URL
 * 3. Your webhook handler then syncs and processes the transactions
 * 
 * This is the best way to test the full round-up flow in sandbox.
 */
export async function POST(request: NextRequest) {
  if (!isDebugAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    
    // Try to get user from session, or use provided user_id
    let userId = body.user_id;
    
    if (!userId) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    // Build query for linked account
    let query = supabaseAdmin
      .from("linked_accounts")
      .select("id, plaid_access_token, plaid_item_id, institution_name, user_id")
      .eq("is_active", true)
      .neq("plaid_access_token", "mock_access_token"); // Exclude mock accounts
    
    if (userId) {
      query = query.eq("user_id", userId);
    }
    
    const { data: linkedAccount, error: fetchError } = await query.limit(1).single();

    if (fetchError || !linkedAccount) {
      return NextResponse.json(
        { 
          error: "No linked Plaid sandbox account found",
          hint: "Link a real Plaid sandbox account first (user_good/pass_good)"
        },
        { status: 404 }
      );
    }

    console.log("\n" + "=".repeat(60));
    console.log("🔄 TRIGGERING TRANSACTION REFRESH");
    console.log("=".repeat(60));
    console.log("Item ID:", linkedAccount.plaid_item_id);
    console.log("Institution:", linkedAccount.institution_name);
    console.log("User ID:", linkedAccount.user_id);
    console.log("=".repeat(60));

    // Call Plaid's transactions/refresh endpoint
    const response = await plaidClient.transactionsRefresh({
      access_token: linkedAccount.plaid_access_token,
    });

    console.log("✅ Transaction refresh triggered!");
    console.log("Response:", JSON.stringify(response.data, null, 2));
    console.log("\n⏳ Plaid will send a webhook shortly...");
    console.log("   Watch your server logs for: 📨 PLAID WEBHOOK RECEIVED");
    console.log("=".repeat(60) + "\n");

    return NextResponse.json({
      success: true,
      message: "Transaction refresh triggered",
      item_id: linkedAccount.plaid_item_id,
      institution: linkedAccount.institution_name,
      next_steps: [
        "1. Plaid will send a SYNC_UPDATES_AVAILABLE webhook (may take a few seconds)",
        "2. Your webhook handler will call /transactions/sync",
        "3. New transactions will be processed and round-ups allocated",
        "4. Check your server logs for the webhook and sync output",
        "5. Check /api/plaid/webhook (GET) to see received webhooks",
      ],
    });

  } catch (error) {
    console.error("Failed to refresh transactions:", error);
    
    // Extract Plaid error details if available
    const plaidError = (error as { response?: { data?: unknown } })?.response?.data;
    
    return NextResponse.json(
      { 
        error: "Failed to refresh transactions",
        details: plaidError || (error instanceof Error ? error.message : String(error))
      },
      { status: 500 }
    );
  }
}

// GET endpoint to show usage
export async function GET(request: NextRequest) {
  if (!isDebugAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // List available linked accounts
  const { data: accounts } = await supabaseAdmin
    .from("linked_accounts")
    .select("user_id, plaid_item_id, institution_name, plaid_access_token")
    .eq("is_active", true);
  
  const realAccounts = accounts?.filter(a => a.plaid_access_token !== "mock_access_token") || [];

  return NextResponse.json({
    description: "Trigger Plaid sandbox transaction refresh",
    why: "This generates new sandbox transactions AND fires a webhook - best for testing the full round-up flow",
    usage: "POST /api/debug/refresh-transactions",
    available_accounts: realAccounts.map(a => ({
      user_id: a.user_id,
      item_id: a.plaid_item_id,
      institution: a.institution_name,
    })),
    flow: [
      "1. POST /api/debug/refresh-transactions",
      "2. Plaid generates sandbox transactions",
      "3. Plaid sends SYNC_UPDATES_AVAILABLE webhook to your ngrok URL",
      "4. Your webhook handler calls /transactions/sync",
      "5. Transactions are saved, round-ups calculated, charities allocated",
    ],
  });
}
