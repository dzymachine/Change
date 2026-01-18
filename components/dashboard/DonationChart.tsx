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
      <div 
        className="p-8"
        style={{
          backgroundColor: "var(--white)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
        }}
      >
        <div className="flex items-start justify-between mb-8">
          <div>
            <p 
              className="font-mono text-xs uppercase tracking-widest mb-2"
              style={{ color: "var(--tan)" }}
            >
              Total donated
            </p>
            <p 
              className="font-display text-4xl"
              style={{ color: "var(--foreground)", fontWeight: 500 }}
            >
              ${totalDonated.toFixed(2)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAmountModal(true)}
              className="px-5 py-2.5 font-body text-sm transition-all duration-200"
              style={{
                backgroundColor: "var(--green)",
                color: "var(--white)",
                fontWeight: 500,
                borderRadius: "9999px",
              }}
            >
              Simulate Payment
            </button>

            <div 
              className="flex items-center p-1"
              style={{ backgroundColor: "rgba(162, 137, 108, 0.08)", borderRadius: "9999px" }}
            >
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className="px-3 py-1.5 font-mono text-xs transition-all duration-200"
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

      {/* Amount Selection Modal */}
      {showAmountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !isSimulating && setShowAmountModal(false)}
          />
          <div 
            className="relative w-full max-w-sm mx-4 p-8"
            style={{
              backgroundColor: "var(--white)",
              border: "1px solid var(--border)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              borderRadius: "12px",
            }}
          >
            <h3 
              className="font-display text-xl mb-6"
              style={{ color: "var(--foreground)", fontWeight: 500 }}
            >
              Simulate a Transaction
            </h3>
            
            <div className="space-y-5">
              <div>
                <label 
                  className="block font-body text-sm mb-2"
                  style={{ color: "var(--muted)" }}
                >
                  Transaction Amount
                </label>
                <div className="relative">
                  <span 
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--muted)" }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 font-body text-base transition-all duration-200"
                    style={{
                      backgroundColor: "var(--white)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--green)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                    }}
                    placeholder="25.47"
                    disabled={isSimulating}
                  />
                </div>
                <p 
                  className="font-mono text-xs mt-2"
                  style={{ color: "var(--muted)" }}
                >
                  Round-up will be: ${(Math.ceil(parseFloat(amount) || 0) - (parseFloat(amount) || 0)).toFixed(2) || "0.00"}
                </p>
              </div>

              {/* Quick amount buttons */}
              <div className="flex gap-2">
                {[5.47, 12.89, 25.33, 47.62].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount.toString())}
                    className="flex-1 py-2 font-mono text-sm transition-all duration-200"
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                    disabled={isSimulating}
                  >
                    ${quickAmount}
                  </button>
                ))}
              </div>

              {result && (
                <div 
                  className="p-3 font-body text-sm"
                  style={{
                    backgroundColor: result.success ? "rgba(0, 122, 85, 0.08)" : "rgba(172, 52, 34, 0.08)",
                    color: result.success ? "var(--green)" : "var(--red)",
                  }}
                >
                  {result.message}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAmountModal(false)}
                  disabled={isSimulating}
                  className="flex-1 py-3 font-body text-sm transition-all duration-200 disabled:opacity-50"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--muted)",
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="flex-1 py-3 font-body text-sm transition-all duration-200 disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--green)",
                    color: "var(--white)",
                    fontWeight: 500,
                  }}
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
