import { describe, expect, it } from "vitest";
import { isAdminUser } from "@/lib/admin-user";

describe("isAdminUser", () => {
  it("accepts only the server-controlled app metadata flag", () => {
    expect(isAdminUser({ app_metadata: { admin: true } })).toBe(true);
    expect(isAdminUser({ app_metadata: { admin: false } })).toBe(false);
  });

  it("does not treat missing or malformed metadata as admin", () => {
    expect(isAdminUser(undefined)).toBe(false);
    expect(isAdminUser({ app_metadata: "admin" })).toBe(false);
    expect(isAdminUser({ app_metadata: { admin: "true" } })).toBe(false);
  });
});
