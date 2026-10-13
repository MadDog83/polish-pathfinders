import { getRequest } from "@tanstack/react-start/server";

// Per-IP request limits for public server functions that cost money or write data.
//
// Kept in memory, like the model cooldown in chat.functions.ts: every server instance
// counts on its own, so this is a brake on a single scripted client, not a guarantee.
// A hard limit across instances needs shared storage (a table or KV) or a CAPTCHA.

type Window = { max: number; windowMs: number };
type Counter = { count: number; resetAt: number };

const counters = new Map<string, Counter>();
const MAX_KEYS = 5000;

/** The caller's IP. Cloudflare sets cf-connecting-ip itself, so a client cannot forge it. */
function clientIp(): string {
  const headers = getRequest()?.headers;
  if (!headers) return "unknown";
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function prune(now: number) {
  for (const [key, c] of counters) if (c.resetAt <= now) counters.delete(key);
}

/**
 * Counts one request from the current caller against every window of `bucket`.
 * Throws RATE_LIMITED once any window is full; the chat panel already shows its
 * "busy, try again shortly" message for that error.
 */
export function enforceRateLimit(bucket: string, windows: Window[]): void {
  const now = Date.now();
  if (counters.size > MAX_KEYS) prune(now);
  const ip = clientIp();

  const hits = windows.map((w) => {
    const key = `${bucket}:${w.windowMs}:${ip}`;
    let c = counters.get(key);
    if (!c || c.resetAt <= now) {
      c = { count: 0, resetAt: now + w.windowMs };
      counters.set(key, c);
    }
    return { c, w };
  });

  if (hits.some(({ c, w }) => c.count >= w.max)) {
    throw new Error("RATE_LIMITED");
  }
  for (const { c } of hits) c.count += 1;
}
