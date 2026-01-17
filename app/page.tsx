import { AuthLanding } from "@/components/auth/AuthLanding";

// Note: Middleware handles all auth redirects:
// - Authenticated users with completed onboarding → /dashboard
// - Authenticated users without completed onboarding → /onboarding/charities
// - Unauthenticated users → stay here (login page)

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <AuthLanding />
    </main>
  );
}
