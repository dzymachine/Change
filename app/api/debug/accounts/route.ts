import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Debug endpoint to see all linked accounts
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { data: accounts, error } = await supabaseAdmin
    .from("linked_accounts")
    .select("id, user_id, plaid_item_id, plaid_access_token, institution_name, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    total: accounts?.length || 0,
    accounts: accounts?.map(a => ({
      id: a.id,
      user_id: a.user_id,
      item_id: a.plaid_item_id,
      institution: a.institution_name,
      is_active: a.is_active,
      is_mock: a.plaid_access_token === "mock_access_token" || a.plaid_access_token?.startsWith("mock"),
      token_preview: a.plaid_access_token?.substring(0, 20) + "...",
      created_at: a.created_at,
    })),
  });
}
