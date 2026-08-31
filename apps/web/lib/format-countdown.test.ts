import { describe, expect, it } from "vitest";
import { daysUntil, formatCountdown, formatDaysRemaining } from "./format-countdown";

describe("formatCountdown", () => {
  it("returns 'עבר' for a past or exactly-now event", () => {
    expect(formatCountdown(0)).toBe("עבר");
    expect(formatCountdown(-1000)).toBe("עבר");
  });

  it("formats minutes only", () => {
    expect(formatCountdown(25 * 60_000)).toBe("בעוד 25 דקות");
  });

  it("formats hours and minutes", () => {
    expect(formatCountdown((2 * 60 + 15) * 60_000)).toBe("בעוד 2 שעות ו-15 דקות");
  });

  it("formats days, hours and minutes", () => {
    expect(formatCountdown((26 * 60 + 5) * 60_000)).toBe("בעוד 1 יום ו-2 שעות ו-5 דקות");
  });

  it("omits zero minutes when hours/days present", () => {
    expect(formatCountdown(3 * 60 * 60_000)).toBe("בעוד 3 שעות");
  });
});

describe("daysUntil", () => {
  it("computes calendar-day difference, ignoring time-of-day", () => {
    const today = new Date("2026-08-17T23:00:00.000Z");
    expect(daysUntil("2026-08-17", today)).toBe(0);
    expect(daysUntil("2026-08-20", today)).toBe(3);
    expect(daysUntil("2026-08-15", today)).toBe(-2);
  });
});

describe("formatDaysRemaining", () => {
  it("handles finished, today, tomorrow and future", () => {
    expect(formatDaysRemaining(-1)).toBe("הסתיים");
    expect(formatDaysRemaining(0)).toBe("מסתיים היום");
    expect(formatDaysRemaining(1)).toBe("נשאר יום אחד");
    expect(formatDaysRemaining(5)).toBe("נשארו 5 ימים");
  });
});
