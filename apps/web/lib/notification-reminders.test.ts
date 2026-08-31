import { describe, expect, it } from "vitest";
import { dueReminders, type ReminderCandidate } from "./notification-reminders";

const flight: ReminderCandidate = {
  id: "flight-1",
  title: "טיסה מתקרבת",
  body: "TLV → BKK",
  eventAt: "2026-12-01T04:30:00.000Z",
  leadTimeMinutes: 120,
};

describe("dueReminders", () => {
  it("is not due more than leadTimeMinutes before the event", () => {
    const now = new Date("2026-12-01T02:00:00.000Z"); // 2.5h before
    expect(dueReminders([flight], now, new Set())).toEqual([]);
  });

  it("is due once the lead-time window opens", () => {
    const now = new Date("2026-12-01T03:00:00.000Z"); // 1.5h before, within 2h lead time
    expect(dueReminders([flight], now, new Set())).toEqual([flight]);
  });

  it("is not due after the event itself has passed", () => {
    const now = new Date("2026-12-01T05:00:00.000Z"); // after departure
    expect(dueReminders([flight], now, new Set())).toEqual([]);
  });

  it("does not re-fire a reminder already marked as fired", () => {
    const now = new Date("2026-12-01T03:00:00.000Z");
    expect(dueReminders([flight], now, new Set(["flight-1"]))).toEqual([]);
  });
});
