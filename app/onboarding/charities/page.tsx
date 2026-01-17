"use client";

import { useState } from "react";
import Link from "next/link";
import { CharityPicker } from "@/components/onboarding/CharityPicker";

export default function OnboardingCharitiesPage() {
  const [selectedCharity, setSelectedCharity] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <p className="text-sm text-emerald-600 font-medium">Step 1 of 2</p>
        <h1 className="text-3xl font-bold">Choose your charity</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Select the charity that will receive your round-up donations.
          You can change this anytime.
        </p>
      </div>

      <CharityPicker
        selected={selectedCharity}
        onSelect={setSelectedCharity}
      />

      <div className="flex justify-between items-center pt-4">
        <Link
          href="/"
          className="text-gray-500 hover:text-gray-700"
        >
          Back
        </Link>
        <Link
          href="/onboarding/plaid"
          className={`px-6 py-2 rounded-lg transition-colors ${
            selectedCharity
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          onClick={(e) => !selectedCharity && e.preventDefault()}
        >
          Confirm and continue
        </Link>
      </div>
    </div>
  );
}
