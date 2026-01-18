import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { syncTransactionsForItem } from "@/lib/plaid/sync";

/**
 * DEBUG ONLY - Manually trigger transaction sync without waiting for webhook
 * Use this to test the sync flow when webhooks aren't arriving
 */
export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    // Get all linked accounts
    const { data: accounts, error } = await supabaseAdmin
      .from("linked_accounts")
      .select("plaid_item_id, institution_name, user_id")
      .eq("is_active", true)
      .neq("plaid_access_token", "mock_access_token");

    if (error || !accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: "No linked accounts found" },
        { status: 404 }
      );
    }

    console.log("\n" + "=".repeat(60));
    console.log("🔄 MANUAL TRANSACTION SYNC");
    console.log("=".repeat(60));

    const results = [];

    for (const account of accounts) {
      console.log(`\nSyncing: ${account.institution_name} (${account.plaid_item_id})`);
      
      try {
        await syncTransactionsForItem(account.plaid_item_id);
        results.push({
          item_id: account.plaid_item_id,
          institution: account.institution_name,
          status: "synced",
        });
      } catch (err) {
        console.error("Sync failed:", err);
        results.push({
          item_id: account.plaid_item_id,
          institution: account.institution_name,
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Get transaction count after sync
    const { count } = await supabaseAdmin
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", accounts[0].user_id);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Manual sync complete");
    console.log("=".repeat(60) + "\n");

    return NextResponse.json({
      success: true,
      results,
      total_transactions: count,
    });

  } catch (error) {
    console.error("Manual sync failed:", error);
    return NextResponse.json(
      { error: "Manual sync failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    description: "Manually trigger transaction sync without waiting for webhook",
    usage: "POST /api/debug/manual-sync",
  });
}
