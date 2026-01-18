export function getServerBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit && explicit.trim().length > 0) return explicit.trim().replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim().length > 0) {
    return `https://${vercelUrl.trim().replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

