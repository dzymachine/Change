"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CharityPicker } from "@/components/onboarding/CharityPicker";

export default function OnboardingCharitiesPage() {
  const router = useRouter();
  const [selectedCharity, setSelectedCharity] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selectedCharity) return;

    setError(null);
    startTransition(() => {
      router.push("/onboarding/plaid");
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <p className="text-sm text-emerald-600 font-medium">Step 1 of 2</p>
        <h1 className="text-3xl font-bold">Choose your charity</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Select the charity that will receive your round-up donations. You can
          change this anytime.
        </p>
      </div>

      <CharityPicker selected={selectedCharity} onSelect={setSelectedCharity} />

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedCharity || isPending}
          className={`px-6 py-2 rounded-lg transition-colors ${
            selectedCharity && !isPending
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isPending ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
