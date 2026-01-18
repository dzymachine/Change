import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { plaidClient } from "@/lib/plaid/client";
import { isDebugAuthorized } from "@/lib/debug-auth";
import { syncTransactionsForItem } from "@/lib/plaid/sync";
import { SandboxItemFireWebhookRequestWebhookCodeEnum } from "plaid";

async function readJsonBody(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const text = await request.text();
    if (!text) return {};
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function randomMerchant(): string {
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
  ];
  return merchants[Math.floor(Math.random() * merchants.length)];
}

/**
 * Deterministic sandbox purchase simulation.
 *
 * Uses Plaid Sandbox `/sandbox/transactions/create` to create transactions on demand,
 * then fires a webhook and/or syncs immediately so you can verify DB updates without logs.
 */
export async function POST(request: NextRequest) {
  if (!isDebugAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    return NextResponse.json(
      { error: "Plaid not configured" },
      { status: 500 }
    );
  }

  try {
    const url = new URL(request.url);
    const body = await readJsonBody(request);

    const queryItemId = url.searchParams.get("item_id");
    const queryUserId = url.searchParams.get("user_id");
    const queryCount = url.searchParams.get("count");
    const queryAmount = url.searchParams.get("amount");
    const queryDescription = url.searchParams.get("description");
    const queryFireWebhook = url.searchParams.get("fire_webhook");
    const querySyncNow = url.searchParams.get("sync_now");

    const itemId =
      typeof queryItemId === "string" && queryItemId.length > 0
        ? queryItemId
        : typeof body.item_id === "string"
          ? body.item_id
          : undefined;
    const userId =
      typeof queryUserId === "string" && queryUserId.length > 0
        ? queryUserId
        : typeof body.user_id === "string"
          ? body.user_id
          : undefined;

  const count =
    typeof queryCount === "string" && queryCount.length > 0
      ? Math.min(25, Number.parseInt(queryCount, 10) || 3)
      : typeof body.count === "number" && Number.isFinite(body.count) && body.count > 0
        ? Math.min(25, Math.floor(body.count))
        : 3;
  const amount =
    typeof queryAmount === "string" && queryAmount.length > 0
      ? Number.parseFloat(queryAmount)
      : typeof body.amount === "number" && Number.isFinite(body.amount) && body.amount > 0
        ? body.amount
        : undefined;
  const description =
    typeof queryDescription === "string" && queryDescription.trim().length > 0
      ? queryDescription.trim()
      : typeof body.description === "string" && body.description.trim().length > 0
        ? body.description.trim()
        : undefined;

  const fireWebhook =
    queryFireWebhook === null
      ? body.fire_webhook === undefined
        ? true
        : Boolean(body.fire_webhook)
      : queryFireWebhook !== "false";
  const syncNow =
    querySyncNow === null
      ? body.sync_now === undefined
        ? true
        : Boolean(body.sync_now)
      : querySyncNow !== "false";

  let query = supabaseAdmin
    .from("linked_accounts")
    .select("id, user_id, plaid_access_token, plaid_item_id, institution_name")
    .eq("is_active", true)
    .neq("plaid_access_token", "mock_access_token");

  if (itemId) query = query.eq("plaid_item_id", itemId);
  if (userId) query = query.eq("user_id", userId);

  const { data: linkedAccount, error: fetchError } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError || !linkedAccount) {
    return NextResponse.json(
      {
        error: "No linked Plaid account found",
        details: fetchError?.message,
        requested: { item_id: itemId ?? null, user_id: userId ?? null },
      },
      { status: 404 }
    );
  }

  const date = todayIso();
  const transactions = Array.from({ length: count }).map(() => ({
    date_transacted: date,
    date_posted: date,
    amount: amount ?? Number((Math.random() * 45 + 5).toFixed(2)),
    description: description ?? randomMerchant(),
    iso_currency_code: "USD",
  }));

  // Create transactions in Plaid sandbox
  const createResp = await plaidClient.sandboxTransactionsCreate({
    access_token: linkedAccount.plaid_access_token,
    transactions,
  });

  // Trigger webhook so the "real" flow runs
  let webhookFired: boolean | null = null;
  if (fireWebhook) {
    const wh = await plaidClient.sandboxItemFireWebhook({
      access_token: linkedAccount.plaid_access_token,
      webhook_code: SandboxItemFireWebhookRequestWebhookCodeEnum.SyncUpdatesAvailable,
    });
    webhookFired = wh.data.webhook_fired ?? null;
  }

  // Optionally sync immediately so DB is updated even if webhook is delayed
  if (syncNow) {
    await syncTransactionsForItem(linkedAccount.plaid_item_id, { trigger: "manual" });
  }

  // Return latest (non-mock) transactions for this item to confirm
  const { data: latest } = await supabaseAdmin
    .from("transactions")
    .select("id, plaid_transaction_id, amount, merchant_name, date, created_at")
    .eq("linked_account_id", linkedAccount.id)
    .not("plaid_transaction_id", "like", "mock_tx_%")
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    success: true,
    requested: {
      item_id: itemId ?? null,
      user_id: userId ?? null,
      count,
      amount: amount ?? null,
      description: description ?? null,
      fire_webhook: fireWebhook,
      sync_now: syncNow,
    },
    item_id: linkedAccount.plaid_item_id,
    institution: linkedAccount.institution_name,
    created_count: transactions.length,
    request_id: createResp.data.request_id,
    webhook: fireWebhook ? { fired: webhookFired } : { fired: false },
    sync: syncNow ? { ran: true } : { ran: false },
    latest_plaid_transactions: latest || [],
  });
  } catch (error) {
    const plaidError = (error as { response?: { data?: unknown } })?.response?.data;
    return NextResponse.json(
      {
        error: "Failed to create sandbox transactions",
        details: plaidError || (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}

