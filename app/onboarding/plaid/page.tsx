"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LinkBankButton } from "@/components/plaid/LinkBankButton";
import { completeOnboarding } from "@/actions/user";

export default function OnboardingPlaidPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [totalSteps, setTotalSteps] = useState(3);

  // Check if we came from donation-mode page (>1 charity)
  useEffect(() => {
    const referrer = document.referrer;
    if (referrer.includes("donation-mode")) {
      setTotalSteps(4);
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
          Connect your bank so we can track your transactions and round up 
          your purchases to donate the spare change.
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
          className="w-16 h-16 mx-auto mb-6 flex items-center justify-center"
          style={{ 
            background: "linear-gradient(135deg, rgba(0, 122, 85, 0.08) 0%, rgba(35, 133, 147, 0.06) 100%)",
          }}
        >
          <svg 
            className="w-8 h-8" 
            fill="none" 
            stroke="var(--green)" 
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>

        {/* Plaid Branding */}
        <div className="mb-6">
          <span 
            className="font-display text-2xl"
            style={{ color: "var(--foreground)", fontWeight: 500 }}
          >
            Secure with
          </span>
          <span 
            className="font-display text-2xl ml-2"
            style={{ color: "var(--green)", fontWeight: 600 }}
          >
            Plaid
          </span>
        </div>

        {/* Features List */}
        <div className="flex flex-col md:flex-row justify-center gap-6 mb-8">
          <div className="flex items-center gap-2 justify-center">
            <svg 
              className="w-4 h-4" 
              fill="var(--green)" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
            <span 
              className="font-body text-sm"
              style={{ color: "var(--muted)" }}
            >
              Bank-level encryption
            </span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <svg 
              className="w-4 h-4" 
              fill="var(--green)" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
            <span 
              className="font-body text-sm"
              style={{ color: "var(--muted)" }}
            >
              Read-only access
            </span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <svg 
              className="w-4 h-4" 
              fill="var(--green)" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
            <span 
              className="font-body text-sm"
              style={{ color: "var(--muted)" }}
            >
              Credentials never stored
            </span>
          </div>
        </div>

        {/* Connect Button */}
        <div className="space-y-4">
          <LinkBankButton 
            size="large" 
            onSuccess={handleComplete}
          />
        </div>

        {/* Decorative Accent */}
        <div 
          className="w-12 h-px mx-auto mt-8 mb-6"
          style={{ backgroundColor: "var(--border)" }}
        />

        {/* Security Note */}
        <p 
          className="font-body text-xs max-w-sm mx-auto leading-relaxed"
          style={{ color: "var(--muted)", opacity: 0.8 }}
        >
          Plaid is trusted by millions of users and connects to over 12,000 financial institutions. 
          We never have direct access to your banking credentials.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <p 
          className="font-body text-sm text-center"
          style={{ color: "var(--red)" }}
        >
          {error}
        </p>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={handleBack}
          disabled={isPending}
          className="font-body text-sm transition-colors duration-200"
          style={{ color: "var(--muted)" }}
          onMouseEnter={(e) => {
            if (!isPending) e.currentTarget.style.color = "var(--foreground)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--muted)";
          }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={isPending}
          className="font-body text-sm transition-colors duration-200"
          style={{ 
            color: "var(--tan)",
            opacity: isPending ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isPending) e.currentTarget.style.color = "var(--tan-dark)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--tan)";
          }}
        >
          {isPending ? "Finishing..." : "Skip for now"}
        </button>
      </div>
    </div>
  );
}
