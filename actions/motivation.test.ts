import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionUser, upsert, update, getMotivation, getRecentHistory, generateJson, isAiDisabled } =
  vi.hoisted(() => ({
    getSessionUser: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    getMotivation: vi.fn(),
    getRecentHistory: vi.fn(),
    generateJson: vi.fn(),
    isAiDisabled: vi.fn(() => false),
  }));

vi.mock("@/lib/session", () => ({ getSessionUser }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { aiReport: { upsert, update } } }));
vi.mock("@/lib/db/motivation", () => ({ getMotivation, getRecentHistory }));
vi.mock("@/lib/gemini", () => ({ generateJson, isAiDisabled }));

import { dismissMotivation, generateMotivation } from "./motivation";

const stored = { message: "Keep it up", dismissed: false };

describe("generateMotivation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "UTC", aiMotivation: true });
    getMotivation.mockResolvedValue(null);
    getRecentHistory.mockResolvedValue([{ name: "Read", done: 4 }]);
    generateJson.mockResolvedValue({ message: "Keep it up" });
    upsert.mockResolvedValue({});
  });

  it("requires a signed-in user and AI to be on", async () => {
    getSessionUser.mockResolvedValueOnce(null);
    expect((await generateMotivation()).success).toBe(false);

    getSessionUser.mockResolvedValueOnce({ id: "u1", timezone: "UTC", aiMotivation: false });
    expect((await generateMotivation()).success).toBe(false);
    expect(generateJson).not.toHaveBeenCalled();
  });

  it("reuses today's stored message without calling Gemini", async () => {
    getMotivation.mockResolvedValueOnce(stored);

    expect(await generateMotivation()).toEqual({ success: true, data: stored });
    expect(generateJson).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("generates a general message for a user with no history", async () => {
    getRecentHistory.mockResolvedValueOnce([]);

    expect(await generateMotivation()).toEqual({ success: true, data: stored });
    expect(generateJson.mock.calls[0][0]).toContain("no habit history");
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it("generates and stores a message", async () => {
    const result = await generateMotivation();

    expect(result).toEqual({ success: true, data: stored });
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert.mock.calls[0][0].create).toMatchObject({
      userId: "u1",
      type: "MOTIVATION",
      content: stored,
    });
  });

  it("uses the mock instead of Gemini when AI is disabled", async () => {
    isAiDisabled.mockReturnValueOnce(true);

    const result = await generateMotivation();

    expect(generateJson).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it("fails on an unreadable reply", async () => {
    generateJson.mockResolvedValueOnce({ nope: 1 });

    expect((await generateMotivation()).success).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("dismissMotivation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionUser.mockResolvedValue({ id: "u1", timezone: "UTC", aiMotivation: true });
    getMotivation.mockResolvedValue(stored);
  });

  it("marks today's message dismissed", async () => {
    expect((await dismissMotivation()).success).toBe(true);
    expect(update.mock.calls[0][0].data).toEqual({
      content: { message: "Keep it up", dismissed: true },
    });
  });

  it("requires a signed-in user", async () => {
    getSessionUser.mockResolvedValueOnce(null);

    expect((await dismissMotivation()).success).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
