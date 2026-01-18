import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/transactions
 * 
 * Fetch the current user's transactions.
 * This works in both development and production.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fetch user's transactions
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("id, merchant_name, amount, roundup_amount, date, donated_to_charity_id, processed_for_donation")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to fetch transactions:", error);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transactions: transactions?.map((t) => ({
        id: t.id,
        merchant_name: t.merchant_name || "Unknown",
        amount: parseFloat(String(t.amount)) || 0,
        roundup_amount: parseFloat(String(t.roundup_amount)) || 0,
        date: t.date,
        donated_to: t.donated_to_charity_id,
        processed: t.processed_for_donation,
      })) || [],
    });
  } catch (error) {
    console.error("Transactions API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
