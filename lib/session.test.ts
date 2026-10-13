import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, upsert } = vi.hoisted(() => ({ auth: vi.fn(), upsert: vi.fn() }));

// React's cache() is only available inside a render; make it a passthrough here
vi.mock("react", () => ({ cache: <T>(fn: T) => fn }));
vi.mock("@clerk/nextjs/server", () => ({ auth }));
vi.mock("@/lib/db", () => ({ prisma: { user: { upsert } } }));

import { getSessionUser } from "./session";

describe("getSessionUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when signed out", async () => {
    auth.mockResolvedValue({ userId: null });

    expect(await getSessionUser()).toBeNull();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("finds or creates the User row for the Clerk id", async () => {
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
});
