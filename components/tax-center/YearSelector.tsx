"use client";

import { useRouter } from "next/navigation";

interface YearSelectorProps {
  selectedYear: number;
  availableYears: number[];
}

export function YearSelector({ selectedYear, availableYears }: YearSelectorProps) {
  const router = useRouter();

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value;
    router.push(`/tax-center?year=${year}`);
  };

  return (
    <select
      value={selectedYear}
      onChange={handleYearChange}
      className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        color: "var(--foreground)",
      }}
    >
      {availableYears.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  );
}
