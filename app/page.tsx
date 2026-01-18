import { AuthLanding } from "@/components/auth/AuthLanding";

// Note: Middleware handles all auth redirects:
// - Authenticated users with completed onboarding → /dashboard
// - Authenticated users without completed onboarding → /onboarding/charities
// - Unauthenticated users → stay here (login page)

// Force dynamic rendering - this page uses Supabase auth which requires runtime env vars
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: "var(--white)" }}
    >
      {/* Subtle background decoration - asymmetric for organic feel */}
      <div 
        className="absolute top-0 right-0 w-1/3 h-1/2 opacity-[0.03]"
        style={{ 
          backgroundColor: "var(--tan)",
          transform: "skewY(-12deg) translateY(-20%)",
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-1/4 h-1/3 opacity-[0.02]"
        style={{ 
          backgroundColor: "var(--green)",
          transform: "skewY(6deg) translateY(30%)",
        }}
      />
      
      {/* Main content */}
      <div className="relative z-10 w-full py-12 md:py-20">
        <AuthLanding />
      </div>
    </main>
  );
}
