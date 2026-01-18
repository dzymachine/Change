import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { calculateRoundup } from "@/lib/donations/calculate";
import { allocateRoundupToCharity } from "@/lib/donations/allocate";
import { logJson } from "@/lib/log-json";

/**
 * Demo: Simulate a Purchase
 * 
 * This creates a realistic demo transaction to showcase the full round-up flow
 * for hackathon judges. It simulates what happens in production when a real
 * purchase is made.
 * 
 * The flow:
 * 1. User "makes a purchase" (simulated)
 * 2. Transaction is created with round-up calculated
 * 3. Round-up is allocated to user's selected charity
 * 4. Returns the full transaction details
 */

const DEMO_MERCHANTS = [
  { name: "Starbucks", category: ["Food and Drink", "Coffee Shop"] },
  { name: "Uber", category: ["Transportation", "Ride Share"] },
  { name: "Amazon", category: ["Shopping", "Online"] },
  { name: "Chipotle", category: ["Food and Drink", "Restaurant"] },
  { name: "Target", category: ["Shopping", "Retail"] },
  { name: "Spotify", category: ["Entertainment", "Subscription"] },
  { name: "Netflix", category: ["Entertainment", "Subscription"] },
  { name: "Whole Foods", category: ["Food and Drink", "Grocery"] },
  { name: "DoorDash", category: ["Food and Drink", "Delivery"] },
  { name: "Apple", category: ["Shopping", "Electronics"] },
];

function randomMerchant() {
  return DEMO_MERCHANTS[Math.floor(Math.random() * DEMO_MERCHANTS.length)];
}

function randomAmount(min = 3, max = 50): number {
  // Generate realistic purchase amounts with cents
  const dollars = Math.floor(Math.random() * (max - min) + min);
  const cents = Math.floor(Math.random() * 100);
  return Number(`${dollars}.${cents.toString().padStart(2, "0")}`);
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to simulate a purchase" },
        { status: 401 }
      );
    }

    // Parse optional custom amount/merchant from request
    const body = await request.json().catch(() => ({}));
    const customAmount = body.amount;
    const customMerchant = body.merchant;

    // Get user's linked account (use first one, or create a demo one)
    let { data: linkedAccount } = await supabaseAdmin
      .from("linked_accounts")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .single();

    // If no linked account, create a demo one
    if (!linkedAccount) {
      const { data: newAccount } = await supabaseAdmin
        .from("linked_accounts")
        .insert({
          user_id: user.id,
          plaid_item_id: `demo_item_${Date.now()}`,
          plaid_access_token: "demo_access_token",
          institution_name: "Demo Bank",
          institution_id: "demo_bank",
          is_active: true,
        })
        .select("id")
        .single();
      
      linkedAccount = newAccount;
    }

    if (!linkedAccount) {
      return NextResponse.json(
        { error: "Could not create demo account" },
        { status: 500 }
      );
    }

    // Generate transaction details
    const merchant = customMerchant ? { name: customMerchant, category: ["Shopping"] } : randomMerchant();
    const amount = customAmount || randomAmount();
    const roundup = calculateRoundup(amount);
    const transactionId = `demo_tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    logJson("info", "demo.purchase.simulating", {
      user_id: user.id,
      merchant: merchant.name,
      amount,
      roundup,
    });

    // Create the transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        linked_account_id: linkedAccount.id,
        plaid_transaction_id: transactionId,
        amount,
        roundup_amount: roundup,
        merchant_name: merchant.name,
        category: merchant.category,
        date: todayDate(),
        is_pending: false,
        is_donation: false,
        processed_for_donation: false,
      })
      .select()
      .single();

    if (txError) {
      logJson("error", "demo.purchase.failed", { error: txError });
      return NextResponse.json(
        { error: "Failed to create transaction", details: txError.message },
        { status: 500 }
      );
    }

    // Allocate the round-up to charity
    const allocation = await allocateRoundupToCharity(user.id, transaction.id, roundup);

    // Get the charity name if allocated
    let charityName = null;
    if (allocation.success && allocation.charityId) {
      const { data: charity } = await supabaseAdmin
        .from("charities")
        .select("name")
        .eq("id", allocation.charityId)
        .single();
      charityName = charity?.name;
    }

    logJson("info", "demo.purchase.completed", {
      user_id: user.id,
      transaction_id: transaction.id,
      amount,
      roundup,
      charity_id: allocation.charityId,
    });

    return NextResponse.json({
      success: true,
      demo: true,
      message: "Purchase simulated successfully!",
      transaction: {
        id: transaction.id,
        merchant: merchant.name,
        category: merchant.category[0],
        amount: amount,
        roundup: roundup,
        date: todayDate(),
      },
      donation: {
        allocated: allocation.success,
        charity_id: allocation.charityId,
        charity_name: charityName,
        amount: roundup,
      },
      explanation: {
        purchase: `You bought something at ${merchant.name} for $${amount.toFixed(2)}`,
        roundup: `Rounded up to $${Math.ceil(amount).toFixed(2)} = $${roundup.toFixed(2)} donation`,
        impact: charityName 
          ? `$${roundup.toFixed(2)} donated to ${charityName}!`
          : "Round-up saved for your next charity selection",
      },
    });

  } catch (error) {
    logJson("error", "demo.purchase.error", { error });
    return NextResponse.json(
      { error: "Failed to simulate purchase" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    description: "Simulate a purchase for demo purposes",
    usage: "POST /api/demo/simulate-purchase",
    optional_body: {
      amount: "Custom amount (e.g., 7.49)",
      merchant: "Custom merchant name (e.g., 'Coffee Shop')",
    },
    example_response: {
      success: true,
      transaction: {
        merchant: "Starbucks",
        amount: 5.75,
        roundup: 0.25,
      },
      donation: {
        charity_name: "Red Cross",
        amount: 0.25,
      },
    },
  });
}
