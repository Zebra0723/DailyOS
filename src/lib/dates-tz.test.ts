import { describe, it, expect } from "vitest";
import { ymdInTz, addDaysYmd, addMonthsYmd } from "./dates-tz";

describe("ymdInTz — the user's local calendar day", () => {
  // 02:00 UTC on 5 Jul is still the evening of 4 Jul in New York.
  const instant = new Date("2026-07-05T02:00:00Z");

  it("gives the right day per timezone", () => {
    expect(ymdInTz(instant, "UTC")).toBe("2026-07-05");
    expect(ymdInTz(instant, "America/New_York")).toBe("2026-07-04");
    expect(ymdInTz(instant, "Asia/Tokyo")).toBe("2026-07-05"); // 11:00 JST
  });

  it("falls back to UTC for a bogus timezone instead of throwing", () => {
    expect(ymdInTz(instant, "Not/AZone")).toBe("2026-07-05");
  });
});

describe("addDaysYmd — day math across boundaries", () => {
  it("rolls over months and years", () => {
    expect(addDaysYmd("2026-07-05", 1)).toBe("2026-07-06");
    expect(addDaysYmd("2024-12-31", 1)).toBe("2025-01-01");
    expect(addDaysYmd("2026-07-05", 7)).toBe("2026-07-12");
  });

  it("knows February's length in leap and non-leap years", () => {
    expect(addDaysYmd("2024-02-28", 1)).toBe("2024-02-29"); // 2024 is a leap year
    expect(addDaysYmd("2023-02-28", 1)).toBe("2023-03-01"); // 2023 is not
  });
});

describe("addMonthsYmd — clamps to real month lengths", () => {
  it("does not spill Jan 31 into March", () => {
    expect(addMonthsYmd("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsYmd("2024-01-31", 1)).toBe("2024-02-29"); // leap year
    expect(addMonthsYmd("2026-03-31", 1)).toBe("2026-04-30");
  });

  it("keeps the day when the month is long enough, and rolls the year", () => {
    expect(addMonthsYmd("2026-07-15", 1)).toBe("2026-08-15");
    expect(addMonthsYmd("2026-12-15", 1)).toBe("2027-01-15");
  });
});
