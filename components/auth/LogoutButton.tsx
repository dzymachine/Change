"use client";

import { useTransition } from "react";
import { signOut } from "@/actions/user";

const LANDING_PAGE_URL = "https://empowered-onboarding-054129.framer.app/";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      const result = await signOut();
      if (result.success) {
        window.location.href = LANDING_PAGE_URL;
      }
    });
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className="w-full py-2 px-4 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
