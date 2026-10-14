import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionUser, update, revalidatePath } = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  update: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ getSessionUser }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/db", () => ({ prisma: { user: { update } } }));

import { captureTimezone, setAiEnabled, updateTimezone } from "./user";

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

describe("updateTimezone", () => {
  beforeEach(() => vi.clearAllMocks());

  it("changes the timezone and refreshes every page", async () => {
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "Asia/Tokyo", isDemo: false });

    const result = await updateTimezone("Europe/London");

    expect(result.success).toBe(true);
    expect(update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { timezone: "Europe/London" } });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("rejects an invalid timezone", async () => {
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "UTC", isDemo: false });

    expect(await updateTimezone("Not/AZone")).toMatchObject({ success: false });
    expect(update).not.toHaveBeenCalled();
  });

  it("is blocked for a demo user and when signed out", async () => {
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "UTC", isDemo: true });
    expect(await updateTimezone("Europe/London")).toMatchObject({ success: false });

    getSessionUser.mockResolvedValue(null);
    expect(await updateTimezone("Europe/London")).toMatchObject({ success: false });
    expect(update).not.toHaveBeenCalled();
  });
});

describe("setAiEnabled", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves the switch", async () => {
    getSessionUser.mockResolvedValue({ id: "u1", isDemo: false });

    expect((await setAiEnabled(false)).success).toBe(true);
    expect(update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { aiEnabled: false } });
  });

  it("is blocked for a demo user and when signed out", async () => {
    getSessionUser.mockResolvedValue({ id: "u1", isDemo: true });
    expect(await setAiEnabled(false)).toMatchObject({ success: false });

    getSessionUser.mockResolvedValue(null);
    expect(await setAiEnabled(false)).toMatchObject({ success: false });
    expect(update).not.toHaveBeenCalled();
  });
});
