import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  createSignInToken: vi.fn(),
  findUnique: vi.fn(),
  upsert: vi.fn(),
  deleteMany: vi.fn(),
  seedDemoUser: vi.fn(),
  headerValues: {} as Record<string, string>,
  cookieJar: new Map<string, string>(),
  cookieSet: vi.fn(),
  cookieDelete: vi.fn(),
  redis: new Map<string, string>(),
  counters: new Map<string, number>(),
  ttls: new Map<string, number>(),
  redisDown: { get: false, set: false },
}));

vi.mock("@/lib/session", () => ({ getSessionUser: mocks.getSessionUser }));
vi.mock("@/lib/demo-seed", () => ({ seedDemoUser: mocks.seedDemoUser }));
vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: mocks.findUnique, upsert: mocks.upsert, deleteMany: mocks.deleteMany } },
}));
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({
    users: { createUser: mocks.createUser, deleteUser: mocks.deleteUser },
    signInTokens: { createSignInToken: mocks.createSignInToken },
  }),
}));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (name: string) => mocks.headerValues[name] ?? null }),
  cookies: async () => ({
    get: (name: string) => (mocks.cookieJar.has(name) ? { value: mocks.cookieJar.get(name) } : undefined),
    set: mocks.cookieSet,
    delete: mocks.cookieDelete,
  }),
}));
// Real key and slot helpers, with an in-memory Redis behind them
vi.mock("@/lib/demo-redis", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/demo-redis")>()),
  getRedis: () => ({
    get: async (key: string) => {
      if (mocks.redisDown.get) throw new Error("redis is down");
      return mocks.redis.get(key) ?? null;
    },
    set: async (key: string, value: string, options: { nx?: boolean; ex: number }) => {
      if (mocks.redisDown.set) throw new Error("redis is down");
      if (options.nx && mocks.redis.has(key)) return null;
      mocks.redis.set(key, value);
      mocks.ttls.set(key, options.ex);
      return "OK";
    },
    del: async (key: string) => {
      mocks.redis.delete(key);
    },
    incr: async (key: string) => {
      mocks.counters.set(key, (mocks.counters.get(key) ?? 0) + 1);
      return mocks.counters.get(key)!;
    },
    decr: async (key: string) => {
      mocks.counters.set(key, (mocks.counters.get(key) ?? 0) - 1);
      return mocks.counters.get(key)!;
    },
    expire: async () => 1,
  }),
}));

import { startDemo } from "./demo";
import { DEMO_EMAIL_DOMAIN } from "@/lib/demo";
import { DEMO_COOKIE_NAME, signDemoCookie, verifyDemoCookie } from "@/lib/demo-cookie";
import { DEMO_DAILY_LIMIT, demoDailyKey, demoIpKey } from "@/lib/demo-redis";
import { hashIp } from "@/lib/demo-ip";

const SECRET = "test-secret";
const IP = "203.0.113.7";
const KEY = demoIpKey(hashIp(IP, SECRET));
const NOW = new Date("2026-10-14T12:00:00Z");
const IN_12H = new Date("2026-10-15T00:00:00Z");

const liveDemo = { isDemo: true, demoExpiresAt: IN_12H };

