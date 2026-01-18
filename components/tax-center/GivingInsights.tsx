"use client";

import { formatCurrency } from "@/lib/utils/currency";
import type { CharityDonationSummary } from "@/app/api/tax-summary/route";

interface GivingInsightsProps {
  projectedAnnual: number;
  topCharity: CharityDonationSummary | undefined;
  totalDonated: number;
}

export function GivingInsights({ 
  projectedAnnual, 
  topCharity,
  totalDonated,
}: GivingInsightsProps) {
  const topCharityPercentage = topCharity && totalDonated > 0
    ? Math.round((topCharity.totalAmount / totalDonated) * 100)
    : 0;

  return (
    <div
      className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      style={{
        backgroundColor: "var(--accent)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">
          <svg
            className="w-6 h-6"
            style={{ color: "var(--accent-foreground)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
            />
          </svg>
        </span>
        <div>
          <p 
            className="font-medium"
            style={{ color: "var(--accent-foreground)" }}
          >
            At your current pace: {formatCurrency(projectedAnnual)} by Dec 31
          </p>
          {topCharity && (
            <p 
              className="text-sm"
              style={{ color: "var(--muted)" }}
            >
              Top charity: {topCharity.charityName} ({topCharityPercentage}% of giving)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
