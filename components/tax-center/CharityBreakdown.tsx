"use client";

import { formatCurrency } from "@/lib/utils/currency";
import type { CharityDonationSummary } from "@/app/api/tax-summary/route";

interface CharityBreakdownProps {
  charities: CharityDonationSummary[];
  totalDonated: number;
}

export function CharityBreakdown({ charities, totalDonated }: CharityBreakdownProps) {
  if (charities.length === 0) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <p style={{ color: "var(--muted)" }}>
          No donations recorded for this year yet.
        </p>
        <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
          Keep making purchases with round-ups enabled to see your giving summary here.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
          Donations by Charity
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Breakdown of your tax-deductible contributions
        </p>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {charities.map((charity) => {
          const percentage = totalDonated > 0 
            ? Math.round((charity.totalAmount / totalDonated) * 100) 
            : 0;

          return (
            <div
              key={charity.charityId}
              className="p-4 flex items-center justify-between hover:bg-opacity-50 transition-colors"
              style={{ backgroundColor: "transparent" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p 
                    className="font-medium truncate"
                    style={{ color: "var(--foreground)" }}
                  >
                    {charity.charityName}
                  </p>
                  {charity.charityCategory && (
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full shrink-0"
                      style={{ 
                        backgroundColor: "var(--accent)",
                        color: "var(--accent-foreground)",
                      }}
                    >
                      {charity.charityCategory}
                    </span>
                  )}
                </div>
                <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                  {charity.donationCount} donation{charity.donationCount !== 1 ? "s" : ""}
                  {charity.firstDonation && charity.lastDonation && (
                    <span>
                      {" "}
                      &middot; {formatDateRange(charity.firstDonation, charity.lastDonation)}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {/* Percentage bar */}
                <div className="hidden sm:flex items-center gap-2 w-32">
                  <div 
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: "var(--border)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: "var(--accent-foreground)",
                      }}
                    />
                  </div>
                  <span 
                    className="text-xs w-8 text-right"
                    style={{ color: "var(--muted)" }}
                  >
                    {percentage}%
                  </span>
                </div>

                {/* Amount */}
                <p 
                  className="font-semibold text-right min-w-[80px]"
                  style={{ color: "var(--foreground)" }}
                >
                  {formatCurrency(charity.totalAmount)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total row */}
      <div 
        className="p-4 flex items-center justify-between"
        style={{ 
          backgroundColor: "var(--accent)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <p 
          className="font-semibold"
          style={{ color: "var(--accent-foreground)" }}
        >
          Total Tax-Deductible Donations
        </p>
        <p 
          className="font-bold text-lg"
          style={{ color: "var(--accent-foreground)" }}
        >
          {formatCurrency(totalDonated)}
        </p>
      </div>
    </div>
  );
}

function formatDateRange(first: string, last: string): string {
  const firstDate = new Date(first);
  const lastDate = new Date(last);
  
  const formatOptions: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  
  if (first === last) {
    return firstDate.toLocaleDateString("en-US", formatOptions);
  }
  
  return `${firstDate.toLocaleDateString("en-US", formatOptions)} - ${lastDate.toLocaleDateString("en-US", formatOptions)}`;
}
