import { describe, expect, it } from "vitest";
import { formatTimeInZone, formatDateTimeInZone, formatTimeWithIsraelReference } from "./dates";

describe("formatTimeInZone", () => {
  it("formats a UTC instant in a different timezone (Bangkok, UTC+7)", () => {
    // 08:00 UTC = 15:00 Bangkok
    expect(formatTimeInZone("2026-08-16T08:00:00.000Z", "Asia/Bangkok")).toBe("15:00");
  });

  it("formats the same instant differently depending on timezone", () => {
    const utc = "2026-08-16T08:00:00.000Z";
    const bangkok = formatTimeInZone(utc, "Asia/Bangkok");
    const jerusalem = formatTimeInZone(utc, "Asia/Jerusalem");
    expect(bangkok).not.toBe(jerusalem);
  });
});

describe("formatDateTimeInZone", () => {
  it("includes both date and time", () => {
    const result = formatDateTimeInZone("2026-08-16T08:00:00.000Z", "Asia/Jerusalem");
    expect(result).toContain("2026");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

describe("formatTimeWithIsraelReference", () => {
  it("shows only one time when the zone is already Israel", () => {
    const result = formatTimeWithIsraelReference("2026-08-16T08:00:00.000Z", "Asia/Jerusalem");
    expect(result).not.toContain("·");
  });

  it("shows both local and Israel reference time for a foreign zone", () => {
    const result = formatTimeWithIsraelReference("2026-08-16T08:00:00.000Z", "Asia/Bangkok");
    expect(result).toContain("שעון מקומי");
    expect(result).toContain("שעון ישראל");
  });
});
