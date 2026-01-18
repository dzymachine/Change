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
  explanation: {
    purchase: string;
    roundup: string;
    impact: string;
  };
}

type DemoStep = "idle" | "purchasing" | "processing" | "donating" | "complete";

export function SimulatePurchase() {
  const [step, setStep] = useState<DemoStep>("idle");
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const simulatePurchase = async () => {
    setError(null);
    setResult(null);

    // Step 1: Show "Making purchase..."
    setStep("purchasing");
    await delay(1000);

    // Step 2: Show "Processing transaction..."
    setStep("processing");
    await delay(800);

    // Step 3: Actually call the API
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

      // Step 4: Show "Donating to charity..."
      setStep("donating");
      await delay(1000);

      // Step 5: Show result
      setResult(data);
      setStep("complete");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("idle");
    }
  };

  const reset = () => {
    setStep("idle");
    setResult(null);
    setError(null);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Demo: Simulate a Purchase
        </h3>
        <p className="text-gray-600 text-sm">
          See how Change automatically rounds up and donates
        </p>
      </div>

      {/* Idle State */}
      {step === "idle" && !result && (
        <button
          onClick={simulatePurchase}
          className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
        >
          Make a Demo Purchase
        </button>
      )}

      {/* Processing Steps */}
      {step !== "idle" && step !== "complete" && (
        <div className="space-y-4">
          <ProcessingStep
            label="Making purchase..."
            isActive={step === "purchasing"}
            isComplete={["processing", "donating", "complete"].includes(step)}
            icon="🛍️"
          />
          <ProcessingStep
            label="Processing transaction..."
            isActive={step === "processing"}
            isComplete={["donating", "complete"].includes(step)}
            icon="⚡"
          />
          <ProcessingStep
            label="Calculating round-up & donating..."
            isActive={step === "donating"}
            isComplete={step === "complete"}
            icon="💚"
          />
        </div>
      )}

      {/* Result */}
      {step === "complete" && result && (
        <div className="space-y-4 animate-fadeIn">
          {/* Transaction Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                  {getMerchantEmoji(result.transaction.merchant)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {result.transaction.merchant}
                  </p>
                  <p className="text-xs text-gray-500">
                    {result.transaction.category}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  ${result.transaction.amount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {result.transaction.date}
                </p>
              </div>
            </div>

            {/* Round-up visualization */}
            <div className="bg-emerald-50 rounded-lg p-3 mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 text-lg">↑</span>
                  <span className="text-sm text-emerald-800">
                    Rounded to ${Math.ceil(result.transaction.amount).toFixed(2)}
                  </span>
                </div>
                <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  +${result.transaction.roundup.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Donation Card */}
          {result.donation.allocated && result.donation.charity_name && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">💚</span>
                <div>
                  <p className="font-semibold">Donated to</p>
                  <p className="text-emerald-100 text-sm">
                    {result.donation.charity_name}
                  </p>
                </div>
              </div>
              <div className="text-3xl font-bold mt-2">
                ${result.donation.amount.toFixed(2)}
              </div>
              <p className="text-emerald-100 text-sm mt-1">
                Making a difference, one purchase at a time!
              </p>
            </div>
          )}

          {/* Try Again Button */}
          <button
            onClick={reset}
            className="w-full py-3 px-4 bg-white border-2 border-emerald-200 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors"
          >
            Simulate Another Purchase
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={reset}
            className="mt-3 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Demo Notice */}
      <p className="text-center text-xs text-gray-500 mt-4">
        This is a demo simulation. In production, this happens automatically when you make real purchases.
      </p>
    </div>
  );
}

function ProcessingStep({
  label,
  isActive,
  isComplete,
  icon,
}: {
  label: string;
  isActive: boolean;
  isComplete: boolean;
  icon: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
        isActive
          ? "bg-emerald-100 border-2 border-emerald-400"
          : isComplete
          ? "bg-emerald-50 border border-emerald-200"
          : "bg-gray-50 border border-gray-200"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isActive
            ? "bg-emerald-500 animate-pulse"
            : isComplete
            ? "bg-emerald-500"
            : "bg-gray-300"
        }`}
      >
        {isComplete ? (
          <span className="text-white">✓</span>
        ) : (
          <span>{icon}</span>
        )}
      </div>
      <span
        className={`font-medium ${
          isActive
            ? "text-emerald-800"
            : isComplete
            ? "text-emerald-700"
            : "text-gray-500"
        }`}
      >
        {label}
      </span>
      {isActive && (
        <div className="ml-auto">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

function getMerchantEmoji(merchant: string): string {
  const map: Record<string, string> = {
    Starbucks: "☕",
    Uber: "🚗",
    Amazon: "📦",
    Chipotle: "🌯",
    Target: "🎯",
    Spotify: "🎵",
    Netflix: "🎬",
    "Whole Foods": "🥑",
    DoorDash: "🍔",
    Apple: "🍎",
  };
  return map[merchant] || "🛍️";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
