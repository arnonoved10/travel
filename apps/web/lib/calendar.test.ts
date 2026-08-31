import { describe, expect, it } from "vitest";
import { buildCalendarEvents, buildMonthGridDates, groupCalendarEventsByDate } from "./calendar";

describe("buildCalendarEvents", () => {
  it("creates separate check-in and check-out events for a hotel stay", () => {
    const events = buildCalendarEvents({
      hotelStays: [{ id: "h1", hotelName: "מלון בדוגמה", checkInDate: "2026-06-01", checkOutDate: "2026-06-05" }],
      flights: [],
      transportBookings: [],
      plannedActivities: [],
    });

    expect(events).toHaveLength(2);
    expect(events.find((e) => e.type === "hotel_checkin")?.date).toBe("2026-06-01");
    expect(events.find((e) => e.type === "hotel_checkout")?.date).toBe("2026-06-05");
  });

  it("dates a flight event by its departure date", () => {
    const events = buildCalendarEvents({
      hotelStays: [],
      flights: [{ id: "f1", airline: "El Al", flightNumber: "LY001", departureAt: "2026-06-01T10:00:00.000Z" }],
      transportBookings: [],
      plannedActivities: [],
    });

    expect(events[0]?.date).toBe("2026-06-01");
    expect(events[0]?.label).toContain("LY001");
  });

  it("skips a planned activity with no plannedAt date", () => {
    const events = buildCalendarEvents({
      hotelStays: [],
      flights: [],
      transportBookings: [],
      plannedActivities: [{ id: "a1", name: "בלי תאריך", plannedAt: null }],
    });

    expect(events).toHaveLength(0);
  });

  it("includes a planned activity that has a plannedAt date", () => {
    const events = buildCalendarEvents({
      hotelStays: [],
      flights: [],
      transportBookings: [],
      plannedActivities: [{ id: "a1", name: "עם תאריך", plannedAt: "2026-06-03T09:00:00.000Z" }],
    });

    expect(events[0]?.date).toBe("2026-06-03");
  });
});

describe("groupCalendarEventsByDate", () => {
  it("groups multiple events on the same date together", () => {
    const grouped = groupCalendarEventsByDate([
      { id: "1", date: "2026-06-01", type: "flight", label: "a" },
      { id: "2", date: "2026-06-01", type: "hotel_checkin", label: "b" },
      { id: "3", date: "2026-06-02", type: "transport", label: "c" },
    ]);

    expect(grouped.get("2026-06-01")).toHaveLength(2);
    expect(grouped.get("2026-06-02")).toHaveLength(1);
  });
});

describe("buildMonthGridDates", () => {
  it("returns a whole number of weeks (multiple of 7)", () => {
    const dates = buildMonthGridDates(2026, 6);
    expect(dates.length % 7).toBe(0);
  });

  it("includes the first and last day of the month", () => {
    const dates = buildMonthGridDates(2026, 6);
    expect(dates).toContain("2026-06-01");
    expect(dates).toContain("2026-06-30");
  });

  it("pads before the 1st to start the grid on a Sunday", () => {
    // 2026-06-01 is a Monday, so the grid should start on 2026-05-31 (Sunday)
    const dates = buildMonthGridDates(2026, 6);
    expect(dates[0]).toBe("2026-05-31");
  });

  it("handles a month that starts on Sunday with no leading padding", () => {
    // 2026-11-01 is a Sunday
    const dates = buildMonthGridDates(2026, 11);
    expect(dates[0]).toBe("2026-11-01");
  });
});
