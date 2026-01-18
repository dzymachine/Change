import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { plaidClient } from "@/lib/plaid/client";
import { isDebugAuthorized } from "@/lib/debug-auth";

/**
 * DEBUG ONLY - Check Plaid Item details including webhook URL
 */
export async function GET(request: NextRequest) {
  if (!isDebugAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all linked accounts
    const { data: accounts, error } = await supabaseAdmin
      .from("linked_accounts")
      .select("id, plaid_access_token, plaid_item_id, institution_name, user_id")
      .eq("is_active", true)
      .neq("plaid_access_token", "mock_access_token");

    if (error || !accounts || accounts.length === 0) {
      return NextResponse.json({
        error: "No linked accounts found",
        configured_webhook_url: process.env.PLAID_WEBHOOK_URL,
      });
    }

    const results = [];

    for (const account of accounts) {
      try {
        // Get Item details from Plaid
        const itemResponse = await plaidClient.itemGet({
          access_token: account.plaid_access_token,
        });

        const item = itemResponse.data.item;
        
        results.push({
          institution: account.institution_name,
          item_id: item.item_id,
          webhook_url: item.webhook,
          consent_expiration: item.consent_expiration_time,
          update_type: item.update_type,
          products: item.products,
        });
      } catch (err) {
        results.push({
          institution: account.institution_name,
          item_id: account.plaid_item_id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      configured_webhook_url: process.env.PLAID_WEBHOOK_URL,
      items: results,
    });

  } catch (error) {
    console.error("Failed to check items:", error);
    return NextResponse.json(
      { error: "Failed to check items" },
      { status: 500 }
    );
  }
}
