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
        className="font-body text-sm transition-colors duration-200 disabled:opacity-50"
        style={{ color: "var(--muted)" }}
        onMouseEnter={(e) => e.currentTarget.style.color = "var(--foreground)"}
        onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted)"}
      >
        {isPending ? "..." : "Sign out"}
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className="w-full py-2.5 px-4 font-body text-sm transition-all duration-200 disabled:opacity-50"
      style={{ 
        color: "var(--red)",
        border: "1px solid var(--red)",
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--red)";
        e.currentTarget.style.color = "var(--white)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "var(--red)";
      }}
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
