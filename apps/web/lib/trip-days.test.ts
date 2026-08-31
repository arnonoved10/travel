import { describe, expect, it } from "vitest";
import { getTripDayDates } from "./trip-days";

describe("getTripDayDates", () => {
  it("returns a single date for a one-day trip", () => {
    expect(getTripDayDates("2026-06-01", "2026-06-01")).toEqual(["2026-06-01"]);
  });

  it("returns every date inclusive of both ends", () => {
    expect(getTripDayDates("2026-06-01", "2026-06-04")).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
    ]);
  });

  it("crosses a month boundary correctly", () => {
    const days = getTripDayDates("2026-01-30", "2026-02-02");
    expect(days).toEqual(["2026-01-30", "2026-01-31", "2026-02-01", "2026-02-02"]);
  });

  it("handles the leap day in 2028 correctly", () => {
    const days = getTripDayDates("2028-02-27", "2028-03-01");
    expect(days).toEqual(["2028-02-27", "2028-02-28", "2028-02-29", "2028-03-01"]);
  });

  it("returns an empty list when end date is before start date", () => {
    expect(getTripDayDates("2026-06-10", "2026-06-01")).toEqual([]);
  });
});
