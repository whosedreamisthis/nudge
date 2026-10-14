import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyWebhook, upsert, deleteMany } = vi.hoisted(() => ({
  verifyWebhook: vi.fn(),
  upsert: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("@clerk/nextjs/webhooks", () => ({ verifyWebhook }));
vi.mock("@/lib/db", () => ({ prisma: { user: { upsert, deleteMany } } }));

import { POST } from "./route";

const req = () => new Request("http://localhost/api/webhooks/clerk", { method: "POST" });
const post = () => POST(req() as never);

describe("POST /api/webhooks/clerk", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 on a bad signature and touches nothing", async () => {
    verifyWebhook.mockRejectedValue(new Error("bad signature"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await post();

    expect(res.status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it.each(["user.created", "user.updated"])("upserts the user on %s", async (type) => {
    verifyWebhook.mockResolvedValue({ type, data: { id: "user_1" } });

    const res = await post();

    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith({
      where: { clerkId: "user_1" },
      update: {},
      create: { clerkId: "user_1" },
    });
  });

  it("deletes the user on user.deleted", async () => {
    verifyWebhook.mockResolvedValue({ type: "user.deleted", data: { id: "user_1" } });

    const res = await post();

    expect(res.status).toBe(200);
    expect(deleteMany).toHaveBeenCalledWith({ where: { clerkId: "user_1" } });
  });

  it("ignores user.deleted without an id", async () => {
    verifyWebhook.mockResolvedValue({ type: "user.deleted", data: {} });

    const res = await post();

    expect(res.status).toBe(200);
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("acknowledges unhandled events without writing", async () => {
    verifyWebhook.mockResolvedValue({ type: "session.created", data: { id: "sess_1" } });

    const res = await post();

    expect(res.status).toBe(200);
    expect(upsert).not.toHaveBeenCalled();
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("is safe to deliver twice", async () => {
    verifyWebhook.mockResolvedValue({ type: "user.created", data: { id: "user_1" } });

    expect((await post()).status).toBe(200);
    expect((await post()).status).toBe(200);
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it("marks a demo user from its Clerk metadata", async () => {
    verifyWebhook.mockResolvedValue({
      type: "user.created",
      data: { id: "demo_1", public_metadata: { isDemo: true, demoExpiresAt: "2026-10-15T00:00:00.000Z" } },
    });

    expect((await post()).status).toBe(200);
    expect(upsert).toHaveBeenCalledWith({
      where: { clerkId: "demo_1" },
      update: {},
      create: { clerkId: "demo_1", isDemo: true, demoExpiresAt: new Date("2026-10-15T00:00:00.000Z") },
    });
  });

  it("does not mark an ordinary user as a demo", async () => {
    verifyWebhook.mockResolvedValue({
      type: "user.created",
      data: { id: "user_1", public_metadata: { plan: "free" } },
    });

    await post();

    expect(upsert).toHaveBeenCalledWith({
      where: { clerkId: "user_1" },
      update: {},
      create: { clerkId: "user_1" },
    });
  });

  it("does not fail when a demo is deleted twice (the cleanup job deleted the row first)", async () => {
    verifyWebhook.mockResolvedValue({ type: "user.deleted", data: { id: "demo_1" } });
    deleteMany.mockResolvedValue({ count: 0 });

    expect((await post()).status).toBe(200);
    expect(deleteMany).toHaveBeenCalledWith({ where: { clerkId: "demo_1" } });
  });
});
