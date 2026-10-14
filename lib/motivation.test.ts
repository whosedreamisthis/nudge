import { describe, expect, it } from "vitest";
import {
  HISTORY_DAYS,
  buildMotivationPrompt,
  hasHistory,
  historyStart,
  mockMotivation,
  motivationSchema,
} from "./motivation";

describe("motivationSchema", () => {
  it("defaults dismissed to false", () => {
    expect(motivationSchema.parse({ message: "Keep going" })).toEqual({
      message: "Keep going",
      dismissed: false,
    });
  });

  it("rejects an empty message", () => {
    expect(motivationSchema.safeParse({ message: "  " }).success).toBe(false);
  });
});

describe("hasHistory", () => {
  it("is false with no habits or nothing done", () => {
    expect(hasHistory([])).toBe(false);
    expect(hasHistory([{ name: "Read", done: 0 }])).toBe(false);
  });

  it("is true once any habit was done", () => {
    expect(hasHistory([{ name: "Read", done: 0 }, { name: "Run", done: 2 }])).toBe(true);
  });
});

describe("historyStart", () => {
  it("is HISTORY_DAYS before today", () => {
    expect(historyStart("2026-10-14")).toBe("2026-09-30");
    expect(HISTORY_DAYS).toBe(14);
  });
});

describe("mockMotivation", () => {
  it("names the most done habit", () => {
    const { message } = mockMotivation([
      { name: "Read", done: 3 },
      { name: "Run", done: 9 },
    ]);
    expect(message).toContain("Run");
    expect(message).toContain("9 times");
  });
});

describe("general motivation", () => {
  it("builds a history-free prompt and mock when nothing was done", () => {
    const prompt = buildMotivationPrompt([{ name: "Read", done: 0 }], "2026-10-14");
    expect(prompt).toContain("no habit history");
    expect(prompt).not.toContain("Read");
    expect(mockMotivation([{ name: "Read", done: 0 }]).message).not.toContain("0 times");
  });
});

describe("buildMotivationPrompt", () => {
  it("lists each habit with its count and the date", () => {
    const prompt = buildMotivationPrompt([{ name: "Read", done: 5 }], "2026-10-14");
    expect(prompt).toContain("2026-10-14");
    expect(prompt).toContain("- Read: done 5 of the last 14 days");
  });
});
