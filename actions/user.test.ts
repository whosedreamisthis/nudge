import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionUser, update, revalidatePath, updateTag, cookieGet, cookieSet } = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  update: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ getSessionUser }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet, set: cookieSet }) }));
vi.mock("next/cache", () => ({ revalidatePath, updateTag }));
vi.mock("@/lib/db", () => ({ prisma: { user: { update } } }));

import { captureTimezone, setAiFeature, updateTimezone } from "./user";

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
    expect(updateTag).toHaveBeenCalledWith("user:u1:habits");
    expect(updateTag).toHaveBeenCalledWith("user:u1:completions");
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

describe("setAiFeature", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves each feature on its own column", async () => {
    getSessionUser.mockResolvedValue({ id: "u1", isDemo: false });

    expect((await setAiFeature("weeklyReport", false)).success).toBe(true);
    expect(update).toHaveBeenLastCalledWith({ where: { id: "u1" }, data: { aiWeeklyReport: false } });
    await setAiFeature("motivation", true);
    expect(update).toHaveBeenLastCalledWith({ where: { id: "u1" }, data: { aiMotivation: true } });
    await setAiFeature("habitSuggestions", false);
    expect(update).toHaveBeenLastCalledWith({ where: { id: "u1" }, data: { aiHabitSuggestions: false } });
  });

  it("rejects an unknown feature", async () => {
    getSessionUser.mockResolvedValue({ id: "u1", isDemo: false });

    expect(await setAiFeature("isDemo" as never, true)).toMatchObject({ success: false });
    expect(update).not.toHaveBeenCalled();
  });

  it("keeps a demo's choice in a cookie, not the database", async () => {
    getSessionUser.mockResolvedValue({ id: "u1", isDemo: true });
    cookieGet.mockReturnValue({ value: "motivation" });

    expect((await setAiFeature("weeklyReport", false)).success).toBe(true);
    expect(cookieSet).toHaveBeenCalledWith("nudge_ai_off", "motivation,weeklyReport", expect.any(Object));

    await setAiFeature("motivation", true);
    expect(cookieSet).toHaveBeenLastCalledWith("nudge_ai_off", "", expect.any(Object));
    expect(update).not.toHaveBeenCalled();
  });

  it("is blocked when signed out", async () => {
    getSessionUser.mockResolvedValue(null);
    expect(await setAiFeature("weeklyReport", false)).toMatchObject({ success: false });
    expect(update).not.toHaveBeenCalled();
  });
});
