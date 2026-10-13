import { describe, expect, it } from "vitest";
import { frequencyLabel, parseCatalogParams } from "./catalog";

describe("parseCatalogParams", () => {
  it("reads and trims the search and category", () => {
    expect(parseCatalogParams({ q: "  water ", category: "health" })).toEqual({
      q: "water",
      category: "health",
    });
  });

  it("falls back to empty strings when the params are missing", () => {
    expect(parseCatalogParams({})).toEqual({ q: "", category: "" });
  });

  it("takes the first value of a repeated param", () => {
    expect(parseCatalogParams({ q: ["a", "b"], category: ["sleep", "social"] })).toEqual({
      q: "a",
      category: "sleep",
    });
  });

  it("caps the search length", () => {
    expect(parseCatalogParams({ q: "x".repeat(100) }).q).toHaveLength(60);
  });
});

describe("frequencyLabel", () => {
  it("calls a daily or seven-day habit Daily", () => {
    expect(frequencyLabel("DAILY", 7)).toBe("Daily");
    expect(frequencyLabel("WEEKLY", 7)).toBe("Daily");
  });

  it("shows the days per week for a weekly habit", () => {
    expect(frequencyLabel("WEEKLY", 3)).toBe("3x / week");
  });
});
