import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, findUnique, upsert, revokeSession } = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  upsert: vi.fn(),
  revokeSession: vi.fn(),
}));

// React's cache() is only available inside a render; make it a passthrough here
vi.mock("react", () => ({ cache: <T>(fn: T) => fn }));
vi.mock("@clerk/nextjs/server", () => ({
  auth,
  clerkClient: async () => ({ sessions: { revokeSession } }),
}));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique, upsert } } }));

import { getSessionUser } from "./session";

describe("getSessionUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUnique.mockResolvedValue(null);
  });

  it("returns null when signed out", async () => {
    auth.mockResolvedValue({ userId: null });

    expect(await getSessionUser()).toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("returns the existing User row without writing", async () => {
    auth.mockResolvedValue({ userId: "user_1" });
    findUnique.mockResolvedValue({ id: "u1", clerkId: "user_1", timezone: "UTC" });

    expect((await getSessionUser())?.id).toBe("u1");
    expect(findUnique).toHaveBeenCalledWith({ where: { clerkId: "user_1" } });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("creates the User row when it is missing", async () => {
    auth.mockResolvedValue({ userId: "user_1" });
    upsert.mockResolvedValue({ id: "u1", clerkId: "user_1", timezone: "UTC" });

    const user = await getSessionUser();

    expect(user?.id).toBe("u1");
    expect(upsert).toHaveBeenCalledWith({
      where: { clerkId: "user_1" },
      update: {},
      create: { clerkId: "user_1" },
    });
  });

  describe("demo users", () => {
    const row = (isDemo: boolean, demoExpiresAt: Date | null) => ({
      id: "u1",
      clerkId: "user_1",
      timezone: "UTC",
      isDemo,
      demoExpiresAt,
    });

    beforeEach(() => {
      auth.mockResolvedValue({ userId: "user_1", sessionId: "sess_1" });
      revokeSession.mockResolvedValue({});
    });

    it("lets a live demo through", async () => {
      findUnique.mockResolvedValue(row(true, new Date(Date.now() + 60_000)));

      expect((await getSessionUser())?.id).toBe("u1");
      expect(revokeSession).not.toHaveBeenCalled();
    });

    it("blocks an expired demo and revokes its session", async () => {
      findUnique.mockResolvedValue(row(true, new Date(Date.now() - 1000)));

      expect(await getSessionUser()).toBeNull();
      expect(revokeSession).toHaveBeenCalledWith("sess_1");
    });

    it("blocks a demo with no expiry", async () => {
      findUnique.mockResolvedValue(row(true, null));

      expect(await getSessionUser()).toBeNull();
    });

    it("still blocks when the session cannot be revoked", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      findUnique.mockResolvedValue(row(true, new Date(Date.now() - 1000)));
      revokeSession.mockRejectedValue(new Error("clerk is down"));

      expect(await getSessionUser()).toBeNull();
    });

    it("never blocks a real user", async () => {
      findUnique.mockResolvedValue(row(false, null));

      expect((await getSessionUser())?.id).toBe("u1");
    });
  });
});
