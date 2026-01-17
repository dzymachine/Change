"use client";

import { signOut } from "@/actions/user";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="w-full py-2 px-4 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
    >
      Sign out
    </button>
  );
}
