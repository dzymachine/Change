"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PurchaseResult {
  success: boolean;
  transaction: {
    merchant: string;
    category: string;
    amount: number;
    roundup: number;
    date: string;
  };
  donation: {
    allocated: boolean;
    charity_name: string | null;
    amount: number;
  };
}

type DemoStep = "idle" | "processing" | "complete";

export function SimulatePurchase() {
  const router = useRouter();
  const [step, setStep] = useState<DemoStep>("idle");
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("25.47");

  const calculateRoundup = (value: number) => {
    if (isNaN(value) || value <= 0) return 0;
    return Math.ceil(value) - value;
  };

  const simulatePurchase = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setError(null);
    setResult(null);
    setStep("processing");

    try {
      const response = await fetch("/api/demo/simulate-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to simulate purchase");
      }

      await delay(600);
      setResult(data);
      setStep("complete");

      // Refresh page and close modal after 2 seconds
      setTimeout(() => {
        router.refresh();
        setShowModal(false);
        setStep("idle");
        setResult(null);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("idle");
    }
  };

  return (
    <>
      <div 
        className="p-4"
        style={{
          border: "1px dashed var(--border)",
          backgroundColor: "rgba(162, 137, 108, 0.03)",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left: Label */}
          <div className="flex items-center gap-3">
            <span 
              className="font-mono text-xs uppercase tracking-wider px-2 py-1"
              style={{ 
                backgroundColor: "rgba(162, 137, 108, 0.15)",
                color: "var(--tan-dark)",
              }}
            >
              Demo
            </span>
            <span 
              className="font-body text-sm"
              style={{ color: "var(--muted)" }}
            >
              Test the round-up flow
            </span>
          </div>

          {/* Right: Button */}
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 font-body text-sm transition-all duration-200"
            style={{
              backgroundColor: "var(--cyan)",
              color: "var(--white)",
              fontWeight: 500,
            }}
          >
            Simulate Purchase
          </button>
        </div>
      </div>

      {/* Amount Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => step !== "processing" && setShowModal(false)}
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
              Simulate a Purchase
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
                    disabled={step === "processing"}
                  />
                </div>
                <p 
                  className="font-mono text-xs mt-2"
                  style={{ color: "var(--muted)" }}
                >
                  Round-up will be: ${calculateRoundup(parseFloat(amount) || 0).toFixed(2)}
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
                    disabled={step === "processing"}
                  >
                    ${quickAmount}
                  </button>
                ))}
              </div>

              {/* Processing state */}
              {step === "processing" && (
                <div 
                  className="p-3 font-body text-sm flex items-center gap-2"
                  style={{ backgroundColor: "rgba(162, 137, 108, 0.08)" }}
                >
                  <div 
                    className="w-4 h-4 border-2 border-t-transparent animate-spin rounded-full"
                    style={{ borderColor: "var(--green)", borderTopColor: "transparent" }}
                  />
                  <span style={{ color: "var(--muted)" }}>Processing...</span>
                </div>
              )}

              {/* Success result */}
              {step === "complete" && result && (
                <div 
                  className="p-3 font-body text-sm space-y-1"
                  style={{ backgroundColor: "rgba(0, 122, 85, 0.08)" }}
                >
                  <div style={{ color: "var(--green)", fontWeight: 500 }}>
                    Purchase simulated!
                  </div>
                  <div style={{ color: "var(--foreground)" }}>
                    {result.transaction.merchant} — ${result.transaction.amount.toFixed(2)}
                  </div>
                  <div style={{ color: "var(--green)" }}>
                    +${result.transaction.roundup.toFixed(2)} donated
                    {result.donation.charity_name && ` to ${result.donation.charity_name}`}
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div 
                  className="p-3 font-body text-sm"
                  style={{
                    backgroundColor: "rgba(172, 52, 34, 0.08)",
                    color: "var(--red)",
                  }}
                >
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setError(null);
                    setStep("idle");
                    setResult(null);
                  }}
                  disabled={step === "processing"}
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
                  onClick={simulatePurchase}
                  disabled={step === "processing" || step === "complete"}
                  className="flex-1 py-3 font-body text-sm transition-all duration-200 disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--cyan)",
                    color: "var(--white)",
                    fontWeight: 500,
                  }}
                >
                  {step === "processing" ? "Processing..." : "Simulate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
