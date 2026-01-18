"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LinkBankButton } from "@/components/plaid/LinkBankButton";
import { completeOnboarding } from "@/actions/user";

export default function OnboardingPlaidClientPage({
  totalSteps,
}: {
  totalSteps: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  const handleBack = () => {
    if (totalSteps === 4) {
      router.push("/onboarding/donation-mode");
    } else {
      router.push("/onboarding/goals");
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="text-center">
        <p
          className="font-mono text-xs uppercase tracking-widest mb-4"
          style={{ color: "var(--tan)" }}
        >
          Step {totalSteps} of {totalSteps}
        </p>
        <h1
          className="font-display text-3xl md:text-4xl mb-4"
          style={{ color: "var(--foreground)", fontWeight: 400 }}
        >
          Link your bank account
        </h1>
        <p
          className="font-body text-base max-w-lg mx-auto leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          Connect your bank so we can track your transactions and round up your
          purchases to donate the spare change.
        </p>
      </header>

      {/* Bank Connection Card */}
      <div
        className="p-8 md:p-10 text-center"
        style={{
          backgroundColor: "var(--white)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Security Icon */}
        <div
          className="w-20 h-20 mx-auto mb-8 flex items-center justify-center"
          style={{
            backgroundColor: "rgba(0, 122, 85, 0.1)",
            borderRadius: "50%",
          }}
        >
          <svg
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: "var(--green)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h2
          className="font-display text-2xl mb-4"
          style={{ color: "var(--foreground)", fontWeight: 400 }}
        >
          Secure connection
        </h2>

        <p
          className="font-body text-base mb-8 max-w-md mx-auto leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          Your bank login credentials are never stored. We use Plaid&apos;s secure
          API to access transaction data safely.
        </p>

        <div className="space-y-4">
          <LinkBankButton
            size="large"
            onSuccess={handleComplete}
            style={{
              borderRadius: "9999px",
              width: "100%",
              maxWidth: "320px",
            }}
          />

          <button
            onClick={handleSkip}
            disabled={isPending}
            className="font-body text-sm transition-opacity duration-200 hover:opacity-80 disabled:opacity-50"
            style={{ color: "var(--muted)" }}
          >
            Skip for now
          </button>
        </div>

        {error && (
          <p className="font-body text-sm mt-6" style={{ color: "var(--red)" }}>
            {error}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 font-body text-sm transition-opacity duration-200 hover:opacity-80"
          style={{ color: "var(--muted)" }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        <div className="font-mono text-xs" style={{ color: "var(--muted)" }}>
          Almost done...
        </div>
      </div>
    </div>
  );
}
