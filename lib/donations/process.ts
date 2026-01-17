/**
 * Donation processing logic
 * 
 * This module handles creating and processing donation batches
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { 
  calculateTotalRoundup, 
  MINIMUM_DONATION_THRESHOLD,
  meetsMinimumThreshold 
} from "./calculate";

interface DonationBatch {
  userId: string;
  charityId: string;
  transactionIds: string[];
  totalAmount: number;
}

/**
 * Create a donation batch from unprocessed transactions
 * Called periodically or when threshold is met
 */
export async function createDonationBatch(userId: string): Promise<DonationBatch | null> {
  // Get user's selected charity
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("selected_charity_id, roundup_enabled")
    .eq("id", userId)
    .single();

  if (!profile?.selected_charity_id || !profile.roundup_enabled) {
    console.log("User has no charity selected or round-ups disabled");
    return null;
  }

  // Get unprocessed transactions
  const { data: transactions, error } = await supabaseAdmin
    .from("transactions")
    .select("id, roundup_amount")
    .eq("user_id", userId)
    .eq("processed_for_donation", false)
    .eq("is_pending", false) // Only process settled transactions
    .eq("is_donation", false);

  if (error || !transactions || transactions.length === 0) {
    console.log("No transactions to process");
    return null;
  }

  // Calculate total
  const roundupAmounts = transactions.map(
    (tx: { roundup_amount: number | null }) => tx.roundup_amount ?? 0
  );
  const totalAmount = calculateTotalRoundup(roundupAmounts);

  // Check minimum threshold
  if (!meetsMinimumThreshold(totalAmount)) {
    console.log(`Total ${totalAmount} below threshold ${MINIMUM_DONATION_THRESHOLD}`);
    return null;
  }

  return {
    userId,
    charityId: profile.selected_charity_id,
    transactionIds: transactions.map((tx: { id: string }) => tx.id),
    totalAmount,
  };
}

/**
 * Process a donation batch
 * Creates donation record and marks transactions as processed
 */
export async function processDonationBatch(batch: DonationBatch): Promise<string | null> {
  const { userId, charityId, transactionIds, totalAmount } = batch;

  // Create donation record
  const { data: donation, error: donationError } = await supabaseAdmin
    .from("donations")
    .insert({
      user_id: userId,
      charity_id: charityId,
      amount: totalAmount,
      transaction_count: transactionIds.length,
      status: "pending",
    })
    .select("id")
    .single();

  if (donationError || !donation) {
    console.error("Failed to create donation:", donationError);
    return null;
  }

  // Mark transactions as processed
  const { error: updateError } = await supabaseAdmin
    .from("transactions")
    .update({ processed_for_donation: true })
    .in("id", transactionIds);

  if (updateError) {
    console.error("Failed to update transactions:", updateError);
    // Should rollback donation record in production
    return null;
  }

  // TODO: Trigger actual payment processing (Stripe, etc.)
  // await processPayment(donation.id, totalAmount);

  return donation.id;
}

/**
 * Get pending donation amount for a user
 * Shows how much has accumulated but not yet been donated
 */
export async function getPendingDonationAmount(userId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("transactions")
    .select("roundup_amount")
    .eq("user_id", userId)
    .eq("processed_for_donation", false)
    .eq("is_pending", false);

  if (error || !data) {
    return 0;
  }

  const total = data.reduce(
    (sum: number, tx: { roundup_amount: number | null }) =>
      sum + (tx.roundup_amount ?? 0),
    0
  );
  return Math.round(total * 100) / 100;
}
