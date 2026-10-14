import { describe, expect, it } from "vitest";
import { signDemoCookie, verifyDemoCookie } from "@/lib/demo-cookie";

const NOW = new Date("2026-10-14T12:00:00Z");
const LATER = new Date("2026-10-15T00:00:00Z");

describe("demo resume cookie", () => {
  it("round-trips the demo and its expiry", () => {
    const value = signDemoCookie("user_abc", LATER, "secret");

    expect(verifyDemoCookie(value, "secret", NOW)).toEqual({ clerkId: "user_abc", expiresAt: LATER });
  });

  it("rejects a cookie signed with another secret", () => {
    expect(verifyDemoCookie(signDemoCookie("user_abc", LATER, "other"), "secret", NOW)).toBeNull();
  });

  it("rejects a tampered clerk id or expiry", () => {
    const [, expiry, signature] = signDemoCookie("user_abc", LATER, "secret").split(".");

    expect(verifyDemoCookie(`user_other.${expiry}.${signature}`, "secret", NOW)).toBeNull();
    expect(verifyDemoCookie(`user_abc.${LATER.getTime() + 1000}.${signature}`, "secret", NOW)).toBeNull();
  });

  it("rejects an expired cookie, including one expiring right now", () => {
    expect(verifyDemoCookie(signDemoCookie("user_abc", new Date("2026-10-14T11:00:00Z"), "secret"), "secret", NOW)).toBeNull();
    expect(verifyDemoCookie(signDemoCookie("user_abc", NOW, "secret"), "secret", NOW)).toBeNull();
  });

  it("rejects missing or malformed values", () => {
    for (const value of [undefined, "", "nope", "a.b", "a.b.c.d", "user_abc.notanumber.sig"]) {
      expect(verifyDemoCookie(value, "secret", NOW)).toBeNull();
    }
  });
});
