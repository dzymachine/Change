import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isDebugAuthorized } from "@/lib/debug-auth";

/**
 * DEBUG ONLY - Inspect transactions in the DB without requiring auth.
 * Useful for verifying the Plaid webhook -> sync -> insert flow.
 */
export async function GET(request: NextRequest) {
  if (!isDebugAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id") || undefined;
  const itemId = url.searchParams.get("item_id") || undefined;
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.max(
    1,
    Math.min(100, limitRaw ? Number.parseInt(limitRaw, 10) || 25 : 25)
  );

  try {
    let linkedQuery = supabaseAdmin
      .from("linked_accounts")
      .select("id, user_id, plaid_item_id, institution_name, is_active")
      .eq("is_active", true);

    if (itemId) linkedQuery = linkedQuery.eq("plaid_item_id", itemId);
    if (userId) linkedQuery = linkedQuery.eq("user_id", userId);

    const { data: accounts, error: accountsError } = await linkedQuery.limit(25);
    if (accountsError) {
      return NextResponse.json(
        { error: "Failed to fetch linked accounts", details: accountsError.message },
        { status: 500 }
      );
    }

    const linkedAccountIds = (accounts || []).map((a) => a.id);

    let txQuery = supabaseAdmin
      .from("transactions")
      .select(
        "id, user_id, linked_account_id, plaid_transaction_id, amount, roundup_amount, merchant_name, category, date, is_pending, processed_for_donation, donated_to_charity_id, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (userId) txQuery = txQuery.eq("user_id", userId);
    if (linkedAccountIds.length > 0) txQuery = txQuery.in("linked_account_id", linkedAccountIds);

    const { data: transactions, error: txError } = await txQuery;
    if (txError) {
      return NextResponse.json(
        { error: "Failed to fetch transactions", details: txError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      filter: { user_id: userId ?? null, item_id: itemId ?? null, limit },
      linked_accounts: (accounts || []).map((a) => ({
        id: a.id,
        user_id: a.user_id,
        item_id: a.plaid_item_id,
        institution: a.institution_name,
      })),
      transactions: transactions || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load transactions", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
