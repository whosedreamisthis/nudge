import { createHmac, timingSafeEqual } from "node:crypto";

// The resume cookie: which demo this browser belongs to, so a visitor whose IP changed gets back
// into their demo. Signed so it can't be forged; it holds no secrets.
export const DEMO_COOKIE_NAME = "nudge_demo";

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

// "<clerkId>.<expiry in ms>.<signature>"
export function signDemoCookie(clerkId: string, expiresAt: Date, secret: string): string {
  const payload = `${clerkId}.${expiresAt.getTime()}`;
  return `${payload}.${sign(payload, secret)}`;
}

// The demo this cookie names, or null when it is malformed, forged or past its expiry
export function verifyDemoCookie(
  value: string | undefined,
  secret: string,
  now: Date,
): { clerkId: string; expiresAt: Date } | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;

  const [clerkId, expiry, signature] = parts;
  const expected = Buffer.from(sign(`${clerkId}.${expiry}`, secret));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  const expiresAt = new Date(Number(expiry));
  if (!clerkId || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= now.getTime()) return null;
  return { clerkId, expiresAt };
}
