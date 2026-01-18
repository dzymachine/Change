import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/settings", "/profile", "/onboarding"];
// Routes only for unauthenticated users
const authRoutes = ["/"];
// Onboarding routes
const onboardingRoutes = ["/onboarding"];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  type CookieOptions = Parameters<typeof response.cookies.set>[2];
  type CookieToSet = { name: string; value: string; options?: CookieOptions };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  // Refresh session (updates cookies if needed)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.includes(pathname);
  const isOnboardingRoute = onboardingRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Unauthenticated user trying to access protected routes
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Authenticated user - check onboarding status for routing
  if (user) {
    // Fetch profile to check onboarding status
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    const hasCompletedOnboarding = profile?.onboarding_completed ?? false;

    // User hasn't completed onboarding
    if (!hasCompletedOnboarding) {
      // If trying to access dashboard/protected (non-onboarding) routes, redirect to onboarding
      if (isProtectedRoute && !isOnboardingRoute) {
        return NextResponse.redirect(
          new URL("/onboarding/charities", request.url)
        );
      }
      // If on home page, redirect to onboarding
      if (isAuthRoute) {
        return NextResponse.redirect(
          new URL("/onboarding/charities", request.url)
        );
      }
    } else {
      // User has completed onboarding
      // If trying to access onboarding routes, redirect to dashboard
      if (isOnboardingRoute) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      // If on home page, redirect to dashboard
      if (isAuthRoute) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
