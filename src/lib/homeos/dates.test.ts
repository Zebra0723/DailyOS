import { describe, it, expect } from "vitest";
import {
  daysUntil,
  isToday,
  isTomorrow,
  isOverdue,
  isWithinDays,
  formatDate,
  relativeLabel,
  addDays,
  fromNow,
} from "./dates";

describe("homeos/dates", () => {
  it("daysUntil counts whole days, negative in the past", () => {
    expect(daysUntil(fromNow(0))).toBe(0);
    expect(daysUntil(fromNow(5))).toBe(5);
    expect(daysUntil(fromNow(-3))).toBe(-3);
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil("not a date")).toBeNull();
  });

  it("isToday / isTomorrow", () => {
    expect(isToday(fromNow(0))).toBe(true);
    expect(isToday(fromNow(1))).toBe(false);
    expect(isTomorrow(fromNow(1))).toBe(true);
    expect(isTomorrow(fromNow(0))).toBe(false);
  });

  it("isOverdue is true only strictly before today", () => {
    expect(isOverdue(fromNow(-1))).toBe(true);
    expect(isOverdue(fromNow(0))).toBe(false);
    expect(isOverdue(fromNow(1))).toBe(false);
    expect(isOverdue(null)).toBe(false);
  });

  it("isWithinDays is inclusive and rejects past dates", () => {
    expect(isWithinDays(fromNow(0), 7)).toBe(true);
    expect(isWithinDays(fromNow(7), 7)).toBe(true);
    expect(isWithinDays(fromNow(8), 7)).toBe(false);
    expect(isWithinDays(fromNow(-1), 7)).toBe(false);
  });

  it("relativeLabel produces friendly text", () => {
    expect(relativeLabel(fromNow(0))).toBe("Today");
    expect(relativeLabel(fromNow(1))).toBe("Tomorrow");
    expect(relativeLabel(fromNow(-1))).toBe("Yesterday");
    expect(relativeLabel(fromNow(4))).toBe("in 4 days");
    expect(relativeLabel(fromNow(-4))).toBe("4 days ago");
    expect(relativeLabel(null)).toBe("—");
  });

  it("formatDate renders a bare date on its intended calendar day", () => {
    // Regression: bare YYYY-MM-DD must not drift to the previous day.
    expect(formatDate("2026-07-23")).toBe("23 Jul 2026");
    expect(formatDate("2026-01-01")).toBe("1 Jan 2026");
    expect(formatDate(null)).toBe("—");
  });

  it("addDays advances the date", () => {
    expect(addDays("2026-01-01T00:00:00", 10)?.slice(0, 10)).toBe("2026-01-11");
    expect(addDays(null, 5)).toBeNull();
  });

  it("fromNow round-trips through daysUntil", () => {
    for (const n of [0, 1, 7, 20, 100, -5]) {
      expect(daysUntil(fromNow(n))).toBe(n);
    }
  });
});
