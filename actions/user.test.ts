import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionUser, update } = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ getSessionUser }));
vi.mock("@/lib/db", () => ({ prisma: { user: { update } } }));

import { captureTimezone } from "./user";

describe("captureTimezone", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores the timezone on first sign-in", async () => {
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "UTC" });

    await captureTimezone("Europe/London");

    expect(update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { timezone: "Europe/London" },
    });
  });

  it("leaves an already captured timezone alone", async () => {
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "Asia/Tokyo" });

    await captureTimezone("Europe/London");

    expect(update).not.toHaveBeenCalled();
  });

  it("rejects an invalid timezone", async () => {
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "UTC" });

    await captureTimezone("Not/AZone");

    expect(update).not.toHaveBeenCalled();
  });

  it("does nothing when signed out", async () => {
    getSessionUser.mockResolvedValue(null);

    await captureTimezone("Europe/London");

    expect(update).not.toHaveBeenCalled();
  });
});
