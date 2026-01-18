import { AuthLanding } from "@/components/auth/AuthLanding";

// Note: Middleware handles all auth redirects:
// - Authenticated users with completed onboarding → /dashboard
// - Authenticated users without completed onboarding → /onboarding/charities
// - Unauthenticated users → stay here (login page)

// Force dynamic rendering - this page uses Supabase auth which requires runtime env vars
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <AuthLanding />
    </main>
  );
}
