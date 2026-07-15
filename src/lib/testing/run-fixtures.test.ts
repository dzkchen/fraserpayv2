import { describe, expect, test } from "vitest";
import {
  RUN_ID,
  TEST_SENTINEL,
  isTestRecord,
  testEmail,
  testStudentNumber,
  testTag,
} from "@/lib/testing/run-fixtures";

describe("run-fixtures", () => {
  test("RUN_ID is a non-empty base36 value for the run", () => {
    expect(RUN_ID).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    // Reused for the lifetime of the run: two tags built from it share it.
    expect(testTag("a").split("-")).toContain(RUN_ID.split("-")[0]);
  });

  test("testTag is sentinel-tagged, run-unique, and label-scoped", () => {
    const tag = testTag("booth");
    expect(tag.startsWith(`${TEST_SENTINEL}-${RUN_ID}-`)).toBe(true);
    expect(tag).toContain("booth");
    // Distinct labels never collide.
    expect(testTag("buyer")).not.toBe(testTag("seller"));
  });

  test("testTag slugifies unsafe labels and never yields an empty fragment", () => {
    expect(testTag("Booth #1!")).toContain("booth-1");
    expect(testTag("   ")).toMatch(new RegExp(`${TEST_SENTINEL}-.*-x$`));
  });

  test("testEmail is fake, run-unique, lowercased, and pdsb-shaped by default", () => {
    const email = testEmail("Student");
    expect(email).toMatch(/@pdsb\.net$/);
    expect(email).toBe(email.toLowerCase());
    expect(isTestRecord(email)).toBe(true);
    expect(testEmail("a", "example.test")).toMatch(/@example\.test$/);
  });

  test("testStudentNumber is 12 all-digit, out-of-range, and deterministic per label", () => {
    const n = testStudentNumber("buyer");
    expect(n).toMatch(/^9999\d{8}$/);
    expect(n).toBe(testStudentNumber("buyer")); // deterministic within a run
    expect(testStudentNumber("buyer")).not.toBe(testStudentNumber("seller"));
  });

  test("isTestRecord accepts sentinel-tagged values and rejects real-looking ones", () => {
    expect(isTestRecord(testTag("x"))).toBe(true);
    expect(isTestRecord(TEST_SENTINEL.toLowerCase() + "-abc")).toBe(true);
    expect(isTestRecord("Jane Doe")).toBe(false);
    expect(isTestRecord("123456@pdsb.net")).toBe(false);
    expect(isTestRecord(null)).toBe(false);
    expect(isTestRecord(undefined)).toBe(false);
    expect(isTestRecord("")).toBe(false);
  });
});
