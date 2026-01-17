import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthLanding } from "@/components/auth/AuthLanding";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <AuthLanding />
    </main>
  );
}
