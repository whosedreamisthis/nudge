import { timingSafeEqual } from "node:crypto";

// A demo account lives for 12 hours, then the cleanup job deletes it from Clerk and the database
export const DEMO_LIFETIME_MS = 12 * 60 * 60 * 1000;

// Demo Clerk users get an email on this domain, so the cleanup job can find them by search
export const DEMO_EMAIL_DOMAIN = "demo.nudge.invalid";

// A Clerk demo user with no database row only counts as an orphan after this long, so a demo that is
// still being created is left alone
export const ORPHAN_GRACE_MS = 10 * 60 * 1000;

export function demoExpiryFrom(now: Date): Date {
  return new Date(now.getTime() + DEMO_LIFETIME_MS);
}

// What a demo Clerk user carries in publicMetadata
export function demoMetadata(expiresAt: Date) {
  return { isDemo: true, demoExpiresAt: expiresAt.toISOString() };
}

// Reads that metadata back; anything missing or malformed is not a demo
export function parseDemoMetadata(metadata: unknown): { isDemo: boolean; demoExpiresAt: Date | null } {
  if (typeof metadata !== "object" || metadata === null) return { isDemo: false, demoExpiresAt: null };
  const { isDemo, demoExpiresAt } = metadata as Record<string, unknown>;
  if (isDemo !== true) return { isDemo: false, demoExpiresAt: null };

  const expiry = typeof demoExpiresAt === "string" ? new Date(demoExpiresAt) : null;
  return { isDemo: true, demoExpiresAt: expiry && !Number.isNaN(expiry.getTime()) ? expiry : null };
}

// A demo with no expiry counts as expired, so a broken row can never stay usable
export function isDemoExpired(user: { isDemo: boolean; demoExpiresAt: Date | null }, now: Date): boolean {
  if (!user.isDemo) return false;
  return user.demoExpiresAt === null || user.demoExpiresAt.getTime() <= now.getTime();
}

// The scheduler sends "Authorization: Bearer <CRON_SECRET>"; with no secret set, nothing is allowed
export function isCronAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
