import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionUser, upsert, getWeeklyReport, getWeekGrid, getProgressStats, generateJson } =
  vi.hoisted(() => ({
    getSessionUser: vi.fn(),
    upsert: vi.fn(),
    getWeeklyReport: vi.fn(),
    getWeekGrid: vi.fn(),
    getProgressStats: vi.fn(),
    generateJson: vi.fn(),
  }));

vi.mock("@/lib/session", () => ({ getSessionUser }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { aiReport: { upsert } } }));
vi.mock("@/lib/db/ai-report", () => ({ getWeeklyReport }));
vi.mock("@/lib/db/progress", () => ({ getWeekGrid, getProgressStats }));
const { isAiDisabled } = vi.hoisted(() => ({ isAiDisabled: vi.fn(() => false) }));
vi.mock("@/lib/gemini", () => ({ generateJson, isAiDisabled }));

import { generateWeeklyReport } from "./ai-report";

const report = { summary: "Good week", insights: ["a", "b", "c"] };

describe("generateWeeklyReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "UTC", aiWeeklyReport: true });
    getWeeklyReport.mockResolvedValue(null);
    getWeekGrid.mockResolvedValue([{ id: "h1", name: "Read", days: [], done: 0, target: 7 }]);
    getProgressStats.mockResolvedValue({ activeStreaks: 1, bestStreak: null });
    generateJson.mockResolvedValue(report);
    upsert.mockResolvedValue({ updatedAt: new Date("2026-10-14T10:00:00Z") });
  });

  it("requires a signed-in user and AI to be on", async () => {
    getSessionUser.mockResolvedValueOnce(null);
    expect((await generateWeeklyReport({ regenerate: false })).success).toBe(false);

    getSessionUser.mockResolvedValueOnce({ id: "u1", timezone: "UTC", aiWeeklyReport: false });
    const off = await generateWeeklyReport({ regenerate: false });
    expect(off.success).toBe(false);
    expect(generateJson).not.toHaveBeenCalled();
  });

  it("generates and stores a report when there is none", async () => {
    const result = await generateWeeklyReport({ regenerate: false });

    expect(result).toEqual({
      success: true,
      data: { ...report, generatedAt: "2026-10-14T10:00:00.000Z" },
    });
    expect(upsert.mock.calls[0][0].create).toMatchObject({
      userId: "u1",
      type: "WEEKLY",
      content: report,
    });
  });

  it("reuses a stored report instead of calling Gemini", async () => {
    const stored = { ...report, generatedAt: "2026-10-13T10:00:00.000Z" };
    getWeeklyReport.mockResolvedValue(stored);

    const result = await generateWeeklyReport({ regenerate: false });

    expect(result).toEqual({ success: true, data: stored });
    expect(generateJson).not.toHaveBeenCalled();
  });

  it("refuses to regenerate inside the cooldown", async () => {
    getWeeklyReport.mockResolvedValue({ ...report, generatedAt: new Date().toISOString() });

    const result = await generateWeeklyReport({ regenerate: true });

    expect(result.success).toBe(false);
    expect(generateJson).not.toHaveBeenCalled();
  });

  it("regenerates once the cooldown has passed", async () => {
    getWeeklyReport.mockResolvedValue({ ...report, generatedAt: "2020-01-01T00:00:00.000Z" });

    const result = await generateWeeklyReport({ regenerate: true });

    expect(result.success).toBe(true);
    expect(generateJson).toHaveBeenCalledOnce();
    expect(upsert).toHaveBeenCalledOnce();
  });

  it("does not call Gemini when there are no habits", async () => {
    getWeekGrid.mockResolvedValue([]);

    expect((await generateWeeklyReport({ regenerate: false })).success).toBe(false);
    expect(generateJson).not.toHaveBeenCalled();
  });

  it("rejects a malformed model reply and stores nothing", async () => {
    generateJson.mockResolvedValue({ summary: "x", insights: ["only one"] });

    expect((await generateWeeklyReport({ regenerate: false })).success).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("uses a mock report instead of Gemini when AI is disabled by env", async () => {
    isAiDisabled.mockReturnValueOnce(true);

    const result = await generateWeeklyReport({ regenerate: false });

    expect(result.success).toBe(true);
    expect(generateJson).not.toHaveBeenCalled();
    expect(upsert.mock.calls[0][0].create.content.summary).toContain("Mock report");
  });

  it("returns an error when Gemini fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    generateJson.mockRejectedValue(new Error("boom"));

    expect(await generateWeeklyReport({ regenerate: false })).toEqual({
      success: false,
      error: "Could not generate the report, try again",
    });
  });
});
