import { describe, expect, it } from "vitest";
import { formatTime } from "./time-format";

describe("formatTime", () => {
  it("formats in 24-hour format without an AM/PM marker", () => {
    const result = formatTime("2026-01-01T14:30:00.000Z", "24h", "UTC");
    expect(result).toContain("14:30");
    expect(result).not.toMatch(/AM|PM/i);
  });

  it("formats in 12-hour format with an AM/PM marker", () => {
    const result = formatTime("2026-01-01T14:30:00.000Z", "12h", "UTC");
    expect(result).toMatch(/PM/i);
  });

  it("respects the given time zone", () => {
    const utc = formatTime("2026-01-01T14:30:00.000Z", "24h", "UTC");
    const bangkok = formatTime("2026-01-01T14:30:00.000Z", "24h", "Asia/Bangkok");
    expect(utc).not.toBe(bangkok);
  });
});
