"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { SignOutButton } from "@/components/auth/SignOutButton";

interface DashboardNavProps {
  user: User;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/profile", label: "Profile", icon: "👤" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav className="w-64 border-r bg-gray-50 p-4 hidden lg:block relative">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-block transition-opacity hover:opacity-80">
          <Image
            src="/change-logo.png"
            alt="Change"
            width={120}
            height={32}
            priority
          />
        </Link>
      </div>

      <ul className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
          <SignOutButton />
        </div>
      </div>
    </nav>
  );
}
