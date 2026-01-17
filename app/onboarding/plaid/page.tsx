"use client";

import Link from "next/link";
import { LinkBankButton } from "@/components/plaid/LinkBankButton";

export default function OnboardingPlaidPage() {
  return (
    <div className="space-y-8 text-center">
      <div className="space-y-2">
        <p className="text-sm text-emerald-600 font-medium">Step 2 of 2</p>
        <h1 className="text-3xl font-bold">Link your bank account</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Connect your bank account so we can track your transactions and round up
          your purchases to donate the spare change.
        </p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-8 space-y-6">
        <div className="text-4xl font-semibold text-emerald-600">Plaid</div>

        <div className="space-y-4">
          <LinkBankButton size="large" />

          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            We use Plaid to securely connect to your bank. Your credentials are
            never stored on our servers.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <Link
          href="/onboarding/charities"
          className="text-gray-500 hover:text-gray-700"
        >
          Back
        </Link>
        <Link
          href="/dashboard"
          className="text-emerald-600 hover:underline"
        >
          Skip for now
        </Link>
      </div>
    </div>
  );
}
