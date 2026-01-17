"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>("YTD");
  const [isSimulating, setIsSimulating] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [amount, setAmount] = useState("25.47");
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Mark when we're on the client to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const handleSimulate = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setResult({ success: false, message: "Please enter a valid amount" });
      return;
    }

    setIsSimulating(true);
    setResult(null);

    try {
      const response = await fetch("/api/debug/simulate-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const roundup = parseFloat(data.transaction?.roundup || "0").toFixed(2);
        setResult({ 
          success: true, 
          message: `Transaction of $${numAmount.toFixed(2)} created! Round-up: $${roundup}` 
        });
        // Refresh the page to show updated data
        setTimeout(() => {
          router.refresh();
          setShowAmountModal(false);
          setResult(null);
        }, 2000);
      } else {
        setResult({ 
          success: false, 
          message: data.error || "Failed to simulate transaction" 
        });
      }
    } catch (error) {
      setResult({ 
        success: false, 
        message: "Network error - please try again" 
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const timeRanges: TimeRange[] = ["1W", "1M", "3M", "YTD", "1Y", "ALL"];

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total donated</p>
            <p className="text-4xl font-bold text-black">${totalDonated.toFixed(2)}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAmountModal(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Simulate Payment
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

            <path
              d={createAreaPath(chartData)}
              fill="url(#chartGradient)"
              className="transition-all duration-500"
            />

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

      {/* Amount Selection Modal */}
      {showAmountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isSimulating && setShowAmountModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4 text-black">Simulate a Transaction</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="w-full pl-7 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-black"
                    placeholder="25.47"
                    disabled={isSimulating}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Round-up will be: ${(Math.ceil(parseFloat(amount) || 0) - (parseFloat(amount) || 0)).toFixed(2) || "0.00"}
                </p>
              </div>

              {/* Quick amount buttons */}
              <div className="flex gap-2">
                {[5.47, 12.89, 25.33, 47.62].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount.toString())}
                    className="flex-1 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors text-black"
                    disabled={isSimulating}
                  >
                    ${quickAmount}
                  </button>
                ))}
              </div>

              {result && (
                <div className={`p-3 rounded-lg text-sm ${
                  result.success 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "bg-red-50 text-red-700"
                }`}>
                  {result.message}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAmountModal(false)}
                  disabled={isSimulating}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isSimulating ? "Processing..." : "Simulate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
