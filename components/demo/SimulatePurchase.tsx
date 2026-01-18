"use client";

import { useState } from "react";

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
  const [step, setStep] = useState<DemoStep>("idle");
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const simulatePurchase = async () => {
    setError(null);
    setResult(null);
    setStep("processing");

    try {
      const response = await fetch("/api/demo/simulate-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to simulate purchase");
      }

      await delay(600);
      setResult(data);
      setStep("complete");

      // Auto-reset after 5 seconds
      setTimeout(() => {
        setStep("idle");
        setResult(null);
      }, 5000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("idle");
    }
  };

  return (
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

        {/* Right: Button or Status */}
        <div className="flex items-center gap-3">
          {step === "idle" && !error && (
            <button
              onClick={simulatePurchase}
              className="px-4 py-2 font-body text-sm transition-all duration-200"
              style={{
                backgroundColor: "var(--cyan)",
                color: "var(--white)",
                fontWeight: 500,
              }}
            >
              Simulate Purchase
            </button>
          )}

          {step === "processing" && (
            <div className="flex items-center gap-2 font-body text-sm" style={{ color: "var(--muted)" }}>
              <div 
                className="w-4 h-4 border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--green)", borderTopColor: "transparent" }}
              />
              <span>Processing...</span>
            </div>
          )}

          {step === "complete" && result && (
            <div className="flex items-center gap-3 font-body text-sm animate-fadeIn">
              <span style={{ color: "var(--muted)" }}>
                {result.transaction.merchant}
              </span>
              <span style={{ color: "var(--foreground)", fontWeight: 500 }}>
                ${result.transaction.amount.toFixed(2)}
              </span>
              <span style={{ color: "var(--green)", fontWeight: 600 }}>
                +${result.transaction.roundup.toFixed(2)} donated
              </span>
              {result.donation.charity_name && (
                <span style={{ color: "var(--muted)" }}>
                  → {result.donation.charity_name}
                </span>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 font-body text-sm">
              <span style={{ color: "var(--red)" }}>{error}</span>
              <button
                onClick={() => setError(null)}
                style={{ color: "var(--muted)" }}
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
