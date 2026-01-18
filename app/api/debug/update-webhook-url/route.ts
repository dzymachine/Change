import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { plaidClient } from "@/lib/plaid/client";
import { isDebugAuthorized } from "@/lib/debug-auth";

/**
 * DEBUG ONLY - Update webhook URL for existing Plaid Items
 * Use this if you linked an account before the webhook URL was configured correctly
 */
export async function POST(request: NextRequest) {
  if (!isDebugAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhookUrl = process.env.PLAID_WEBHOOK_URL;
  
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "PLAID_WEBHOOK_URL not set in environment" },
      { status: 400 }
    );
  }

  console.log("\n" + "=".repeat(60));
  console.log("🔧 UPDATING WEBHOOK URL FOR ALL ITEMS");
  console.log("=".repeat(60));
  console.log("New webhook URL:", webhookUrl);

  try {
    // Get all linked accounts
    const { data: accounts, error } = await supabaseAdmin
      .from("linked_accounts")
      .select("id, plaid_access_token, plaid_item_id, institution_name")
      .eq("is_active", true)
      .neq("plaid_access_token", "mock_access_token");

    if (error || !accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: "No linked accounts found", details: error },
        { status: 404 }
      );
    }

    const results = [];

    for (const account of accounts) {
      try {
        console.log(`\nUpdating webhook for: ${account.institution_name} (${account.plaid_item_id})`);
        
        await plaidClient.itemWebhookUpdate({
          access_token: account.plaid_access_token,
          webhook: webhookUrl,
        });
        
        console.log("✅ Updated successfully");
        results.push({
          item_id: account.plaid_item_id,
          institution: account.institution_name,
          status: "updated",
        });
      } catch (err) {
        console.error("❌ Failed:", err);
        results.push({
          item_id: account.plaid_item_id,
          institution: account.institution_name,
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Webhook URL update complete");
    console.log("=".repeat(60) + "\n");

    return NextResponse.json({
      success: true,
      webhook_url: webhookUrl,
      results,
    });

  } catch (error) {
    console.error("Failed to update webhook URLs:", error);
    return NextResponse.json(
      { error: "Failed to update webhook URLs" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!isDebugAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    description: "Update webhook URL for all existing Plaid Items",
    current_webhook_url: process.env.PLAID_WEBHOOK_URL,
    usage: "POST /api/debug/update-webhook-url",
  });
}
