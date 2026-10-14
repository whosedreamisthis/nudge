import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionUser, findCategories, findHabits, getCatalogHabits, generateJson, isAiDisabled } = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  findCategories: vi.fn(),
  findHabits: vi.fn(),
  getCatalogHabits: vi.fn(),
  generateJson: vi.fn(),
  isAiDisabled: vi.fn(() => false),
}));

vi.mock("@/lib/session", () => ({ getSessionUser }));
vi.mock("@/lib/db", () => ({
  prisma: { category: { findMany: findCategories }, habit: { findMany: findHabits } },
}));
vi.mock("@/lib/db/catalog", () => ({ getCatalogHabits }));
vi.mock("@/lib/gemini", () => ({ generateJson, isAiDisabled }));

import { suggestHabits } from "./habit-suggestions";

const answers = { goals: "Get fitter", productive: "Early morning", struggles: "Gym at 6am" };
const reply = {
  suggestions: [
    { name: "Stretch", description: "d", category: "Fitness", icon: "🧘", frequency: "DAILY", targetDaysPerWeek: 7 },
    { name: "Read", description: "d", category: "Mind", icon: "📚", frequency: "WEEKLY", targetDaysPerWeek: 3 },
  ],
};

describe("suggestHabits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAiDisabled.mockReturnValue(false);
    getSessionUser.mockResolvedValue({ id: "u1", isDemo: false, aiHabitSuggestions: true });
    findCategories.mockResolvedValue([
      { id: "c1", name: "Fitness" },
      { id: "c2", name: "Mind" },
    ]);
    findHabits.mockResolvedValue([{ name: "Water" }]);
    getCatalogHabits.mockResolvedValue([
      {
        id: "s1",
        name: "Drink water",
        description: "Stay hydrated.",
        icon: "💧",
        categoryId: "c2",
        category: { name: "Mind" },
        defaultFrequency: "DAILY",
        defaultTargetDaysPerWeek: 7,
        defaultDailyGoal: 8,
        defaultUnit: "glasses",
        defaultStepSize: 1,
        habits: [],
      },
      { id: "s2", name: "Archived one", description: "", icon: "🏃", categoryId: "c1", category: { name: "Fitness" }, defaultFrequency: "DAILY", defaultTargetDaysPerWeek: 7, defaultDailyGoal: null, defaultUnit: null, defaultStepSize: null, habits: [{ id: "old" }] },
    ]);
    generateJson.mockResolvedValue(reply);
  });

  it("requires a signed-in user and the switch to be on", async () => {
    getSessionUser.mockResolvedValueOnce(null);
    expect((await suggestHabits(answers)).success).toBe(false);

    getSessionUser.mockResolvedValueOnce({ id: "u1", isDemo: false, aiHabitSuggestions: false });
    expect((await suggestHabits(answers)).success).toBe(false);
    expect(generateJson).not.toHaveBeenCalled();
  });

  it("needs all three answers", async () => {
    expect((await suggestHabits({ ...answers, struggles: " " })).success).toBe(false);
    expect((await suggestHabits(null)).success).toBe(false);
    expect(generateJson).not.toHaveBeenCalled();
  });

  it("returns the suggestions with real category ids", async () => {
    const result = await suggestHabits(answers);

    expect(result).toEqual({
      success: true,
      data: [
        { name: "Stretch", description: "d", categoryId: "c1", icon: "🧘", frequency: "DAILY", targetDaysPerWeek: 7 },
        { name: "Read", description: "d", categoryId: "c2", icon: "📚", frequency: "WEEKLY", targetDaysPerWeek: 3 },
      ],
    });
  });

  it("offers catalog habits the user can add and returns a catalog pick linked to it", async () => {
    generateJson.mockResolvedValueOnce({
      suggestions: [{ name: "Drink water", description: "", category: "", icon: "", frequency: "DAILY", targetDaysPerWeek: 7, catalogId: "s1" }],
    });

    const result = await suggestHabits(answers);

    const prompt = generateJson.mock.calls[0][0] as string;
    expect(prompt).toContain("s1 | Drink water");
    expect(prompt).not.toContain("Archived one");
    expect(getCatalogHabits).toHaveBeenCalledWith("u1", { q: "", category: "" });
    expect(result).toMatchObject({
      success: true,
      data: [{ name: "Drink water", systemHabitId: "s1", dailyGoal: 8, unit: "glasses", stepSize: 1, categoryId: "c2" }],
    });
  });

  it("puts the answers and the user's habits in the prompt, scoped to the user", async () => {
    await suggestHabits(answers);

    const prompt = generateJson.mock.calls[0][0] as string;
    expect(prompt).toContain("Early morning");
    expect(prompt).toContain("Gym at 6am");
    expect(prompt).toContain("Water");
    expect(findHabits).toHaveBeenCalledWith({
      where: { userId: "u1", archivedAt: null },
      select: { name: true },
    });
  });

  it("uses mock suggestions when AI is disabled", async () => {
    isAiDisabled.mockReturnValue(true);

    const result = await suggestHabits(answers);

    expect(result.success).toBe(true);
    expect(generateJson).not.toHaveBeenCalled();
  });

  it("fails on an unreadable reply or a Gemini error", async () => {
    generateJson.mockResolvedValueOnce({ nope: true });
    expect((await suggestHabits(answers)).success).toBe(false);

    generateJson.mockRejectedValueOnce(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await suggestHabits(answers)).success).toBe(false);
  });
});
