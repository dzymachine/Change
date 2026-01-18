import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { syncTransactionsForItem } from "@/lib/plaid/sync";
import { isDebugAuthorized } from "@/lib/debug-auth";

/**
 * DEBUG ONLY - Reset sync cursor for an item and resync
 * This forces a fresh sync from scratch, useful for debugging
 */
export async function POST(request: NextRequest) {
  if (!isDebugAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const itemId = body.item_id;

    // Get linked account(s)
    let query = supabaseAdmin
      .from("linked_accounts")
      .select("id, plaid_item_id, institution_name, sync_cursor")
      .eq("is_active", true)
      .neq("plaid_access_token", "mock_access_token");

    if (itemId) {
      query = query.eq("plaid_item_id", itemId);
    }

    const { data: accounts, error } = await query.limit(1);

    if (error || !accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: "No linked accounts found" },
        { status: 404 }
      );
    }

    const account = accounts[0];
    const oldCursor = account.sync_cursor;

    // Reset cursor to null
    await supabaseAdmin
      .from("linked_accounts")
      .update({ sync_cursor: null })
      .eq("id", account.id);

    console.log(`Reset cursor for ${account.institution_name}`);
    console.log(`Old cursor: ${oldCursor?.substring(0, 50)}...`);

    // Now sync fresh
    await syncTransactionsForItem(account.plaid_item_id, { trigger: "manual" });

    // Get updated account info
    const { data: updated } = await supabaseAdmin
      .from("linked_accounts")
      .select("sync_cursor")
      .eq("id", account.id)
      .single();

    // Count transactions
    const { count } = await supabaseAdmin
      .from("transactions")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      success: true,
      item_id: account.plaid_item_id,
      institution: account.institution_name,
      old_cursor_prefix: oldCursor?.substring(0, 50) || null,
      new_cursor_prefix: updated?.sync_cursor?.substring(0, 50) || null,
      total_transactions: count,
    });

  } catch (error) {
    console.error("Reset cursor failed:", error);
    return NextResponse.json(
      { error: "Reset cursor failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!isDebugAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    description: "Reset sync cursor and resync from scratch",
    usage: "POST /api/debug/reset-cursor with optional item_id in body",
  });
}
