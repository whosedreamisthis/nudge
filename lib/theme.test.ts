import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("app/globals.css", "utf8");

// Pulls `--name: #hex;` pairs out of one rule block
function tokens(selector: string) {
  const start = css.indexOf(`${selector} {`);
  const body = css.slice(start, css.indexOf("\n}", start));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]),
  );
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const light = tokens(":root");
const dark = { ...light, ...tokens(".dark") };

const themes = { light, dark };

describe.each(Object.entries(themes))("%s theme", (_name, t) => {
  // Text pairs: WCAG AA for normal text is 4.5
  it.each([
    ["foreground", "background"],
    ["card-foreground", "card"],
    ["popover-foreground", "popover"],
    ["primary-foreground", "primary"],
    ["secondary-foreground", "secondary"],
    ["accent-foreground", "accent"],
    ["complete-foreground", "complete"],
    ["muted-foreground", "background"],
    ["muted-foreground", "card"],
    ["muted-foreground", "muted"],
    ["foreground", "complete-tint"],
    ["primary", "background"],
    ["primary", "card"],
  ])("%s on %s is readable (4.5:1)", (fg, bg) => {
    expect(contrast(t[fg], t[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
  });

  // Non-text: bars, icon tiles and grid cells need 3:1 against the card they sit on
  it("habit and category colours stand out against the card (3:1)", () => {
    const names = Object.keys(t).filter((n) => n.startsWith("habit-") || n.startsWith("cat-"));
    expect(names).toHaveLength(16);
    for (const name of names) {
      expect(contrast(t[name], t.card), name).toBeGreaterThanOrEqual(3);
    }
  });

  it("tints stay dark enough for text on them to be readable", () => {
    for (const name of Object.keys(t).filter((n) => n.startsWith("tint-"))) {
      expect(contrast(t.foreground, t[name]), name).toBeGreaterThanOrEqual(4.5);
    }
  });
});
