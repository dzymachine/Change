import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/tax-summary/export/csv
 * 
 * Generates a CSV file with donation data for tax purposes.
 * Query params:
 * - year: The tax year to export (defaults to current year)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Parse year from query params
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
    
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Fetch all processed transactions (roundups) for this year
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select(`
        id,
        donated_to_charity_id,
        roundup_amount,
        created_at,
        date
      `)
      .eq("user_id", user.id)
      .eq("processed_for_donation", true)
      .not("donated_to_charity_id", "is", null)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (transactionsError) {
      console.error("Failed to fetch transactions:", transactionsError);
      return NextResponse.json(
        { error: "Failed to fetch donations" },
        { status: 500 }
      );
    }

    // Transform transactions to donation-like format
    const donations = (transactions || []).map(tx => ({
      id: tx.id,
      charity_id: tx.donated_to_charity_id,
      amount: tx.roundup_amount,
      created_at: tx.created_at,
    }));

    // Fetch user charities for name lookup
    const { data: userCharities } = await supabase
      .from("user_charities")
      .select("charity_id, charity_name, charity_category")
      .eq("user_id", user.id);

    // Create charity lookup map
    const charityMap = new Map<string, { name: string; category: string | null }>();
    userCharities?.forEach((uc) => {
      charityMap.set(uc.charity_id, {
        name: uc.charity_name || "Unknown Charity",
        category: uc.charity_category || null,
      });
    });

    // Also fetch from charities table
    const charityIds = [...new Set(donations?.map((d) => d.charity_id) || [])];
    if (charityIds.length > 0) {
      const { data: charitiesData } = await supabase
        .from("charities")
        .select("id, name, category")
        .in("id", charityIds);

      charitiesData?.forEach((c) => {
        if (!charityMap.has(c.id)) {
          charityMap.set(c.id, { name: c.name, category: c.category });
        }
      });
    }

    // Build CSV content
    const headers = ["Date", "Charity Name", "Category", "Amount (USD)", "Donation ID"];
    const rows: string[][] = [];

    donations?.forEach((donation) => {
      const charityInfo = charityMap.get(donation.charity_id) || { 
        name: "Unknown Charity", 
        category: null 
      };
      const date = new Date(donation.created_at).toLocaleDateString("en-US");
      const amount = parseFloat(String(donation.amount)).toFixed(2);

      rows.push([
        date,
        `"${charityInfo.name.replace(/"/g, '""')}"`,
        charityInfo.category || "Uncategorized",
        amount,
        donation.id,
      ]);
    });

    // Add totals row
    const totalAmount = donations?.reduce(
      (sum, d) => sum + parseFloat(String(d.amount)), 
      0
    ) || 0;
    
    rows.push([]);
    rows.push(["", "", "TOTAL", totalAmount.toFixed(2), ""]);

    // Generate CSV string
    const csvContent = [
      `# Change App - Tax Donation Summary for ${year}`,
      `# Generated: ${new Date().toLocaleDateString("en-US")}`,
      `# User: ${user.email}`,
      "",
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Return as downloadable CSV
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="change-tax-summary-${year}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
