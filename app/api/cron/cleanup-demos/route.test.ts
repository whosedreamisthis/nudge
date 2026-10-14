import { beforeEach, describe, expect, it, vi } from "vitest";

const { clerkClient, cleanupDemos } = vi.hoisted(() => ({
  clerkClient: vi.fn(),
  cleanupDemos: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ clerkClient }));
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/demo-cleanup", () => ({ cleanupDemos }));

import { GET } from "./route";

const get = (authorization?: string) =>
  GET(
    new Request("http://localhost/api/cron/cleanup-demos", {
      headers: authorization ? { authorization } : {},
    }) as never,
  );

describe("GET /api/cron/cleanup-demos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "s3cret");
    clerkClient.mockResolvedValue({ users: {} });
    cleanupDemos.mockResolvedValue({ expiredDeleted: 2, orphansDeleted: 1, failed: 0 });
  });

  it("rejects a missing or wrong token and does nothing", async () => {
    expect((await get()).status).toBe(401);
    expect((await get("Bearer wrong!")).status).toBe(401);
    expect(cleanupDemos).not.toHaveBeenCalled();
  });

  it("rejects everything when CRON_SECRET is not set", async () => {
    vi.stubEnv("CRON_SECRET", "");

    expect((await get("Bearer ")).status).toBe(401);
    expect(cleanupDemos).not.toHaveBeenCalled();
  });

  it("runs the cleanup and returns its counts", async () => {
    const res = await get("Bearer s3cret");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ expiredDeleted: 2, orphansDeleted: 1, failed: 0 });
  });

  it("returns 500 when the cleanup throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    cleanupDemos.mockRejectedValue(new Error("boom"));

    expect((await get("Bearer s3cret")).status).toBe(500);
  });
});
