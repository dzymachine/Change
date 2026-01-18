// Transaction sync logic
// This module handles syncing transactions from Plaid

import { supabaseAdmin } from "@/lib/supabase/admin";
import { calculateRoundup } from "@/lib/donations/calculate";
import { allocateRoundupToCharity } from "@/lib/donations/allocate";
import { plaidClient } from "./client";
import { Transaction as PlaidTransactionType, RemovedTransaction } from "plaid";
import { logJson } from "@/lib/log-json";

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

/**
 * Sync transactions for a specific Plaid item
 * Called when webhook notifies us of new transactions
 */
export async function syncTransactionsForItem(
  itemId: string,
  ctx?: { traceId?: string; trigger?: "webhook" | "manual" | "link"; webhook_code?: string }
): Promise<void> {
  const traceId = ctx?.traceId ?? `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  logJson("info", "plaid.sync.start", {
    trace_id: traceId,
    item_id: itemId,
    trigger: ctx?.trigger ?? null,
    webhook_code: ctx?.webhook_code ?? null,
  });

  // Get the linked account from our database
  const { data: linkedAccount, error: fetchError } = await supabaseAdmin
    .from("linked_accounts")
    .select("id, user_id, plaid_access_token, sync_cursor")
    .eq("plaid_item_id", itemId)
    .single();

  if (fetchError || !linkedAccount) {
    logJson("error", "plaid.sync.no_linked_account", {
      trace_id: traceId,
      item_id: itemId,
      error: fetchError?.message ?? fetchError ?? "unknown",
    });
    return;
  }

  try {
    // Get cursor for incremental sync from database
    const cursor = linkedAccount.sync_cursor || undefined;

    // Fetch transactions from Plaid using sync endpoint
    const response = await plaidClient.transactionsSync({
      access_token: linkedAccount.plaid_access_token,
      cursor: cursor,
    });

    const { added, modified, removed, next_cursor, has_more } = response.data;
    logJson("info", "plaid.sync.fetched", {
      trace_id: traceId,
      item_id: itemId,
      linked_account_id: linkedAccount.id,
      user_id: linkedAccount.user_id,
      cursor_present: Boolean(cursor),
      added: added.length,
      modified: modified.length,
      removed: removed.length,
      has_more,
    });

    // Process transactions
    const newTxCount = await processNewTransactions(
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

    // Store cursor in database for next sync
    await supabaseAdmin
      .from("linked_accounts")
      .update({
        sync_cursor: next_cursor,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", linkedAccount.id);

    // If there are more transactions, continue syncing
    if (has_more) {
      await syncTransactionsForItem(itemId, { ...ctx, traceId });
    }

    logJson("info", "plaid.sync.applied", {
      trace_id: traceId,
      item_id: itemId,
      inserted_or_upserted: newTxCount,
      added: added.length,
      modified: modified.length,
      removed: removed.length,
      has_more,
    });

    // Process donations for new settled transactions
    if (newTxCount > 0) {
      await processNewDonations(linkedAccount.user_id);
    }
  } catch (error) {
    logJson("error", "plaid.sync.error", { trace_id: traceId, item_id: itemId, error });
  }
}

/**
 * Process donations for newly synced transactions
 * Allocates round-ups to charities based on user's donation mode
 */
async function processNewDonations(userId: string): Promise<void> {
  // Get unprocessed, settled transactions
  const { data: transactions, error } = await supabaseAdmin
    .from("transactions")
    .select("id, roundup_amount")
    .eq("user_id", userId)
    .eq("processed_for_donation", false)
    .eq("is_pending", false)
    .eq("is_donation", false);

  if (error || !transactions || transactions.length === 0) {
    return;
  }

  // Process each transaction
  for (const tx of transactions) {
    const result = await allocateRoundupToCharity(userId, tx.id, tx.roundup_amount);
    if (result.success && result.charityId) {
      console.log(
        `Allocated $${tx.roundup_amount} to charity ${result.charityId}`
      );
    }
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
 * Returns the number of transactions inserted
 */
async function processNewTransactions(
  linkedAccountId: string,
  userId: string,
  transactions: PlaidTransaction[]
): Promise<number> {
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
    return 0;
  }

  const { error } = await supabaseAdmin
    .from("transactions")
    .upsert(transactionsToInsert, {
      onConflict: "plaid_transaction_id",
    });

  if (error) {
    console.error("Failed to insert transactions:", error);
    return 0;
  }

  console.log(`Inserted ${transactionsToInsert.length} transactions`);
  return transactionsToInsert.length;
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
