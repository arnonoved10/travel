import { describe, expect, it } from "vitest";
import { getTipOfTheDay } from "./travel-tips";

describe("getTipOfTheDay", () => {
  it("is deterministic for the same date", () => {
    const date = new Date("2026-08-16T12:00:00Z");
    expect(getTipOfTheDay(date)).toBe(getTipOfTheDay(date));
  });

  it("returns a non-empty string", () => {
    expect(getTipOfTheDay(new Date("2026-01-01T00:00:00Z")).length).toBeGreaterThan(0);
  });

  it("can return a different tip on a different day", () => {
    const tip1 = getTipOfTheDay(new Date("2026-01-01T00:00:00Z"));
    const tip2 = getTipOfTheDay(new Date("2026-01-02T00:00:00Z"));
    // Not guaranteed to differ forever (list could be shorter than the gap), but for
    // adjacent days with a 10-item list this should hold.
    expect(tip1).not.toBe(tip2);
  });
});
