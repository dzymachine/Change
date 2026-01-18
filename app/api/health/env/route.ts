import { NextRequest, NextResponse } from "next/server";
import { getServerBaseUrl } from "@/lib/app-url";
import { isPlaidConfigured, PLAID_ENV } from "@/lib/plaid/client";
import { isDebugAuthorized } from "@/lib/debug-auth";

function has(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export async function GET(request: NextRequest) {
  // Keep this endpoint safe if deployment protection is disabled.
  // In development it's open; in other envs it requires DEBUG_API_TOKEN.
  // (It only returns booleans, never secrets.)
  if (!isDebugAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = getServerBaseUrl();

  return NextResponse.json({
    ok: true,
    runtime: {
      node_env: process.env.NODE_ENV ?? null,
      vercel_env: process.env.VERCEL_ENV ?? null,
    },
    app: {
      resolved_base_url: baseUrl,
      next_public_app_url_set: has(process.env.NEXT_PUBLIC_APP_URL),
      vercel_url_set: has(process.env.VERCEL_URL),
    },
    supabase: {
      url_set: has(process.env.NEXT_PUBLIC_SUPABASE_URL),
      anon_key_set: has(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      service_role_key_set: has(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    plaid: {
      env: PLAID_ENV,
      configured: isPlaidConfigured(),
      webhook_url_set: has(process.env.PLAID_WEBHOOK_URL),
      webhook_url_preview: process.env.PLAID_WEBHOOK_URL 
        ? process.env.PLAID_WEBHOOK_URL.replace(/^(https?:\/\/[^\/]+).*$/, '$1/...')
        : null,
    },
    production_readiness: {
      is_production: PLAID_ENV === "production",
      checklist: {
        plaid_configured: isPlaidConfigured(),
        webhook_url_set: has(process.env.PLAID_WEBHOOK_URL),
        supabase_configured: has(process.env.NEXT_PUBLIC_SUPABASE_URL) && has(process.env.SUPABASE_SERVICE_ROLE_KEY),
      },
      ready: PLAID_ENV === "production" && 
             isPlaidConfigured() && 
             has(process.env.PLAID_WEBHOOK_URL) &&
             has(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
             has(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
  });
}
