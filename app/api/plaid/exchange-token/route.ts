import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { plaidClient } from "@/lib/plaid/client";
import { syncTransactionsForItem } from "@/lib/plaid/sync";

export async function POST(request: NextRequest) {
  try {
    const { public_token, metadata } = await request.json();

    if (!public_token) {
      return NextResponse.json(
        { error: "Missing public_token" },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const { access_token, item_id } = exchangeResponse.data;

    // Store in database
    const { error: dbError } = await supabase.from("linked_accounts").insert({
      user_id: user.id,
      plaid_item_id: item_id,
      plaid_access_token: access_token,
      institution_name: metadata?.institution?.name,
      institution_id: metadata?.institution?.institution_id,
    });

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to save account" },
        { status: 500 }
      );
    }

    // IMPORTANT: Prime the sync immediately after linking
    // This triggers Plaid to start sending SYNC_UPDATES_AVAILABLE webhooks
    // The sync also saves the initial cursor for future incremental syncs
    console.log(`Priming initial sync for item: ${item_id}`);
    
    // Run sync in background (don't block the response)
    // The sync will save the cursor and any initial transactions
    syncTransactionsForItem(item_id).catch((err) => {
      console.error("Initial sync failed:", err);
    });

    return NextResponse.json({ success: true, item_id });

  } catch (error) {
    console.error("Error exchanging token:", error);
    return NextResponse.json(
      { error: "Failed to exchange token" },
      { status: 500 }
    );
  }
}
