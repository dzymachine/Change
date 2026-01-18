import type { NextRequest } from "next/server";

function normalize(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Debug endpoint auth.
 *
 * - In development (`NODE_ENV=development`), allow by default.
 * - Otherwise require `DEBUG_API_TOKEN` and match it via:
 *   - Header: `x-debug-token: <token>`
 *   - Query:  `?debug_token=<token>`
 */
export function isDebugAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV === "development") return true;

  const expected = normalize(process.env.DEBUG_API_TOKEN);
  if (!expected) return false;

  const headerToken = normalize(request.headers.get("x-debug-token"));
  if (headerToken && headerToken === expected) return true;

  const url = new URL(request.url);
  const queryToken = normalize(url.searchParams.get("debug_token"));
  if (queryToken && queryToken === expected) return true;

  return false;
}
