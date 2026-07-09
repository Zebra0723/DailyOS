import { describe, it, expect } from "vitest";
import {
  sessionMaxAgeSeconds,
  deadlineFromNow,
  isSessionExpired,
  REMEMBER_DAYS,
  SESSION_DAYS,
} from "./session-expiry";

const DAY_MS = 86_400_000;
const now = Date.parse("2026-07-05T12:00:00Z");

describe("session expiry windows", () => {
  it("remember-me is 1 year, default is 30 days", () => {
    expect(REMEMBER_DAYS).toBe(365);
    expect(SESSION_DAYS).toBe(30);
    expect(sessionMaxAgeSeconds(true)).toBe(365 * 24 * 60 * 60);
    expect(sessionMaxAgeSeconds(false)).toBe(30 * 24 * 60 * 60);
  });

  it("deadlineFromNow adds the right window", () => {
    expect(deadlineFromNow(true, now)).toBe(now + 365 * DAY_MS);
    expect(deadlineFromNow(false, now)).toBe(now + 30 * DAY_MS);
  });

  it("a missing cookie counts as expired (pre-feature sessions re-auth once)", () => {
    expect(isSessionExpired(undefined, now)).toBe(true);
    expect(isSessionExpired("", now)).toBe(true);
  });

  it("a future deadline is live; a past one is expired", () => {
    expect(isSessionExpired(String(now + DAY_MS), now)).toBe(false);
    expect(isSessionExpired(String(now - DAY_MS), now)).toBe(true);
  });

  it("garbage cookie values are treated as expired", () => {
    expect(isSessionExpired("not-a-number", now)).toBe(true);
  });

  it("round-trips: a stamped deadline is still live immediately after", () => {
    const d = deadlineFromNow(false, now);
    expect(isSessionExpired(String(d), now)).toBe(false);
    // ...and expired one tick after it lapses.
    expect(isSessionExpired(String(d), d + 1)).toBe(true);
  });
});
