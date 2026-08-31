export type CalendarEventType = "hotel_checkin" | "hotel_checkout" | "flight" | "transport" | "planned_activity";

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: CalendarEventType;
  label: string;
}

/**
 * ממיר את ההזמנות/תכנון של הטיול לרשימת אירועים שטוחה לפי תאריך, לצורך
 * תצוגת לוח שנה. לכל מלון 2 אירועים (צ'ק-אין+צ'ק-אאוט); טיסה/הסעה לפי
 * תאריך היציאה בלבד (כמו סיכום היום ב-days/[date] — לא מפצל ליום הנחיתה
 * אם הוא שונה, כדי להישאר עקבי עם שאר האפליקציה).
 */
export function buildCalendarEvents(params: {
  hotelStays: { id: string; hotelName: string; checkInDate: string; checkOutDate: string }[];
  flights: { id: string; airline: string; flightNumber: string | null; departureAt: string }[];
  transportBookings: { id: string; mode: string; pickupAt: string }[];
  plannedActivities: { id: string; name: string; plannedAt: string | null }[];
}): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const hotel of params.hotelStays) {
    events.push({ id: `${hotel.id}-checkin`, date: hotel.checkInDate, type: "hotel_checkin", label: `צ'ק-אין: ${hotel.hotelName}` });
    events.push({ id: `${hotel.id}-checkout`, date: hotel.checkOutDate, type: "hotel_checkout", label: `צ'ק-אאוט: ${hotel.hotelName}` });
  }

  for (const flight of params.flights) {
    events.push({
      id: flight.id,
      date: flight.departureAt.slice(0, 10),
      type: "flight",
      label: `${flight.airline}${flight.flightNumber ? ` ${flight.flightNumber}` : ""}`,
    });
  }

  for (const transport of params.transportBookings) {
    events.push({ id: transport.id, date: transport.pickupAt.slice(0, 10), type: "transport", label: transport.mode });
  }

  for (const activity of params.plannedActivities) {
    if (!activity.plannedAt) continue;
    events.push({ id: activity.id, date: activity.plannedAt.slice(0, 10), type: "planned_activity", label: activity.name });
  }

  return events;
}

/** מקבץ אירועים למפה date → events, לצורך רינדור מהיר של תא ביומן. */
export function groupCalendarEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const list = map.get(event.date) ?? [];
    list.push(event);
    map.set(event.date, list);
  }
  return map;
}

/** רשימת התאריכים (ISO) לחודש קלנדרי נתון, כולל ריפוד לתחילת/סוף השבוע (ראשון=0) כדי למלא גריד שלם. */
export function buildMonthGridDates(year: number, month1to12: number): string[] {
  const firstOfMonth = new Date(Date.UTC(year, month1to12 - 1, 1));
  const firstWeekday = firstOfMonth.getUTCDay(); // 0=ראשון
  const daysInMonth = new Date(Date.UTC(year, month1to12, 0)).getUTCDate();

  const lastOfMonth = new Date(Date.UTC(year, month1to12 - 1, daysInMonth));
  const lastWeekday = lastOfMonth.getUTCDay();

  const dates: string[] = [];
  const start = new Date(firstOfMonth);
  start.setUTCDate(start.getUTCDate() - firstWeekday);
  const end = new Date(lastOfMonth);
  end.setUTCDate(end.getUTCDate() + (6 - lastWeekday));

  let current = start;
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }
  return dates;
}
