import { describe, it, expect } from "vitest";
import {
  schedulable,
  fireDelayMs,
  eventTimeLabel,
  reminderBody,
  reminderKey,
  LOCAL_WINDOW_MS,
  MAX_TIMEOUT_MS,
  type UpcomingReminder,
} from "./reminders-local";

const NOW = Date.parse("2026-07-09T12:00:00.000Z");

function rem(partial: Partial<UpcomingReminder>): UpcomingReminder {
  return {
    id: "e1",
    title: "Dentist",
    remind_at: new Date(NOW).toISOString(),
    start_time: "2026-07-09T12:30:00",
    ...partial,
  };
}

describe("schedulable", () => {
  it("keeps reminders due within the window", () => {
    const items = [
      rem({ id: "soon", remind_at: new Date(NOW + 5 * 60_000).toISOString() }),
      rem({ id: "hour", remind_at: new Date(NOW + 60 * 60_000).toISOString() }),
    ];
    expect(schedulable(items, NOW).map((r) => r.id)).toEqual(["soon", "hour"]);
  });

  it("keeps a just-passed reminder within the grace period", () => {
    const items = [rem({ id: "justnow", remind_at: new Date(NOW - 30_000).toISOString() })];
    expect(schedulable(items, NOW)).toHaveLength(1);
  });

  it("drops reminders long past the grace period", () => {
    const items = [rem({ id: "old", remind_at: new Date(NOW - 10 * 60_000).toISOString() })];
    expect(schedulable(items, NOW)).toHaveLength(0);
  });

  it("drops reminders beyond the look-ahead window", () => {
    const items = [
      rem({ id: "far", remind_at: new Date(NOW + LOCAL_WINDOW_MS + 60_000).toISOString() }),
    ];
    expect(schedulable(items, NOW)).toHaveLength(0);
  });

  it("ignores rows with an unparseable remind_at", () => {
    const items = [rem({ id: "bad", remind_at: "not-a-date" })];
    expect(schedulable(items, NOW)).toHaveLength(0);
  });
});

describe("fireDelayMs", () => {
  it("returns the ms until the reminder for a future time", () => {
    expect(fireDelayMs(new Date(NOW + 5 * 60_000).toISOString(), NOW)).toBe(5 * 60_000);
  });

  it("clamps a past reminder to 0 (fire immediately)", () => {
    expect(fireDelayMs(new Date(NOW - 5 * 60_000).toISOString(), NOW)).toBe(0);
  });

  it("clamps very distant reminders to the setTimeout ceiling", () => {
    const yearOut = new Date(NOW + 400 * 24 * 60 * 60_000).toISOString();
    expect(fireDelayMs(yearOut, NOW)).toBe(MAX_TIMEOUT_MS);
  });
});

describe("eventTimeLabel / reminderBody", () => {
  it("extracts the wall-clock HH:MM", () => {
    expect(eventTimeLabel("2026-07-09T14:30:00")).toBe("14:30");
  });

  it("returns empty for a missing or short start time", () => {
    expect(eventTimeLabel(null)).toBe("");
    expect(eventTimeLabel("2026-07-09")).toBe("");
  });

  it("appends the time to the body when present, omits it otherwise", () => {
    expect(reminderBody("Dentist", "2026-07-09T14:30:00")).toBe("Dentist — 14:30");
    expect(reminderBody("Dentist", null)).toBe("Dentist");
  });
});

describe("reminderKey", () => {
  it("is stable for the same id + instant and changes when the time changes", () => {
    const a = reminderKey("e1", "2026-07-09T12:30:00.000Z");
    const b = reminderKey("e1", "2026-07-09T12:30:00.000Z");
    const c = reminderKey("e1", "2026-07-09T13:00:00.000Z");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
