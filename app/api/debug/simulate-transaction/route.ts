import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { calculateRoundup } from "@/lib/donations/calculate";
import { allocateRoundupToCharity } from "@/lib/donations/allocate";

// DEBUG ONLY - Simulate a transaction without Plaid
// This allows testing the round-up flow in development
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const amount = body.amount || Math.random() * 50 + 5; // Random $5-$55 if not specified
    const merchantName = body.merchant || getRandomMerchant();

    const roundupAmount = calculateRoundup(amount);

    // Check if user has a linked account (create mock one if not)
    let { data: linkedAccount } = await supabaseAdmin
      .from("linked_accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!linkedAccount) {
      // Create a mock linked account for testing
      const { data: newAccount, error: createError } = await supabaseAdmin
        .from("linked_accounts")
        .insert({
          user_id: user.id,
          plaid_item_id: `mock_item_${user.id}`,
          plaid_access_token: "mock_access_token",
          institution_name: "Mock Bank (Sandbox)",
          institution_id: "mock_bank",
          is_active: true,
        })
        .select("id")
        .single();

      if (createError) {
        return NextResponse.json(
          { error: "Failed to create mock account", details: createError },
          { status: 500 }
        );
      }
      linkedAccount = newAccount;
    }

    // Create the simulated transaction
    const transactionId = `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data: transaction, error: txError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        linked_account_id: linkedAccount.id,
        plaid_transaction_id: transactionId,
        amount: amount,
        roundup_amount: roundupAmount,
        merchant_name: merchantName,
        category: ["Shopping"],
        date: new Date().toISOString().split("T")[0],
        is_pending: false, // Settled immediately for testing
        is_donation: false,
        processed_for_donation: false,
      })
      .select("id")
      .single();

    if (txError) {
      return NextResponse.json(
        { error: "Failed to create transaction", details: txError },
        { status: 500 }
      );
    }

    // Allocate the round-up to a charity
    const allocation = await allocateRoundupToCharity(
      user.id,
      transaction.id,
      roundupAmount
    );

    // Get updated charity info
    const { data: userCharities } = await supabaseAdmin
      .from("user_charities")
      .select("*")
      .eq("user_id", user.id)
      .order("priority", { ascending: true });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        plaid_id: transactionId,
        amount: amount.toFixed(2),
        roundup: roundupAmount.toFixed(2),
        merchant: merchantName,
      },
      allocation: allocation,
      charities: userCharities?.map((c) => ({
        charity_id: c.charity_id,
        priority: c.priority,
        goal: parseFloat(c.goal_amount).toFixed(2),
        current: parseFloat(c.current_amount).toFixed(2),
        is_completed: c.is_completed,
      })),
    });
  } catch (error) {
    console.error("Simulation error:", error);
    return NextResponse.json(
      { error: "Simulation failed", details: String(error) },
      { status: 500 }
    );
  }
}

function getRandomMerchant(): string {
  const merchants = [
    "Starbucks",
    "Amazon",
    "Uber",
    "Whole Foods",
    "Target",
    "Walmart",
    "Netflix",
    "Spotify",
    "DoorDash",
    "Chipotle",
    "CVS Pharmacy",
    "Shell Gas Station",
    "Apple Store",
    "Best Buy",
    "Home Depot",
  ];
  return merchants[Math.floor(Math.random() * merchants.length)];
}

// GET endpoint to check current state
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Get recent transactions
  const { data: transactions } = await supabaseAdmin
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get charity stats
  const { data: charities } = await supabaseAdmin
    .from("user_charities")
    .select("*")
    .eq("user_id", user.id)
    .order("priority", { ascending: true });

  // Get profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("donation_mode, roundup_enabled")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    profile,
    charities: charities?.map((c) => ({
      charity_id: c.charity_id,
      priority: c.priority,
      goal: parseFloat(c.goal_amount).toFixed(2),
      current: parseFloat(c.current_amount).toFixed(2),
      progress: `${((parseFloat(c.current_amount) / parseFloat(c.goal_amount)) * 100).toFixed(1)}%`,
      is_completed: c.is_completed,
    })),
    recent_transactions: transactions?.map((t) => ({
      merchant: t.merchant_name,
      amount: parseFloat(t.amount).toFixed(2),
      roundup: parseFloat(t.roundup_amount).toFixed(2),
      donated_to: t.donated_to_charity_id,
      processed: t.processed_for_donation,
      date: t.date,
    })),
  });
}
