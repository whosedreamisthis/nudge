import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateTag } = vi.hoisted(() => ({ updateTag: vi.fn() }));
vi.mock("next/cache", () => ({ updateTag, cacheLife: vi.fn(), cacheTag: vi.fn() }));

import { expireCompletions, expireHabitData, expireJournal } from "./cache-tags";

describe("expire helpers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("expire habit data touches habits and completions of that user only", () => {
    expireHabitData("u1");
    expect(updateTag.mock.calls.map(([tag]) => tag).sort()).toEqual([
      "user:u1:completions",
      "user:u1:habits",
    ]);
  });

  it("expires one kind of data at a time", () => {
    expireCompletions("u1");
    expireJournal("u1");
    expect(updateTag.mock.calls.map(([tag]) => tag)).toEqual(["user:u1:completions", "user:u1:journal"]);
  });
});

describe("cached data functions", () => {
  const dir = join(__dirname, "db");
  const files = readdirSync(dir).filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"));
  const cached = files
    .map((name) => ({ name, source: readFileSync(join(dir, name), "utf8") }))
    .filter(({ source }) => source.includes('"use cache"'));

  it("exist", () => {
    expect(cached.length).toBeGreaterThan(0);
  });

  it.each(cached.map(({ name, source }) => [name, source]))(
    "%s reads no runtime API and sets a lifetime and a tag",
    (_name, source) => {
      expect(source).not.toMatch(/next\/headers|@\/lib\/session|@clerk\/|getSessionUser|cookies\(/);
      expect(source).toContain("cacheLife(");
      expect(source).toContain("cacheTag(");
    },
  );
});
