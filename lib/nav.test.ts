import { describe, expect, it } from "vitest";
import { isActivePath } from "@/lib/nav";

describe("isActivePath", () => {
  it("matches the exact route", () => {
    expect(isActivePath("/today", "/today")).toBe(true);
  });

  it("matches nested routes", () => {
    expect(isActivePath("/habits/archived", "/habits")).toBe(true);
  });

  it("does not match a route that only shares a prefix", () => {
    expect(isActivePath("/habits-old", "/habits")).toBe(false);
  });

  it("does not match other routes", () => {
    expect(isActivePath("/progress", "/today")).toBe(false);
  });
});
