"use client";

import { formatCurrency } from "@/lib/utils/currency";

interface MonthlyChartProps {
  monthlyBreakdown: { month: string; amount: number }[];
  year: number;
}

export function MonthlyChart({ monthlyBreakdown, year }: MonthlyChartProps) {
  const maxAmount = Math.max(...monthlyBreakdown.map((m) => m.amount), 1);
  const totalForYear = monthlyBreakdown.reduce((sum, m) => sum + m.amount, 0);

  if (totalForYear === 0) {
    return null; // Don't show chart if no data
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
          Monthly Giving
        </h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Your donation pattern for {year}
        </p>
      </div>

      <div className="flex items-end justify-between gap-2 h-40">
        {monthlyBreakdown.map((month) => {
          const heightPercent = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0;
          const hasAmount = month.amount > 0;

          return (
            <div
              key={month.month}
              className="flex-1 flex flex-col items-center gap-2"
            >
              {/* Bar */}
              <div className="flex-1 w-full flex items-end justify-center">
                <div
                  className="w-full max-w-8 rounded-t transition-all hover:opacity-80 group relative"
                  style={{
                    height: `${Math.max(heightPercent, hasAmount ? 8 : 2)}%`,
                    backgroundColor: hasAmount 
                      ? "var(--accent-foreground)" 
                      : "var(--border)",
                  }}
                >
                  {/* Tooltip */}
                  {hasAmount && (
                    <div 
                      className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap px-2 py-1 rounded text-xs"
                      style={{
                        backgroundColor: "var(--foreground)",
                        color: "var(--background)",
                      }}
                    >
                      {formatCurrency(month.amount)}
                    </div>
                  )}
                </div>
              </div>

              {/* Label */}
              <span 
                className="text-xs"
                style={{ color: "var(--muted)" }}
              >
                {month.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
