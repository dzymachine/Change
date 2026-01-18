import { createClient } from "@/lib/supabase/server";
import { TaxSummaryCard } from "@/components/tax-center/TaxSummaryCard";
import { CharityBreakdown } from "@/components/tax-center/CharityBreakdown";
import { MonthlyChart } from "@/components/tax-center/MonthlyChart";
import { ExportButtons } from "@/components/tax-center/ExportButtons";
import { YearSelector } from "@/components/tax-center/YearSelector";
import { GivingInsights } from "@/components/tax-center/GivingInsights";
import { TaxDisclaimer } from "@/components/tax-center/TaxDisclaimer";
import type { TaxSummaryData } from "@/app/api/tax-summary/route";

interface PageProps {
  searchParams: Promise<{ year?: string }>;
}

export default async function TaxCenterPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const currentYear = new Date().getFullYear();
  const selectedYear = params.year ? parseInt(params.year) : currentYear;
  
  // Generate available years (current year and up to 5 previous years)
  const availableYears = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Fetch tax summary data directly from database for server component
  const startDate = `${selectedYear}-01-01`;
  const endDate = `${selectedYear}-12-31`;

  // Fetch transactions that have been processed for donations
  // This captures simulated transactions and real roundups
  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, donated_to_charity_id, roundup_amount, created_at, date")
    .eq("user_id", user?.id)
    .eq("processed_for_donation", true)
    .not("donated_to_charity_id", "is", null)
    .gte("date", startDate)
    .lte("date", endDate);

  // Transform transactions to donation-like format for processing
  const donations = (transactions || []).map(tx => ({
    id: tx.id,
    charity_id: tx.donated_to_charity_id,
    amount: tx.roundup_amount,
    created_at: tx.created_at,
    status: "completed" as const,
  }));

  // Fetch user charities for name lookup
  const { data: userCharities } = await supabase
    .from("user_charities")
    .select("charity_id, charity_name, charity_category")
    .eq("user_id", user?.id);

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

    const monthKey = `${donationDate.getFullYear()}-${String(donationDate.getMonth() + 1).padStart(2, "0")}`;
    monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + amount);
  });

  // Build charity breakdown
  const charityBreakdown = Array.from(charityAggregates.entries())
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
    const monthKey = `${selectedYear}-${String(index + 1).padStart(2, "0")}`;
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

  // Calculate projected annual
  const now = new Date();
  let projectedAnnual = totalDonated;

  if (selectedYear === currentYear && totalDonated > 0) {
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(currentYear, 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    projectedAnnual = (totalDonated / dayOfYear) * 365;
  }

  const taxData: TaxSummaryData = {
    year: selectedYear,
    totalDonated: Math.round(totalDonated * 100) / 100,
    totalTransactions,
    charitiesSupported,
    charityBreakdown,
    monthlyBreakdown,
    averageDonation: Math.round(averageDonation * 100) / 100,
    projectedAnnual: Math.round(projectedAnnual * 100) / 100,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            Tax Center
          </h1>
          <p style={{ color: "var(--muted)" }} className="mt-1">
            Your donation summary for tax purposes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <YearSelector 
            selectedYear={selectedYear} 
            availableYears={availableYears} 
          />
          <ExportButtons year={selectedYear} />
        </div>
      </div>

      {/* Summary Cards */}
      <TaxSummaryCard
        totalDonated={taxData.totalDonated}
        totalTransactions={taxData.totalTransactions}
        charitiesSupported={taxData.charitiesSupported}
        averageDonation={taxData.averageDonation}
      />

      {/* Insights Banner (only show if there's data and it's current year) */}
      {taxData.totalDonated > 0 && selectedYear === currentYear && (
        <GivingInsights
          projectedAnnual={taxData.projectedAnnual}
          topCharity={taxData.charityBreakdown[0]}
          totalDonated={taxData.totalDonated}
        />
      )}

      {/* Monthly Chart */}
      <MonthlyChart 
        monthlyBreakdown={taxData.monthlyBreakdown} 
        year={selectedYear}
      />

      {/* Charity Breakdown */}
      <CharityBreakdown 
        charities={taxData.charityBreakdown}
        totalDonated={taxData.totalDonated}
      />

      {/* Disclaimer */}
      <TaxDisclaimer />
    </div>
  );
}
