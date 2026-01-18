import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/SignOutButton";

// Note: Middleware handles redirects, but we keep checks here for defense in depth

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Check if user has already completed onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--white)" }}
    >
      {/* Header */}
      <header 
        className="py-5 px-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Image
            src="/change-logo.png"
            alt="Change"
            width={100}
            height={27}
            priority
          />
          <SignOutButton variant="compact" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
