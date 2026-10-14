import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieGet } = vi.hoisted(() => ({ cookieGet: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet }) }));

import { getAiSettings } from "./ai-settings";

const row = { isDemo: false, aiWeeklyReport: false, aiMotivation: true, aiHabitSuggestions: true };

describe("getAiSettings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads a real user's switches from the row", async () => {
    expect(await getAiSettings(row)).toEqual({ weeklyReport: false, motivation: true, habitSuggestions: true });
    expect(cookieGet).not.toHaveBeenCalled();
  });

  it("reads a demo's switched-off features from the cookie", async () => {
    cookieGet.mockReturnValue({ value: "motivation,bogus" });
    expect(await getAiSettings({ ...row, isDemo: true })).toEqual({
      weeklyReport: true,
      motivation: false,
      habitSuggestions: true,
    });
  });

  it("has everything on for a demo with no cookie", async () => {
    cookieGet.mockReturnValue(undefined);
    expect(await getAiSettings({ ...row, isDemo: true })).toEqual({
      weeklyReport: true,
      motivation: true,
      habitSuggestions: true,
    });
  });
});
