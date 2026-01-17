"use client";

import { useState, useMemo } from "react";

interface DonationChartProps {
  totalDonated: number;
  donationHistory?: { date: string; amount: number }[];
}

type TimeRange = "1W" | "1M" | "3M" | "YTD" | "1Y" | "ALL";

export function DonationChart({ totalDonated, donationHistory = [] }: DonationChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("YTD");
  const [isSimulating, setIsSimulating] = useState(false);

  // Generate mock data for the chart based on time range
  const chartData = useMemo(() => {
    const now = new Date();
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
        days = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24));
        break;
      case "1Y":
        days = 365;
        break;
      case "ALL":
        days = 730;
        break;
    }

    // Generate smooth curve data points
    const points: number[] = [];
    const numPoints = Math.min(days, 50);
    let cumulative = 0;
    const avgDailyDonation = totalDonated / (days || 1);

    for (let i = 0; i < numPoints; i++) {
      // Add some variation but trend upward
      const variance = (Math.random() - 0.3) * avgDailyDonation * 0.5;
      cumulative += avgDailyDonation * (days / numPoints) + variance;
      points.push(Math.max(0, cumulative));
    }

    // Normalize to end at totalDonated
    const factor = totalDonated / (points[points.length - 1] || 1);
    return points.map((p) => p * factor);
  }, [timeRange, totalDonated]);

  // Create SVG path from data points
  const createPath = (data: number[]) => {
    if (data.length < 2) return "";

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

    // Create smooth curve using cubic bezier
    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) / 3;
      const cpx2 = prev.x + (2 * (curr.x - prev.x)) / 3;
      path += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    return path;
  };

  const createAreaPath = (data: number[]) => {
    const linePath = createPath(data);
    if (!linePath) return "";

    const width = 800;
    const height = 200;
    const padding = 20;

    // Close the path to create an area
    return `${linePath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;
  };

  const handleSimulate = () => {
    setIsSimulating(true);
    // Simulate a round-up animation
    setTimeout(() => setIsSimulating(false), 1500);
  };

  const timeRanges: TimeRange[] = ["1W", "1M", "3M", "YTD", "1Y", "ALL"];

  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500 mb-1">Total donated</p>
          <p className="text-4xl font-bold text-black">${totalDonated.toFixed(2)}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isSimulating ? "Simulating..." : "Simulate round-up"}
          </button>

          <div className="flex items-center bg-gray-100 rounded-full p-1">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  timeRange === range
                    ? "bg-black text-white"
                    : "text-gray-600 hover:text-black"
                }`}
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
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            d={createAreaPath(chartData)}
            fill="url(#chartGradient)"
            className="transition-all duration-500"
          />

          {/* Line */}
          <path
            d={createPath(chartData)}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500"
          />
        </svg>
      </div>
    </div>
  );
}
