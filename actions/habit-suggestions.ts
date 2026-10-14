"use server";

import { getAiSettings } from "@/lib/ai-settings";
import { prisma } from "@/lib/db";
import { getCatalogHabits } from "@/lib/db/catalog";
import { generateJson, isAiDisabled } from "@/lib/gemini";
import {
  answersSchema,
  buildSuggestionsPrompt,
  type CatalogHabit,
  type HabitSuggestion,
  mockSuggestions,
  parseSuggestionsReply,
  suggestionsResponseSchema,
  toSuggestions,
} from "@/lib/habit-suggestions";
import { getSessionUser } from "@/lib/session";
import type { ActionResult } from "@/types/actions";

// Suggests new habits from the wizard's three answers. Nothing is stored: the answers are used for
// this one request and the suggestions go back to the browser.
export async function suggestHabits(input: unknown): Promise<ActionResult<HabitSuggestion[]>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Not signed in" };
  if (!(await getAiSettings(user)).habitSuggestions) {
    return { success: false, error: "AI features are turned off in Settings" };
  }

  const answers = answersSchema.safeParse(input);
  if (!answers.success) return { success: false, error: "Answer all three questions" };

  try {
    const [categories, habits, catalogRows] = await Promise.all([
      prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.habit.findMany({ where: { userId: user.id, archivedAt: null }, select: { name: true } }),
      getCatalogHabits(user.id, { q: "", category: "" }),
    ]);
    const existingNames = habits.map((habit) => habit.name);
    // Not yet added, and not archived (those are restored from the catalog, not added again)
    const catalog: CatalogHabit[] = catalogRows
      .filter((row) => row.habits.length === 0)
      .map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        icon: row.icon,
        categoryId: row.categoryId,
        categoryName: row.category.name,
        frequency: row.defaultFrequency,
        targetDaysPerWeek: row.defaultTargetDaysPerWeek,
        dailyGoal: row.defaultDailyGoal,
        unit: row.defaultUnit,
        stepSize: row.defaultStepSize,
      }));

    const raw = isAiDisabled()
      ? mockSuggestions(answers.data, catalog)
      : await generateJson(
          buildSuggestionsPrompt(answers.data, existingNames, categories, catalog),
          suggestionsResponseSchema(categories, catalog),
        );
    const reply = parseSuggestionsReply(raw);
    const suggestions = reply ? toSuggestions(reply, categories, existingNames, catalog) : [];
    if (suggestions.length === 0) {
      return { success: false, error: "Could not read the suggestions. Try again." };
    }

    return { success: true, data: suggestions };
  } catch (error) {
    console.error("Could not suggest habits:", error);
    return { success: false, error: "Could not get suggestions. Try again." };
  }
}
