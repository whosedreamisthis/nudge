import { describe, expect, it } from "vitest";
import { MAX_ENTRY_LENGTH, saveEntrySchema } from "@/lib/journal";

describe("saveEntrySchema", () => {
  it("accepts text with a mood or without one", () => {
    expect(saveEntrySchema.safeParse({ content: "Good day", mood: 4 }).success).toBe(true);
    expect(saveEntrySchema.safeParse({ content: "", mood: null }).success).toBe(true);
  });

  it("rejects moods outside 1 to 5", () => {
    expect(saveEntrySchema.safeParse({ content: "", mood: 0 }).success).toBe(false);
    expect(saveEntrySchema.safeParse({ content: "", mood: 6 }).success).toBe(false);
    expect(saveEntrySchema.safeParse({ content: "", mood: 2.5 }).success).toBe(false);
  });

  it("rejects an entry over the length limit", () => {
    const content = "a".repeat(MAX_ENTRY_LENGTH + 1);
    expect(saveEntrySchema.safeParse({ content, mood: null }).success).toBe(false);
  });
});
