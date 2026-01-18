"use client";

import { formatCurrency } from "@/lib/utils/currency";

interface TaxSummaryCardProps {
  totalDonated: number;
  totalTransactions: number;
  charitiesSupported: number;
  averageDonation: number;
}

export function TaxSummaryCard({
  totalDonated,
  totalTransactions,
  charitiesSupported,
  averageDonation,
}: TaxSummaryCardProps) {
  const stats = [
    {
      label: "Total Donated",
      value: formatCurrency(totalDonated),
      sublabel: "Tax-deductible",
      highlight: true,
    },
    {
      label: "Transactions",
      value: totalTransactions.toLocaleString(),
      sublabel: "Round-ups processed",
      highlight: false,
    },
    {
      label: "Charities",
      value: charitiesSupported.toString(),
      sublabel: "Organizations supported",
      highlight: false,
    },
    {
      label: "Average",
      value: formatCurrency(averageDonation),
      sublabel: "Per donation",
      highlight: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl p-5 transition-all"
          style={{
            backgroundColor: stat.highlight 
              ? "var(--accent)" 
              : "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <p 
            className="text-sm font-medium mb-1"
            style={{ color: "var(--muted)" }}
          >
            {stat.label}
          </p>
          <p 
            className="text-2xl font-bold"
            style={{ color: stat.highlight ? "var(--accent-foreground)" : "var(--foreground)" }}
          >
            {stat.value}
          </p>
          <p 
            className="text-xs mt-1"
            style={{ color: "var(--muted)" }}
          >
            {stat.sublabel}
          </p>
        </div>
      ))}
    </div>
  );
}