describe("startDemo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    vi.stubEnv("DEMO_COOKIE_SECRET", SECRET);
    vi.spyOn(console, "error").mockImplementation(() => {});

    mocks.headerValues = { "x-forwarded-for": `${IP}, 10.0.0.1` };
    mocks.cookieJar.clear();
    mocks.redis.clear();
    mocks.ttls.clear();
    mocks.counters.clear();
    mocks.redisDown.get = false;
    mocks.redisDown.set = false;

    mocks.getSessionUser.mockResolvedValue(null);
    mocks.createUser.mockResolvedValue({ id: "clerk_new" });
    mocks.deleteUser.mockResolvedValue({});
    mocks.createSignInToken.mockResolvedValue({ token: "ticket_1" });
    mocks.findUnique.mockResolvedValue(liveDemo);
    mocks.upsert.mockResolvedValue({ id: "u_new" });
    mocks.deleteMany.mockResolvedValue({ count: 1 });
    mocks.seedDemoUser.mockResolvedValue(undefined);
  });

  describe("a new demo", () => {
    it("creates the Clerk user, the demo row and the seed, then returns a ticket", async () => {
      const result = await startDemo({ timezone: "Europe/Paris" });

      expect(result).toEqual({ success: true, data: { ticket: "ticket_1" } });
      const args = mocks.createUser.mock.calls[0][0];
      expect(args.emailAddress[0]).toMatch(new RegExp(`^demo-[0-9a-f]{16}@${DEMO_EMAIL_DOMAIN}$`));
      expect(args.publicMetadata).toEqual({ isDemo: true, demoExpiresAt: IN_12H.toISOString() });
      expect(args.skipPasswordRequirement).toBe(true);
      expect(mocks.upsert).toHaveBeenCalledWith({
        where: { clerkId: "clerk_new" },
        update: { isDemo: true, demoExpiresAt: IN_12H, timezone: "Europe/Paris" },
        create: { clerkId: "clerk_new", isDemo: true, demoExpiresAt: IN_12H, timezone: "Europe/Paris" },
      });
      expect(mocks.seedDemoUser).toHaveBeenCalledWith({ userId: "u_new", timezone: "Europe/Paris", now: NOW });
    });

    it("records the demo against the hashed IP for the demo's lifetime, never the raw IP", async () => {
      await startDemo({});

      expect(mocks.redis.get(KEY)).toBe("clerk_new");
      expect(mocks.ttls.get(KEY)).toBe(43_200);
      expect(KEY.startsWith("nudge:demo:ip:")).toBe(true);
      expect(KEY).not.toContain(IP);
      expect([...mocks.redis.keys()]).toEqual([KEY]);
    });

    it("sets a signed, httpOnly resume cookie that expires with the demo", async () => {
      await startDemo({});

      const [name, value, options] = mocks.cookieSet.mock.calls[0];
      expect(name).toBe(DEMO_COOKIE_NAME);
      expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", expires: IN_12H });
      expect(verifyDemoCookie(value, SECRET, NOW)).toEqual({ clerkId: "clerk_new", expiresAt: IN_12H });
    });

    it("mints a short-lived sign-in token for the new user", async () => {
      await startDemo({});

      expect(mocks.createSignInToken).toHaveBeenCalledWith({ userId: "clerk_new", expiresInSeconds: 60 });
    });

    it("falls back to UTC for a missing or invalid timezone", async () => {
      await startDemo({ timezone: "Not/AZone" });

      expect(mocks.seedDemoUser).toHaveBeenCalledWith(expect.objectContaining({ timezone: "UTC" }));
    });
  });

  describe("resuming", () => {
    it("signs the same IP back into its live demo without creating anything", async () => {
      mocks.redis.set(KEY, "clerk_existing");

      const result = await startDemo({});

      expect(result).toEqual({ success: true, data: { ticket: "ticket_1" } });
      expect(mocks.createUser).not.toHaveBeenCalled();
      expect(mocks.seedDemoUser).not.toHaveBeenCalled();
      expect(mocks.createSignInToken).toHaveBeenCalledWith({ userId: "clerk_existing", expiresInSeconds: 60 });
      expect(mocks.cookieSet).toHaveBeenCalled();
    });

    it("frees a slot whose demo is gone and starts a new demo", async () => {
      mocks.redis.set(KEY, "clerk_gone");
      mocks.findUnique.mockResolvedValueOnce(null);

      const result = await startDemo({});

      expect(result.success).toBe(true);
      expect(mocks.createUser).toHaveBeenCalledTimes(1);
      expect(mocks.redis.get(KEY)).toBe("clerk_new");
    });

    it("treats an expired demo as gone", async () => {
      mocks.redis.set(KEY, "clerk_old");
      mocks.findUnique.mockResolvedValueOnce({ isDemo: true, demoExpiresAt: new Date("2026-10-14T11:00:00Z") });

      await startDemo({});

      expect(mocks.createUser).toHaveBeenCalledTimes(1);
    });

    it("uses the resume cookie when the IP has no demo", async () => {
      mocks.cookieJar.set(DEMO_COOKIE_NAME, signDemoCookie("clerk_cookie", IN_12H, SECRET));

      const result = await startDemo({});

      expect(result.success).toBe(true);
      expect(mocks.createUser).not.toHaveBeenCalled();
      expect(mocks.createSignInToken).toHaveBeenCalledWith({ userId: "clerk_cookie", expiresInSeconds: 60 });
    });

    it("ignores and clears a forged cookie", async () => {
      mocks.cookieJar.set(DEMO_COOKIE_NAME, signDemoCookie("clerk_cookie", IN_12H, "another-secret"));

      await startDemo({});

      expect(mocks.cookieDelete).toHaveBeenCalledWith(DEMO_COOKIE_NAME);
      expect(mocks.createUser).toHaveBeenCalledTimes(1);
    });

    it("ignores a cookie whose demo has expired", async () => {
      mocks.cookieJar.set(DEMO_COOKIE_NAME, signDemoCookie("clerk_cookie", new Date("2026-10-14T11:00:00Z"), SECRET));

      await startDemo({});

      expect(mocks.cookieDelete).toHaveBeenCalledWith(DEMO_COOKIE_NAME);
      expect(mocks.createUser).toHaveBeenCalledTimes(1);
    });
  });

  describe("when Redis is down", () => {
    it("blocks new demos and creates no Clerk user", async () => {
      mocks.redisDown.get = true;

      const result = await startDemo({});

      expect(result).toEqual({
        success: false,
        error: "Demos are temporarily unavailable, please try again shortly",
      });
      expect(mocks.createUser).not.toHaveBeenCalled();
    });

    it("still resumes from the cookie", async () => {
      mocks.redisDown.get = true;
      mocks.cookieJar.set(DEMO_COOKIE_NAME, signDemoCookie("clerk_cookie", IN_12H, SECRET));

      expect((await startDemo({})).success).toBe(true);
      expect(mocks.createUser).not.toHaveBeenCalled();
    });

    it("blocks the claim when only the write fails", async () => {
      mocks.redisDown.set = true;

      const result = await startDemo({});

      expect(result.success).toBe(false);
      expect(mocks.createUser).not.toHaveBeenCalled();
    });
  });

  describe("two presses at once", () => {
    it("leaves exactly one demo, and both end up in it", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW);

      const both = Promise.all([startDemo({}), startDemo({})]);
      await vi.advanceTimersByTimeAsync(5000);
      const [first, second] = await both;

      expect(mocks.createUser).toHaveBeenCalledTimes(1);
      expect(mocks.seedDemoUser).toHaveBeenCalledTimes(1);
      expect(first).toEqual({ success: true, data: { ticket: "ticket_1" } });
      expect(second).toEqual({ success: true, data: { ticket: "ticket_1" } });
      expect(mocks.redis.get(KEY)).toBe("clerk_new");
    });
  });

  describe("when a step fails midway", () => {
    it("deletes the Clerk user, the demo row and the slot", async () => {
      mocks.seedDemoUser.mockRejectedValue(new Error("seed failed"));

      const result = await startDemo({});

      expect(result).toEqual({ success: false, error: "Could not start the demo, please try again" });
      expect(mocks.deleteUser).toHaveBeenCalledWith("clerk_new");
      expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { clerkId: "clerk_new" } });
      expect(mocks.redis.has(KEY)).toBe(false);
      expect(mocks.cookieSet).not.toHaveBeenCalled();
    });

    it("frees the slot when Clerk cannot create the user", async () => {
      mocks.createUser.mockRejectedValue(new Error("clerk is down"));

      const result = await startDemo({});

      expect(result.success).toBe(false);
      expect(mocks.deleteUser).not.toHaveBeenCalled();
      expect(mocks.redis.has(KEY)).toBe(false);
    });

    it("still reports a failure when the cleanup steps fail too", async () => {
      mocks.upsert.mockRejectedValue(new Error("db is down"));
      mocks.deleteUser.mockRejectedValue(new Error("clerk is down"));
      mocks.deleteMany.mockRejectedValue(new Error("db is down"));

      expect((await startDemo({})).success).toBe(false);
      expect(mocks.redis.has(KEY)).toBe(false);
    });
  });

  describe("the daily limit", () => {
    const DAILY = demoDailyKey(NOW);

    it("counts a new demo against today", async () => {
      await startDemo({});

      expect(mocks.counters.get(DAILY)).toBe(1);
    });

    it("refuses a new demo once the day's limit is used up, and frees the slot", async () => {
      mocks.counters.set(DAILY, DEMO_DAILY_LIMIT);

      const result = await startDemo({});

      expect(result).toEqual({ success: false, error: "The demo is very busy today, please try again tomorrow" });
      expect(mocks.createUser).not.toHaveBeenCalled();
      expect(mocks.redis.has(KEY)).toBe(false);
      expect(mocks.counters.get(DAILY)).toBe(DEMO_DAILY_LIMIT);
    });

    it("never counts or blocks someone resuming their own demo", async () => {
      mocks.counters.set(DAILY, DEMO_DAILY_LIMIT);
      mocks.redis.set(KEY, "clerk_existing");

      expect((await startDemo({})).success).toBe(true);
      expect(mocks.counters.get(DAILY)).toBe(DEMO_DAILY_LIMIT);
    });

    it("gives the demo back when its creation fails", async () => {
      mocks.seedDemoUser.mockRejectedValue(new Error("seed failed"));

      await startDemo({});

      expect(mocks.counters.get(DAILY)).toBe(0);
    });
  });

  describe("refusals", () => {
    it("fails closed without a client IP", async () => {
      mocks.headerValues = {};

      expect((await startDemo({})).success).toBe(false);
      expect(mocks.createUser).not.toHaveBeenCalled();
    });

    it("fails closed without DEMO_COOKIE_SECRET", async () => {
      vi.stubEnv("DEMO_COOKIE_SECRET", "");

      expect((await startDemo({})).success).toBe(false);
      expect(mocks.createUser).not.toHaveBeenCalled();
    });

    it("does nothing for a visitor who is already signed in", async () => {
      mocks.getSessionUser.mockResolvedValue({ id: "u1" });

      expect(await startDemo({})).toEqual({ success: false, error: "You are already signed in" });
      expect(mocks.createUser).not.toHaveBeenCalled();
    });
  });
});
