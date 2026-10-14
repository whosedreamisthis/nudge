import { describe, expect, it } from "vitest";
import {
  DEMO_LIFETIME_MS,
  demoExpiryFrom,
  demoHoursLeft,
  demoMetadata,
  isCronAuthorized,
  isDemoExpired,
  parseDemoMetadata,
} from "@/lib/demo";

const NOW = new Date("2026-10-14T12:00:00Z");

describe("demoExpiryFrom", () => {
  it("is 12 hours later", () => {
    expect(demoExpiryFrom(NOW).getTime() - NOW.getTime()).toBe(DEMO_LIFETIME_MS);
    expect(DEMO_LIFETIME_MS).toBe(43_200_000);
  });
});

describe("demoMetadata and parseDemoMetadata", () => {
  it("round-trips the expiry", () => {
    const expiry = demoExpiryFrom(NOW);
    expect(parseDemoMetadata(demoMetadata(expiry))).toEqual({ isDemo: true, demoExpiresAt: expiry });
  });

  it("treats missing or malformed metadata as not a demo", () => {
    for (const value of [undefined, null, "demo", 5, {}, { isDemo: false }, { isDemo: "true" }]) {
      expect(parseDemoMetadata(value).isDemo).toBe(false);
    }
  });

  it("keeps a demo with a bad expiry, but with no expiry date", () => {
    expect(parseDemoMetadata({ isDemo: true })).toEqual({ isDemo: true, demoExpiresAt: null });
    expect(parseDemoMetadata({ isDemo: true, demoExpiresAt: "not a date" })).toEqual({
      isDemo: true,
      demoExpiresAt: null,
    });
  });
});

describe("isDemoExpired", () => {
  it("never expires a real user", () => {
    expect(isDemoExpired({ isDemo: false, demoExpiresAt: null }, NOW)).toBe(false);
    expect(isDemoExpired({ isDemo: false, demoExpiresAt: new Date(0) }, NOW)).toBe(false);
  });

  it("expires a demo at its expiry time", () => {
    const expiry = new Date("2026-10-14T12:00:00Z");
    expect(isDemoExpired({ isDemo: true, demoExpiresAt: expiry }, new Date("2026-10-14T11:59:59Z"))).toBe(false);
    expect(isDemoExpired({ isDemo: true, demoExpiresAt: expiry }, NOW)).toBe(true);
  });

  it("treats a demo with no expiry as expired", () => {
    expect(isDemoExpired({ isDemo: true, demoExpiresAt: null }, NOW)).toBe(true);
  });
});

describe("isCronAuthorized", () => {
  it("accepts only the matching bearer token", () => {
    expect(isCronAuthorized("Bearer s3cret", "s3cret")).toBe(true);
    expect(isCronAuthorized("Bearer wrong!", "s3cret")).toBe(false);
    expect(isCronAuthorized("s3cret", "s3cret")).toBe(false);
    expect(isCronAuthorized(null, "s3cret")).toBe(false);
  });

  it("allows nothing when no secret is set", () => {
    expect(isCronAuthorized("Bearer ", "")).toBe(false);
    expect(isCronAuthorized("Bearer undefined", undefined)).toBe(false);
  });
});

describe("demoHoursLeft", () => {
  it("rounds up to whole hours", () => {
    expect(demoHoursLeft(new Date("2026-10-15T00:00:00Z"), NOW)).toBe(12);
    expect(demoHoursLeft(new Date("2026-10-14T23:59:00Z"), NOW)).toBe(12);
    expect(demoHoursLeft(new Date("2026-10-14T13:00:01Z"), NOW)).toBe(2);
  });

  it("never shows less than one hour while the demo still works", () => {
    expect(demoHoursLeft(new Date("2026-10-14T12:00:30Z"), NOW)).toBe(1);
    expect(demoHoursLeft(NOW, NOW)).toBe(1);
  });
});
