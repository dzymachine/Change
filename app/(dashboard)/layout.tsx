import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

// Note: Middleware handles onboarding redirects, but we keep auth check here for defense in depth

export default async function DashboardLayout({
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

  // Double-check onboarding status (middleware should handle this, but just in case)
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding/charities");
  }

  return (
    <div className="min-h-screen flex">
      <DashboardNav user={user} />
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
