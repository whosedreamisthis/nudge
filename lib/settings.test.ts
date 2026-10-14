import { describe, expect, it } from "vitest";
import { DELETE_PHRASE, isDeleteConfirmed, isValidTimezone, timezoneOptions } from "./settings";

describe("isValidTimezone", () => {
  it("accepts IANA names", () => {
    expect(isValidTimezone("Europe/London")).toBe(true);
    expect(isValidTimezone("UTC")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isValidTimezone("Mars/Olympus")).toBe(false);
    expect(isValidTimezone("")).toBe(false);
  });
});

describe("timezoneOptions", () => {
  it("lists the browser's timezones", () => {
    expect(timezoneOptions("Europe/London")).toContain("America/New_York");
  });

  it("keeps a stored timezone the browser does not list", () => {
    expect(timezoneOptions("Old/Zone")[0]).toBe("Old/Zone");
  });
});

describe("isDeleteConfirmed", () => {
  it("needs the phrase, ignoring case and outer spaces", () => {
    expect(isDeleteConfirmed(DELETE_PHRASE)).toBe(true);
    expect(isDeleteConfirmed("  Delete My Account ")).toBe(true);
  });

  it("rejects a partial or different phrase", () => {
    expect(isDeleteConfirmed("delete")).toBe(false);
    expect(isDeleteConfirmed("")).toBe(false);
  });
});
