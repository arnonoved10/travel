import { describe, expect, it } from "vitest";
import { isOpenNow } from "./opening-hours";
import type { OpeningHours } from "@travel-app/shared-types";

const CLOSED: OpeningHours = { sun: null, mon: null, tue: null, wed: null, thu: null, fri: null, sat: null };

function withDay(day: keyof OpeningHours, open: string, close: string): OpeningHours {
  return { ...CLOSED, [day]: { open, close } };
}

describe("isOpenNow", () => {
  it("returns null when there is no opening-hours data at all", () => {
    expect(isOpenNow(null, new Date("2026-08-16T10:00:00"))).toBeNull();
  });

  it("returns true when now falls within today's hours", () => {
    // 2026-08-16 is a Sunday.
    const hours = withDay("sun", "09:00", "18:00");
    expect(isOpenNow(hours, new Date("2026-08-16T12:00:00"))).toBe(true);
  });

  it("returns false when now falls outside today's hours", () => {
    const hours = withDay("sun", "09:00", "18:00");
    expect(isOpenNow(hours, new Date("2026-08-16T20:00:00"))).toBe(false);
  });

  it("returns false when today is explicitly marked closed", () => {
    expect(isOpenNow(CLOSED, new Date("2026-08-16T12:00:00"))).toBe(false);
  });

  it("handles overnight hours that cross midnight", () => {
    // Saturday 22:00 -> Sunday 02:00.
    const hours = withDay("sat", "22:00", "02:00");
    expect(isOpenNow(hours, new Date("2026-08-15T23:00:00"))).toBe(true); // Saturday night
    expect(isOpenNow(hours, new Date("2026-08-16T01:00:00"))).toBe(true); // early Sunday, still open
    expect(isOpenNow(hours, new Date("2026-08-16T03:00:00"))).toBe(false); // Sunday, after closing
  });
});
