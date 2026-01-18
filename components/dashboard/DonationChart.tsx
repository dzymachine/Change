"use client";

import { useState, useMemo } from "react";

interface DonationChartProps {
  totalDonated: number;
  donationHistory?: { date: string; amount: number }[];
}

type TimeRange = "1W" | "1M" | "3M" | "YTD" | "1Y" | "ALL";

// Seeded random for consistent server/client rendering
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function DonationChart({ totalDonated, donationHistory = [] }: DonationChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("YTD");

  // Generate chart data based on time range (deterministic with seeded random)
  const chartData = useMemo(() => {
    let days = 365;

    switch (timeRange) {
      case "1W":
        days = 7;
        break;
      case "1M":
        days = 30;
        break;
      case "3M":
        days = 90;
        break;
      case "YTD":
        days = 17; // Fixed value for YTD to avoid Date differences
        break;
      case "1Y":
        days = 365;
        break;
      case "ALL":
        days = 730;
        break;
    }

    // Generate smooth curve data points with seeded random for consistency
    const points: number[] = [];
    const numPoints = Math.min(days, 50);
    let cumulative = 0;
    const avgDailyDonation = totalDonated / (days || 1);
    const seed = totalDonated * 1000 + days; // Deterministic seed

    for (let i = 0; i < numPoints; i++) {
      const variance = (seededRandom(seed + i) - 0.3) * avgDailyDonation * 0.5;
      cumulative += avgDailyDonation * (days / numPoints) + variance;
      points.push(Math.max(0, cumulative));
    }

    const factor = totalDonated / (points[points.length - 1] || 1);
    return points.map((p) => p * factor);
  }, [timeRange, totalDonated]);

  const createPath = (data: number[]) => {
    if (data.length < 2) return "";

    const fmt = (value: number) => {
      if (!Number.isFinite(value)) return "0";
      return value.toFixed(3);
    };

    const width = 800;
    const height = 200;
    const padding = 20;
    const maxValue = Math.max(...data) * 1.1 || 1;

    const xStep = (width - padding * 2) / (data.length - 1);

    const points = data.map((value, index) => {
      const x = padding + index * xStep;
      const y = height - padding - (value / maxValue) * (height - padding * 2);
      return { x, y };
    });

    let path = `M ${fmt(points[0].x)} ${fmt(points[0].y)}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) / 3;
      const cpx2 = prev.x + (2 * (curr.x - prev.x)) / 3;
      path += ` C ${fmt(cpx1)} ${fmt(prev.y)}, ${fmt(cpx2)} ${fmt(curr.y)}, ${fmt(curr.x)} ${fmt(curr.y)}`;
    }

    return path;
  };

  const createAreaPath = (data: number[]) => {
    const linePath = createPath(data);
    if (!linePath) return "";

    const width = 800;
    const height = 200;
    const padding = 20;

    return `${linePath} L ${(width - padding).toFixed(3)} ${(height - padding).toFixed(3)} L ${padding.toFixed(3)} ${(height - padding).toFixed(3)} Z`;
  };

  const timeRanges: TimeRange[] = ["1W", "1M", "3M", "YTD", "1Y", "ALL"];

  return (
      <div 
        className="p-4 sm:p-8"
        style={{
          backgroundColor: "var(--white)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8">
          <div>
            <p 
              className="font-mono text-xs uppercase tracking-widest mb-2"
              style={{ color: "var(--tan)" }}
            >
              Total donated
            </p>
            <p 
              className="font-display text-3xl sm:text-4xl"
              style={{ color: "var(--foreground)", fontWeight: 500 }}
            >
              ${totalDonated.toFixed(2)}
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <div 
              className="flex items-center p-1 overflow-x-auto"
              style={{ backgroundColor: "rgba(162, 137, 108, 0.08)", borderRadius: "9999px" }}
            >
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className="px-3 py-1.5 font-mono text-xs transition-all duration-200 shrink-0"
                  style={{
                    backgroundColor: timeRange === range ? "var(--white)" : "transparent",
                    color: timeRange === range ? "var(--foreground)" : "var(--muted)",
                    fontWeight: timeRange === range ? 600 : 400,
                    boxShadow: timeRange === range ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    borderRadius: "9999px",
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative h-48">
          <svg
            viewBox="0 0 800 200"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#007a55" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#007a55" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            <path
              d={createAreaPath(chartData)}
              fill="url(#chartGradient)"
              className="transition-all duration-500"
            />

            <path
              d={createPath(chartData)}
              fill="none"
              stroke="#007a55"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500"
            />
          </svg>
        </div>
      </div>
  );
}
