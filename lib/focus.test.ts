import { describe, expect, it } from "vitest";
import {
  effectiveStatus,
  finishTimer,
  focusAmount,
  formatClock,
  getRemainingMs,
  isMinutesUnit,
  parseCustomMinutes,
  parseTimerState,
  pauseTimer,
  resumeTimer,
  startTimer,
} from "@/lib/focus";

const NOW = 1_700_000_000_000;

describe("parseCustomMinutes", () => {
  it("accepts whole minutes from 1 to 180", () => {
    expect(parseCustomMinutes("1")).toBe(1);
    expect(parseCustomMinutes(" 45 ")).toBe(45);
    expect(parseCustomMinutes("180")).toBe(180);
  });

  it("rejects empty, partial and out-of-range input", () => {
    for (const input of ["", "abc", "0", "181", "-5", "2.5", "10m"]) {
      expect(parseCustomMinutes(input)).toBeNull();
    }
  });
});

describe("timer transitions", () => {
  it("starts running with an end time", () => {
    const timer = startTimer(10, NOW);
    expect(timer).toMatchObject({ status: "running", durationMs: 600_000, endsAt: NOW + 600_000 });
    expect(timer.habitId).toBeUndefined();
  });

  it("keeps a linked habit", () => {
    const timer = startTimer(5, NOW, { habitId: "h1", habitName: "Meditate" });
    expect(timer).toMatchObject({ habitId: "h1", habitName: "Meditate" });
  });

  it("keeps the link through pause, resume and finish", () => {
    const linked = startTimer(5, NOW, { habitId: "h1", habitName: "Meditate" });
    expect(resumeTimer(pauseTimer(linked, NOW + 1000), NOW + 2000).habitId).toBe("h1");
    expect(finishTimer(linked)).toMatchObject({ habitId: "h1", habitName: "Meditate" });
  });

  it("pauses with the time left and resumes from it", () => {
    const paused = pauseTimer(startTimer(10, NOW), NOW + 120_000);
    expect(paused).toMatchObject({ status: "paused", endsAt: null, remainingMs: 480_000 });
    const resumed = resumeTimer(paused, NOW + 500_000);
    expect(resumed).toMatchObject({ status: "running", endsAt: NOW + 980_000 });
  });

  it("ignores pause on a timer that is not running and resume on one that is not paused", () => {
    const running = startTimer(5, NOW);
    expect(resumeTimer(running, NOW)).toBe(running);
    const paused = pauseTimer(running, NOW);
    expect(pauseTimer(paused, NOW)).toBe(paused);
  });

  it("never stores a negative remainder when paused after the end", () => {
    expect(pauseTimer(startTimer(1, NOW), NOW + 999_999).remainingMs).toBe(0);
  });
});

describe("effectiveStatus and getRemainingMs", () => {
  it("treats a running timer past its end as finished", () => {
    const timer = startTimer(5, NOW);
    expect(effectiveStatus(timer, NOW + 299_999)).toBe("running");
    expect(effectiveStatus(timer, NOW + 300_000)).toBe("finished");
    expect(effectiveStatus(pauseTimer(timer, NOW), NOW + 9_999_999)).toBe("paused");
  });

  it("counts down, holds when paused and is zero when finished", () => {
    const timer = startTimer(5, NOW);
    expect(getRemainingMs(timer, NOW + 100_000)).toBe(200_000);
    expect(getRemainingMs(timer, NOW + 999_999)).toBe(0);
    expect(getRemainingMs(pauseTimer(timer, NOW + 60_000), NOW + 900_000)).toBe(240_000);
    expect(getRemainingMs(finishTimer(timer), NOW)).toBe(0);
  });
});

describe("formatClock", () => {
  it("formats minutes and seconds", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(247_000)).toBe("04:07");
    expect(formatClock(-5)).toBe("00:00");
  });

  it("rounds up so it never shows 00:00 early", () => {
    expect(formatClock(100)).toBe("00:01");
    expect(formatClock(59_001)).toBe("01:00");
  });

  it("adds hours from one hour up", () => {
    expect(formatClock(3_723_000)).toBe("1:02:03");
  });
});

describe("parseTimerState", () => {
  it("round-trips a stored timer", () => {
    const timer = startTimer(20, NOW, { habitId: "h1", habitName: "Meditate" });
    expect(parseTimerState(JSON.stringify(timer))).toEqual(timer);
  });

  it("treats missing or bad data as no timer", () => {
    expect(parseTimerState(null)).toBeNull();
    expect(parseTimerState("")).toBeNull();
    expect(parseTimerState("not json")).toBeNull();
    expect(parseTimerState(JSON.stringify({ status: "running" }))).toBeNull();
    expect(parseTimerState(JSON.stringify({ ...startTimer(5, NOW), status: "weird" }))).toBeNull();
  });
});

describe("isMinutesUnit", () => {
  it("recognises minute units in any case", () => {
    for (const unit of ["min", "mins", "Minutes", " minute "]) expect(isMinutesUnit(unit)).toBe(true);
  });

  it("rejects other units and none", () => {
    for (const unit of ["ml", "times", "minutes per day", ""]) expect(isMinutesUnit(unit)).toBe(false);
    expect(isMinutesUnit(null)).toBe(false);
  });
});

describe("focusAmount", () => {
  it("marks a simple habit done and never clears it", () => {
    expect(focusAmount(0, { dailyGoal: null, unit: null }, 20)).toBe(1);
    expect(focusAmount(1, { dailyGoal: null, unit: null }, 20)).toBe(1);
  });

  it("adds the session minutes to a minutes goal, even past the goal", () => {
    const habit = { dailyGoal: 30, unit: "min" };
    expect(focusAmount(0, habit, 20)).toBe(20);
    expect(focusAmount(20, habit, 20)).toBe(40);
  });

  it("fills a goal in any other unit", () => {
    const habit = { dailyGoal: 8, unit: "glasses" };
    expect(focusAmount(0, habit, 20)).toBe(8);
    expect(focusAmount(3, habit, 20)).toBe(8);
    expect(focusAmount(10, habit, 20)).toBe(10);
  });
});
