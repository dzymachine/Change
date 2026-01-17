"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { LinkBankButton } from "@/components/plaid/LinkBankButton";
import { completeOnboarding } from "@/actions/user";

export default function OnboardingPlaidPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cameFromDonationMode, setCameFromDonationMode] = useState(false);

  // Check if we came from donation-mode page (>1 charity)
  useEffect(() => {
    // If sessionStorage still has charities, we're in multi-charity flow
    // but by this point it should be cleared. Check referrer or use a flag.
    const referrer = document.referrer;
    if (referrer.includes("donation-mode")) {
      setCameFromDonationMode(true);
    }
  }, []);

  const handleComplete = async () => {
    setError(null);
    startTransition(async () => {
      const result = await completeOnboarding();
      if (result && "error" in result && result.error) {
        setError(result.error);
      }
      // completeOnboarding redirects to dashboard on success
    });
  };

  const handleSkip = () => {
    handleComplete();
  };

  // Back link depends on flow
  const backLink = cameFromDonationMode
    ? "/onboarding/donation-mode"
    : "/onboarding/goals";

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-2">
        <p className="text-sm text-emerald-600 font-medium">Final Step</p>
        <h1 className="text-3xl font-bold">Link your bank account</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Connect your bank account so we can track your transactions and round
          up your purchases to donate the spare change.
        </p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-8 space-y-6">
        <div className="text-4xl font-semibold text-emerald-600">Plaid</div>

        <div className="space-y-4">
          <LinkBankButton size="large" onSuccess={handleComplete} />

          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            We use Plaid to securely connect to your bank. Your credentials are
            never stored on our servers.
          </p>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-between items-center pt-4">
        <Link
          href={backLink}
          className={`text-gray-500 hover:text-gray-700 ${isPending ? "pointer-events-none opacity-50" : ""}`}
        >
          Back
        </Link>
        <button
          type="button"
          onClick={handleSkip}
          disabled={isPending}
          className="text-emerald-600 hover:underline disabled:opacity-50"
        >
          {isPending ? "Finishing..." : "Skip for now"}
        </button>
      </div>
    </div>
  );
}
