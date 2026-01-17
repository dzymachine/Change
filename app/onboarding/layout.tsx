import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // TODO: Check if user has already completed onboarding
  // const { data: profile } = await supabase
  //   .from('profiles')
  //   .select('onboarding_completed')
  //   .eq('id', user.id)
  //   .single();
  // 
  // if (profile?.onboarding_completed) {
  //   redirect('/');
  // }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress indicator */}
      <header className="border-b p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold">Change</span>
          <span className="text-sm text-gray-500">Setting up your account</span>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </main>
    </div>
  );
}
