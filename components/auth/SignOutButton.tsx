"use client";

import { useTransition } from "react";
import { signOut } from "@/actions/user";

interface SignOutButtonProps {
  variant?: "default" | "compact";
}

export function SignOutButton({ variant = "default" }: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleSignOut}
        disabled={isPending}
        className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "..." : "Sign out"}
      </button>
    );
  }

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
