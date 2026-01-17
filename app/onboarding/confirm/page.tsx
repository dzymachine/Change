"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OnboardingStep3() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    setLoading(true);
    
    // TODO: Call server action to mark onboarding complete
    // await completeOnboarding();
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    router.push("/");
  }

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-2">
        <p className="text-sm text-emerald-600 font-medium">Step 3 of 3</p>
        <h1 className="text-3xl font-bold">You're all set!</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Review your settings and start making a difference with every purchase.
        </p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-8 space-y-6">
        <div className="text-6xl">🎉</div>
        
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div>
              <p className="text-sm text-gray-500">Bank Account</p>
              <p className="font-medium">Chase Bank ••••1234</p>
            </div>
            <span className="text-emerald-500">✓</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div>
              <p className="text-sm text-gray-500">Selected Charity</p>
              <p className="font-medium">Local Food Bank</p>
            </div>
            <span className="text-emerald-500">✓</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div>
              <p className="text-sm text-gray-500">Round-ups</p>
              <p className="font-medium">Enabled</p>
            </div>
            <span className="text-emerald-500">✓</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleComplete}
          disabled={loading}
          className="w-full py-3 px-6 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? "Starting..." : "Start Making Change"}
        </button>
        
        <Link 
          href="/onboarding/charity"
          className="inline-block text-gray-500 hover:text-gray-700"
        >
          ← Go back
        </Link>
      </div>
    </div>
  );
}
