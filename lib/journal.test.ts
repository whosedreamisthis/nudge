import { describe, expect, it } from "vitest";
import {
  HISTORY_PAGE_SIZE,
  MAX_ENTRY_LENGTH,
  formatShortDate,
  groupByMonth,
  isDateKey,
  monthLabel,
  monthRange,
  parseHistoryParams,
  previewText,
  saveEntrySchema,
} from "@/lib/journal";

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

  it("accepts a real date and rejects a bad one", () => {
    expect(saveEntrySchema.safeParse({ content: "", mood: null, date: "2026-02-28" }).success).toBe(
      true,
    );
    expect(saveEntrySchema.safeParse({ content: "", mood: null, date: "2026-02-30" }).success).toBe(
      false,
    );
  });
});

describe("isDateKey", () => {
  it("accepts real calendar days", () => {
    expect(isDateKey("2026-10-13")).toBe(true);
    expect(isDateKey("2028-02-29")).toBe(true);
  });

  it("rejects malformed and impossible days", () => {
    expect(isDateKey("2026-13-01")).toBe(false);
    expect(isDateKey("2027-02-29")).toBe(false);
    expect(isDateKey("2026-1-1")).toBe(false);
    expect(isDateKey("tomorrow")).toBe(false);
  });
});

describe("parseHistoryParams", () => {
  it("falls back to no filters", () => {
    expect(parseHistoryParams({})).toEqual({
      q: "",
      month: "",
      mood: null,
      limit: HISTORY_PAGE_SIZE,
    });
  });

  it("reads valid params", () => {
    expect(
      parseHistoryParams({ q: " rain ", month: "2026-10", mood: "4", limit: "90" }),
    ).toEqual({ q: "rain", month: "2026-10", mood: 4, limit: 90 });
  });

  it("ignores malformed params", () => {
    const parsed = parseHistoryParams({ month: "2026-13", mood: "9", limit: "-5" });
    expect(parsed.month).toBe("");
    expect(parsed.mood).toBeNull();
    expect(parsed.limit).toBe(HISTORY_PAGE_SIZE);
  });

  it("uses the first of a repeated param and caps the limit", () => {
    const parsed = parseHistoryParams({ q: ["a", "b"], limit: "99999" });
    expect(parsed.q).toBe("a");
    expect(parsed.limit).toBe(1000);
  });
});

describe("months and dates", () => {
  it("gives a month's range up to the next month", () => {
    expect(monthRange("2026-10")).toEqual({ from: "2026-10-01", to: "2026-11-01" });
    expect(monthRange("2026-12")).toEqual({ from: "2026-12-01", to: "2027-01-01" });
  });

  it("labels months and days", () => {
    expect(monthLabel("2026-10")).toBe("October 2026");
    expect(formatShortDate("2026-10-13")).toBe("Tue, Oct 13");
  });
});

describe("previewText", () => {
  it("collapses whitespace", () => {
    expect(previewText("  one\n\ntwo   three ")).toBe("one two three");
  });

  it("shortens long text with an ellipsis", () => {
    const preview = previewText("word ".repeat(100));
    expect(preview.endsWith("…")).toBe(true);
    expect(preview.length).toBeLessThanOrEqual(141);
  });

  it("returns empty text as empty", () => {
    expect(previewText("  \n ")).toBe("");
  });
});

describe("groupByMonth", () => {
  it("groups newest-first entries into one run per month", () => {
    const groups = groupByMonth([
      { date: "2026-10-13" },
      { date: "2026-10-02" },
      { date: "2026-09-30" },
    ]);

    expect(groups.map((g) => [g.month, g.label, g.entries.length])).toEqual([
      ["2026-10", "October 2026", 2],
      ["2026-09", "September 2026", 1],
    ]);
  });

  it("returns nothing for no entries", () => {
    expect(groupByMonth([])).toEqual([]);
  });
});
