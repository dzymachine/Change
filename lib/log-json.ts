type LogLevel = "info" | "warn" | "error";

// Keys that should never be logged (case-insensitive matching)
const SECRET_KEYS = [
  "access_token",
  "plaid_access_token",
  "secret",
  "password",
  "api_key",
  "apikey",
  "authorization",
  "bearer",
  "credential",
  "private_key",
  "service_role_key",
];

function isSecretKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SECRET_KEYS.some(secret => lowerKey.includes(secret));
}

function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (key, v) => {
    // Redact secret values
    if (key && isSecretKey(key) && typeof v === "string") {
      return "[REDACTED]";
    }
    if (typeof v === "object" && v !== null) {
      if (seen.has(v as object)) return "[Circular]";
      seen.add(v as object);
    }
    if (typeof v === "bigint") return v.toString();
    if (v instanceof Error) {
      return {
        name: v.name,
        message: v.message,
        stack: v.stack,
      };
    }
    return v;
  });
}

export function logJson(level: LogLevel, event: string, fields: Record<string, unknown> = {}) {
  const line = safeStringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  });

  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

