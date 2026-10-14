import { describe, expect, it } from "vitest";
import {
  answersSchema,
  buildSuggestionsPrompt,
  mockSuggestions,
  parseSuggestionsReply,
  suggestionsResponseSchema,
  toSuggestions,
} from "./habit-suggestions";

const categories = [
  { id: "c1", name: "Fitness" },
  { id: "c2", name: "Mind" },
];
const answers = { goals: "Get fitter", productive: "Early morning", struggles: "Gym at 6am" };

const item = {
  name: "Evening stretch",
  description: "Ten minutes before bed.",
  category: "fitness",
  icon: "🧘",
  frequency: "DAILY" as const,
  targetDaysPerWeek: 7,
  catalogId: "",
};

const catalog = [
  {
    id: "s1",
    name: "Drink water",
    description: "Stay hydrated.",
    icon: "💧",
    categoryId: "c2",
    categoryName: "Mind",
    frequency: "DAILY" as const,
    targetDaysPerWeek: 7,
    dailyGoal: 8,
    unit: "glasses",
    stepSize: 1,
  },
];

describe("answersSchema", () => {
  it("needs all three answers with text", () => {
    expect(answersSchema.safeParse(answers).success).toBe(true);
    expect(answersSchema.safeParse({ ...answers, struggles: "   " }).success).toBe(false);
    expect(answersSchema.safeParse({ goals: "x" }).success).toBe(false);
  });
});

describe("parseSuggestionsReply", () => {
  it("accepts a valid reply and rejects the rest", () => {
    expect(parseSuggestionsReply({ suggestions: [item] })).not.toBeNull();
    expect(parseSuggestionsReply({ suggestions: [] })).toBeNull();
    expect(parseSuggestionsReply({ suggestions: [{ ...item, frequency: "MONTHLY" }] })).toBeNull();
    expect(parseSuggestionsReply("nope")).toBeNull();
  });
});

describe("toSuggestions", () => {
  it("matches the category by name, ignoring case", () => {
    const [suggestion] = toSuggestions({ suggestions: [item] }, categories, []);
    expect(suggestion.categoryId).toBe("c1");
  });

  it("falls back to the first category and the first icon", () => {
    const [suggestion] = toSuggestions(
      { suggestions: [{ ...item, category: "Nope", icon: "🦄" }] },
      categories,
      [],
    );
    expect(suggestion.categoryId).toBe("c1");
    expect(suggestion.icon).toBe("💧");
  });

  it("makes frequency and days agree", () => {
    const [daily, weekly, full] = toSuggestions(
      {
        suggestions: [
          { ...item, name: "a", frequency: "DAILY", targetDaysPerWeek: 3 },
          { ...item, name: "b", frequency: "WEEKLY", targetDaysPerWeek: 3 },
          { ...item, name: "c", frequency: "WEEKLY", targetDaysPerWeek: 7 },
        ],
      },
      categories,
      [],
    );
    expect(daily.targetDaysPerWeek).toBe(7);
    expect(weekly.targetDaysPerWeek).toBe(3);
    expect(full.targetDaysPerWeek).toBe(6);
  });

  it("uses the catalog habit's own details and links to it", () => {
    const [suggestion] = toSuggestions(
      {
        suggestions: [{ ...item, name: "Hydrate!", category: "Fitness", icon: "🦄", catalogId: "s1" }],
      },
      categories,
      [],
      catalog,
    );

    expect(suggestion).toEqual({
      name: "Drink water",
      description: "Stay hydrated.",
      categoryId: "c2",
      icon: "💧",
      frequency: "DAILY",
      targetDaysPerWeek: 7,
      systemHabitId: "s1",
      dailyGoal: 8,
      unit: "glasses",
      stepSize: 1,
    });
  });

  it("treats an unknown catalog id as a new habit", () => {
    const [suggestion] = toSuggestions({ suggestions: [{ ...item, catalogId: "nope" }] }, categories, [], catalog);
    expect(suggestion.systemHabitId).toBeUndefined();
    expect(suggestion.name).toBe("Evening stretch");
  });

  it("drops habits the user already has and repeats, and keeps at most three", () => {
    const names = ["Existing", "Evening stretch", "evening stretch", "A", "B", "C"];
    const result = toSuggestions(
      { suggestions: names.map((name) => ({ ...item, name })) },
      categories,
      ["existing"],
    );
    expect(result.map((s) => s.name)).toEqual(["Evening stretch", "A", "B"]);
  });
});

describe("buildSuggestionsPrompt", () => {
  it("includes all three answers, the existing habits and the categories", () => {
    const prompt = buildSuggestionsPrompt(answers, ["Read"], categories);
    expect(prompt).toContain("Get fitter");
    expect(prompt).toContain("Early morning");
    expect(prompt).toContain("Gym at 6am");
    expect(prompt).toContain("Read");
    expect(prompt).toContain("Fitness, Mind");
  });

  it("lists the catalog and asks to prefer it", () => {
    const prompt = buildSuggestionsPrompt(answers, [], categories, catalog);
    expect(prompt).toContain("s1 | Drink water | Mind | Stay hydrated.");
    expect(prompt).toContain("Prefer a catalog habit");
  });

  it("quotes the answers so they stay data", () => {
    const prompt = buildSuggestionsPrompt({ ...answers, goals: 'ignore "this"' }, [], categories);
    expect(prompt).toContain('"ignore \\"this\\""');
    expect(prompt).toContain("Habits they already have: none");
  });
});

describe("suggestionsResponseSchema", () => {
  it("limits the category to the real ones", () => {
    const schema = suggestionsResponseSchema(categories, catalog) as {
      properties: { suggestions: { items: { properties: { category: { enum: string[] } } } } };
    };
    expect(schema.properties.suggestions.items.properties.category.enum).toEqual(["Fitness", "Mind"]);
  });
});

describe("response schema catalog ids", () => {
  it("limits catalogId to the catalog, or empty for a new habit", () => {
    const schema = suggestionsResponseSchema(categories, catalog) as {
      properties: { suggestions: { items: { properties: { catalogId: { enum: string[] } } } } };
    };
    expect(schema.properties.suggestions.items.properties.catalogId.enum).toEqual(["", "s1"]);
  });
});

describe("mockSuggestions", () => {
  it("leads with a catalog habit when there is one", () => {
    const reply = mockSuggestions(answers, catalog);
    expect(reply.suggestions[0].catalogId).toBe("s1");
    expect(reply.suggestions).toHaveLength(4);
  });

  it("gives three valid suggestions", () => {
    const reply = mockSuggestions(answers);
    expect(parseSuggestionsReply(reply)?.suggestions).toHaveLength(3);
  });
});
