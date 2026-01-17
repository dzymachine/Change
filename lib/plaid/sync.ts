// Transaction sync logic
// This module handles syncing transactions from Plaid

import { supabaseAdmin } from "@/lib/supabase/admin";
import { calculateRoundup } from "@/lib/donations/calculate";
import { plaidClient } from "./client";
import { Transaction as PlaidTransactionType, RemovedTransaction } from "plaid";

interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name?: string | null;
  category?: string[] | null;
  pending: boolean;
}

// Store cursor for incremental sync per item
const syncCursors: Map<string, string> = new Map();

/**
 * Sync transactions for a specific Plaid item
 * Called when webhook notifies us of new transactions
 */
export async function syncTransactionsForItem(itemId: string): Promise<void> {
  console.log(`Starting transaction sync for item: ${itemId}`);

  // Get the linked account from our database
  const { data: linkedAccount, error: fetchError } = await supabaseAdmin
    .from("linked_accounts")
    .select("id, user_id, plaid_access_token")
    .eq("plaid_item_id", itemId)
    .single();

  if (fetchError || !linkedAccount) {
    console.error("Failed to find linked account:", fetchError);
    return;
  }

  try {
    // Get cursor for incremental sync
    const cursor = syncCursors.get(itemId);

    // Fetch transactions from Plaid using sync endpoint
    const response = await plaidClient.transactionsSync({
      access_token: linkedAccount.plaid_access_token,
      cursor: cursor,
    });

    const { added, modified, removed, next_cursor, has_more } = response.data;

    // Process transactions
    await processNewTransactions(
      linkedAccount.id, 
      linkedAccount.user_id, 
      added.map(mapPlaidTransaction)
    );
    await processModifiedTransactions(
      linkedAccount.id, 
      modified.map(mapPlaidTransaction)
    );
    await processRemovedTransactions(
      removed.map((r: RemovedTransaction) => r.transaction_id)
    );

    // Store cursor for next sync
    syncCursors.set(itemId, next_cursor);

    // If there are more transactions, continue syncing
    if (has_more) {
      await syncTransactionsForItem(itemId);
    }

    console.log(`Synced ${added.length} new, ${modified.length} modified, ${removed.length} removed transactions`);
  } catch (error) {
    console.error("Error syncing transactions:", error);
  }
}

/**
 * Map Plaid SDK transaction to our internal format
 */
function mapPlaidTransaction(tx: PlaidTransactionType): PlaidTransaction {
  return {
    transaction_id: tx.transaction_id,
    account_id: tx.account_id,
    amount: tx.amount,
    date: tx.date,
    name: tx.name,
    merchant_name: tx.merchant_name,
    category: tx.category,
    pending: tx.pending,
  };
}

/**
 * Process newly added transactions
 */
async function processNewTransactions(
  linkedAccountId: string,
  userId: string,
  transactions: PlaidTransaction[]
): Promise<void> {
  const transactionsToInsert = transactions
    .filter((tx) => !isChangeTransaction(tx)) // Filter out our own donations
    .filter((tx) => tx.amount > 0) // Only process debits (spending)
    .map((tx) => ({
      user_id: userId,
      linked_account_id: linkedAccountId,
      plaid_transaction_id: tx.transaction_id,
      amount: tx.amount,
      roundup_amount: calculateRoundup(tx.amount),
      merchant_name: tx.merchant_name || tx.name,
      category: tx.category,
      date: tx.date,
      is_pending: tx.pending,
      is_donation: false,
      processed_for_donation: false,
    }));

  if (transactionsToInsert.length === 0) {
    console.log("No new transactions to insert");
    return;
  }

  const { error } = await supabaseAdmin
    .from("transactions")
    .upsert(transactionsToInsert, {
      onConflict: "plaid_transaction_id",
    });

  if (error) {
    console.error("Failed to insert transactions:", error);
  } else {
    console.log(`Inserted ${transactionsToInsert.length} transactions`);
  }
}

/**
 * Check if a transaction is from our own app (donation)
 * This prevents infinite round-up loops
 */
function isChangeTransaction(tx: PlaidTransaction): boolean {
  const name = (tx.name || "").toLowerCase();
  const merchantName = (tx.merchant_name || "").toLowerCase();

  return (
    name.includes("change_donation") ||
    name.includes("change app") ||
    merchantName.includes("change") ||
    // Add any other identifiers for your donation processor
    (name.includes("stripe") && name.includes("change"))
  );
}

/**
 * Process modified transactions (status changes, etc.)
 */
async function processModifiedTransactions(
  linkedAccountId: string,
  transactions: PlaidTransaction[]
): Promise<void> {
  for (const tx of transactions) {
    await supabaseAdmin
      .from("transactions")
      .update({
        amount: tx.amount,
        roundup_amount: calculateRoundup(tx.amount),
        is_pending: tx.pending,
      })
      .eq("plaid_transaction_id", tx.transaction_id);
  }
}

/**
 * Process removed transactions
 */
async function processRemovedTransactions(
  transactionIds: string[]
): Promise<void> {
  if (transactionIds.length === 0) return;

  await supabaseAdmin
    .from("transactions")
    .delete()
    .in("plaid_transaction_id", transactionIds);

  console.log(`Removed ${transactionIds.length} transactions`);
}
