import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  formatLongDate,
  fromDbDate,
  toDateKey,
  toDbDate,
  todayKey,
  weekDays,
  weekStart,
} from "@/lib/dates";

describe("toDateKey", () => {
  it("gives the local day, not the UTC day", () => {
    // 23:30 UTC on the 13th is already the 14th in Auckland and still the 13th in Los Angeles
    const instant = new Date("2026-10-13T23:30:00Z");
    expect(toDateKey(instant, "UTC")).toBe("2026-10-13");
    expect(toDateKey(instant, "Pacific/Auckland")).toBe("2026-10-14");
    expect(toDateKey(instant, "America/Los_Angeles")).toBe("2026-10-13");
  });

  it("rolls over at local midnight (Los Angeles, daylight time)", () => {
    expect(toDateKey(new Date("2026-10-14T06:59:00Z"), "America/Los_Angeles")).toBe("2026-10-13");
    expect(toDateKey(new Date("2026-10-14T07:00:00Z"), "America/Los_Angeles")).toBe("2026-10-14");
  });

  it("rolls over at local midnight (Auckland)", () => {
    expect(toDateKey(new Date("2026-10-13T10:59:00Z"), "Pacific/Auckland")).toBe("2026-10-13");
    expect(toDateKey(new Date("2026-10-13T11:00:00Z"), "Pacific/Auckland")).toBe("2026-10-14");
  });

  it("follows the clock change when daylight time ends (Los Angeles, 1 Nov 2026)", () => {
    expect(toDateKey(new Date("2026-11-02T07:59:00Z"), "America/Los_Angeles")).toBe("2026-11-01");
    expect(toDateKey(new Date("2026-11-02T08:00:00Z"), "America/Los_Angeles")).toBe("2026-11-02");
  });
});

describe("todayKey", () => {
  it("uses the given instant in the user's timezone", () => {
    expect(todayKey("Pacific/Auckland", new Date("2026-10-13T23:30:00Z"))).toBe("2026-10-14");
  });
});

describe("addDays", () => {
  it("adds and subtracts days", () => {
    expect(addDays("2026-10-13", 1)).toBe("2026-10-14");
    expect(addDays("2026-10-13", -13)).toBe("2026-09-30");
  });

  it("crosses month, year and leap-day boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
  });

  it("is not thrown off by daylight saving changes", () => {
    expect(addDays("2026-10-31", 2)).toBe("2026-11-02");
    expect(addDays("2026-03-07", 2)).toBe("2026-03-09");
  });
});

describe("daysBetween", () => {
  it("counts whole days in either direction", () => {
    expect(daysBetween("2026-10-12", "2026-10-19")).toBe(7);
    expect(daysBetween("2026-10-19", "2026-10-12")).toBe(-7);
    expect(daysBetween("2026-10-31", "2026-11-02")).toBe(2);
    expect(daysBetween("2026-10-13", "2026-10-13")).toBe(0);
  });
});

describe("weekStart", () => {
  it("returns the Monday of the week", () => {
    expect(weekStart("2026-10-13")).toBe("2026-10-12"); // Tuesday
    expect(weekStart("2026-10-12")).toBe("2026-10-12"); // Monday
  });

  it("puts Sunday at the end of the week, not the start of the next", () => {
    expect(weekStart("2026-10-18")).toBe("2026-10-12"); // Sunday
    expect(weekStart("2026-10-19")).toBe("2026-10-19"); // next Monday
  });

  it("crosses the year boundary", () => {
    expect(weekStart("2027-01-01")).toBe("2026-12-28");
  });
});

describe("weekDays", () => {
  it("lists Monday to Sunday", () => {
    expect(weekDays("2026-10-15")).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
    ]);
  });
});

describe("formatLongDate", () => {
  it("writes the weekday, month and day", () => {
    expect(formatLongDate("2026-10-13")).toBe("Tuesday, October 13");
    expect(formatLongDate("2027-01-01")).toBe("Friday, January 1");
  });
});

describe("database dates", () => {
  it("round-trips a day through a UTC-midnight Date", () => {
    expect(toDbDate("2026-10-13").toISOString()).toBe("2026-10-13T00:00:00.000Z");
    expect(fromDbDate(toDbDate("2026-10-13"))).toBe("2026-10-13");
  });
});
