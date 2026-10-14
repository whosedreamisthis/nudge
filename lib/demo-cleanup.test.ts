import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoMetadata } from "@/lib/demo";
import { cleanupDemos } from "@/lib/demo-cleanup";

const NOW = new Date("2026-10-14T12:00:00Z");

const findMany = vi.fn();
const deleteMany = vi.fn();
const getUserList = vi.fn();
const deleteUser = vi.fn();

const run = () =>
  cleanupDemos({
    db: { user: { findMany, deleteMany } } as never,
    clerk: { users: { getUserList, deleteUser } },
    now: NOW,
  });

const demoMeta = demoMetadata(new Date("2026-10-14T00:00:00Z"));

describe("cleanupDemos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([]);
    getUserList.mockResolvedValue({ data: [] });
    deleteUser.mockResolvedValue({});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("does nothing when nothing has expired", async () => {
    expect(await run()).toEqual({ expiredDeleted: 0, orphansDeleted: 0, failed: 0 });
    expect(deleteUser).not.toHaveBeenCalled();
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("looks only for expired demos", async () => {
    await run();

    expect(findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { isDemo: true, OR: [{ demoExpiresAt: null }, { demoExpiresAt: { lte: NOW } }] },
      }),
    );
  });

  it("deletes the Clerk user first, then the database user", async () => {
    findMany.mockResolvedValueOnce([{ id: "u1", clerkId: "clerk_1" }]);
    const order: string[] = [];
    deleteUser.mockImplementation(async () => order.push("clerk"));
    deleteMany.mockImplementation(async () => order.push("db"));

    expect(await run()).toMatchObject({ expiredDeleted: 1, failed: 0 });
    expect(order).toEqual(["clerk", "db"]);
    expect(deleteUser).toHaveBeenCalledWith("clerk_1");
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("keeps the database row when the Clerk delete fails, so the next run retries", async () => {
    findMany.mockResolvedValueOnce([
      { id: "u1", clerkId: "clerk_1" },
      { id: "u2", clerkId: "clerk_2" },
    ]);
    deleteUser.mockRejectedValueOnce(new Error("clerk is down")).mockResolvedValueOnce({});

    expect(await run()).toMatchObject({ expiredDeleted: 1, failed: 1 });
    expect(deleteMany).toHaveBeenCalledTimes(1);
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: "u2" } });
  });

  it("treats a Clerk user that is already gone as deleted", async () => {
    findMany.mockResolvedValueOnce([{ id: "u1", clerkId: "clerk_1" }]);
    deleteUser.mockRejectedValueOnce({ status: 404 });

    expect(await run()).toMatchObject({ expiredDeleted: 1, failed: 0 });
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("sweeps Clerk demo users with no database row, and leaves the rest", async () => {
    getUserList.mockResolvedValue({
      data: [
        { id: "orphan", publicMetadata: demoMeta },
        { id: "has_row", publicMetadata: demoMeta },
        { id: "real_user", publicMetadata: {} },
      ],
    });
    // First call: expired demos (none); second: which candidates have rows
    findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: "u9", clerkId: "has_row" }]);

    expect(await run()).toEqual({ expiredDeleted: 0, orphansDeleted: 1, failed: 0 });
    expect(deleteUser).toHaveBeenCalledTimes(1);
    expect(deleteUser).toHaveBeenCalledWith("orphan");
    expect(findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { clerkId: { in: ["orphan", "has_row"] } } }),
    );
  });

  it("skips Clerk users created in the last ten minutes", async () => {
    await run();

    expect(getUserList).toHaveBeenCalledWith(
      expect.objectContaining({ createdAtBefore: NOW.getTime() - 10 * 60 * 1000 }),
    );
  });

  it("collects every page before deleting, so paging never shifts", async () => {
    const page = (start: number) => ({
      data: Array.from({ length: 100 }, (_, i) => ({ id: `c${start + i}`, publicMetadata: demoMeta })),
    });
    getUserList.mockResolvedValueOnce(page(0)).mockResolvedValueOnce({
      data: [{ id: "c100", publicMetadata: demoMeta }],
    });
    const listCallsAtDelete: number[] = [];
    deleteUser.mockImplementation(async () => listCallsAtDelete.push(getUserList.mock.calls.length));

    expect(await run()).toMatchObject({ orphansDeleted: 101 });
    expect(getUserList).toHaveBeenCalledTimes(2);
    expect(new Set(listCallsAtDelete)).toEqual(new Set([2]));
  });

  it("counts a failed orphan delete and carries on", async () => {
    getUserList.mockResolvedValue({
      data: [
        { id: "a", publicMetadata: demoMeta },
        { id: "b", publicMetadata: demoMeta },
      ],
    });
    deleteUser.mockRejectedValueOnce(new Error("nope")).mockResolvedValueOnce({});

    expect(await run()).toMatchObject({ orphansDeleted: 1, failed: 1 });
  });
});
