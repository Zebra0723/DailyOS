import { describe, it, expect } from "vitest";
import { cn, formatDate, relativeDay, isToday, initials } from "./utils";

/** A bare YYYY-MM-DD date `n` days from today (local). */
function offsetDate(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

describe("utils/cn", () => {
  it("merges and dedupes tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe(
      "text-sm font-bold",
    );
  });
});

describe("utils/formatDate", () => {
  it("renders a bare date on its intended day (no timezone drift)", () => {
    expect(formatDate("2026-07-23")).toBe("23 Jul 2026");
    expect(formatDate("2026-12-31")).toBe("31 Dec 2026");
    expect(formatDate("")).toBe("");
    expect(formatDate("nonsense")).toBe("");
  });
});

describe("utils/relativeDay", () => {
  it("labels relative days correctly", () => {
    expect(relativeDay(offsetDate(0))).toBe("Today");
    expect(relativeDay(offsetDate(1))).toBe("Tomorrow");
    expect(relativeDay(offsetDate(-1))).toBe("Yesterday");
    expect(relativeDay(offsetDate(5))).toBe("In 5 days");
    expect(relativeDay(offsetDate(-5))).toBe("5 days ago");
    expect(relativeDay("")).toBe("");
  });
});

describe("utils/isToday", () => {
  it("recognises today only", () => {
    expect(isToday(new Date().toISOString())).toBe(true);
    expect(isToday(offsetDate(1))).toBe(false);
    expect(isToday(null)).toBe(false);
  });
});

describe("utils/initials", () => {
  it("derives up to two initials", () => {
    expect(initials("leonardo")).toBe("L");
    expect(initials("Arjun Jain")).toBe("AJ");
    expect(initials("ajain1@gmail.com")).toBe("AG");
    expect(initials(null)).toBe("U");
  });
});
