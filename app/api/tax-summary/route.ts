import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface CharityDonationSummary {
  charityId: string;
  charityName: string;
  charityCategory: string | null;
  totalAmount: number;
  donationCount: number;
  firstDonation: string | null;
  lastDonation: string | null;
}

export interface TaxSummaryData {
  year: number;
  totalDonated: number;
  totalTransactions: number;
  charitiesSupported: number;
  charityBreakdown: CharityDonationSummary[];
  monthlyBreakdown: { month: string; amount: number }[];
  averageDonation: number;
  projectedAnnual: number;
}

/**
 * GET /api/tax-summary
 * 
 * Returns aggregated donation data for tax purposes.
 * Query params:
 * - year: The tax year to summarize (defaults to current year)
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

    // Fetch all processed transactions (roundups) for this user in the specified year
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
      .lte("date", endDate);

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

    // Fetch user charities for name lookup (denormalized data)
    const { data: userCharities } = await supabase
      .from("user_charities")
      .select("charity_id, charity_name, charity_category")
      .eq("user_id", user.id);

    // Create a map for quick charity lookup
    const charityMap = new Map<string, { name: string; category: string | null }>();
    userCharities?.forEach((uc) => {
      charityMap.set(uc.charity_id, {
        name: uc.charity_name || "Unknown Charity",
        category: uc.charity_category || null,
      });
    });

    // Also fetch from charities table for any charities not in user_charities
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

    // Aggregate by charity
    const charityAggregates = new Map<string, {
      totalAmount: number;
      donationCount: number;
      firstDonation: Date | null;
      lastDonation: Date | null;
    }>();

    const monthlyTotals = new Map<string, number>();

    donations?.forEach((donation) => {
      const charityId = donation.charity_id;
      const amount = parseFloat(String(donation.amount)) || 0;
      const donationDate = new Date(donation.created_at);

      // Aggregate by charity
      const existing = charityAggregates.get(charityId) || {
        totalAmount: 0,
        donationCount: 0,
        firstDonation: null,
        lastDonation: null,
      };

      existing.totalAmount += amount;
      existing.donationCount += 1;

      if (!existing.firstDonation || donationDate < existing.firstDonation) {
        existing.firstDonation = donationDate;
      }
      if (!existing.lastDonation || donationDate > existing.lastDonation) {
        existing.lastDonation = donationDate;
      }

      charityAggregates.set(charityId, existing);

      // Aggregate by month
      const monthKey = `${donationDate.getFullYear()}-${String(donationDate.getMonth() + 1).padStart(2, "0")}`;
      monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + amount);
    });

    // Build charity breakdown array
    const charityBreakdown: CharityDonationSummary[] = Array.from(charityAggregates.entries())
      .map(([charityId, data]) => {
        const charityInfo = charityMap.get(charityId) || { name: "Unknown Charity", category: null };
        return {
          charityId,
          charityName: charityInfo.name,
          charityCategory: charityInfo.category,
          totalAmount: Math.round(data.totalAmount * 100) / 100,
          donationCount: data.donationCount,
          firstDonation: data.firstDonation?.toISOString().split("T")[0] || null,
          lastDonation: data.lastDonation?.toISOString().split("T")[0] || null,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // Build monthly breakdown
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyBreakdown = monthNames.map((monthName, index) => {
      const monthKey = `${year}-${String(index + 1).padStart(2, "0")}`;
      return {
        month: monthName,
        amount: Math.round((monthlyTotals.get(monthKey) || 0) * 100) / 100,
      };
    });

    // Calculate totals
    const totalDonated = charityBreakdown.reduce((sum, c) => sum + c.totalAmount, 0);
    const totalTransactions = charityBreakdown.reduce((sum, c) => sum + c.donationCount, 0);
    const charitiesSupported = charityBreakdown.length;
    const averageDonation = totalTransactions > 0 ? totalDonated / totalTransactions : 0;

    // Calculate projected annual (extrapolate from current pace)
    const now = new Date();
    const currentYear = now.getFullYear();
    let projectedAnnual = totalDonated;

    if (year === currentYear && totalDonated > 0) {
      const dayOfYear = Math.floor(
        (now.getTime() - new Date(currentYear, 0, 0).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysInYear = 365;
      projectedAnnual = (totalDonated / dayOfYear) * daysInYear;
    }

    const summary: TaxSummaryData = {
      year,
      totalDonated: Math.round(totalDonated * 100) / 100,
      totalTransactions,
      charitiesSupported,
      charityBreakdown,
      monthlyBreakdown,
      averageDonation: Math.round(averageDonation * 100) / 100,
      projectedAnnual: Math.round(projectedAnnual * 100) / 100,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Tax summary API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
