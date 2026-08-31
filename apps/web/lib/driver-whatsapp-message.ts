import type { Flight, TransportBooking } from "@travel-app/shared-types";
import { formatDateTimeInZone } from "./dates";
import { TRANSPORT_MODE_LABELS } from "./transport-mode-labels";
import { FLIGHT_LIVE_STATUS_LABELS } from "./flight-live-status-labels";

/**
 * הודעת-איסוף אמיתית לנהג — נבנית תמיד מהמצב הנוכחי בפועל (שעת-איסוף
 * עדכנית, סטטוס-טיסה חי אם נבדק), לא תבנית קבועה. אותה פונקציה משמשת גם
 * לשליחה ראשונית וגם לעדכון-שינוי — אחרי שמעדכנים את שעת-האיסוף ושולחים שוב,
 * ההודעה החדשה כבר משקפת את הזמן המעודכן, בלי צורך ב"הודעת עדכון" נפרדת.
 */
export function buildDriverWhatsAppMessage({
  transportBooking,
  linkedFlight,
}: {
  transportBooking: Pick<TransportBooking, "mode" | "pickupText" | "dropoffText" | "pickupAt" | "pickupTimezone">;
  linkedFlight: Pick<Flight, "airline" | "flightNumber" | "arrivalAt" | "arrivalTimezone" | "liveStatus" | "liveDelayMinutes"> | null;
}): string {
  const lines: string[] = [];
  lines.push(`שלום, פרטי איסוף (${TRANSPORT_MODE_LABELS[transportBooking.mode] ?? transportBooking.mode}):`);
  lines.push(`שעת איסוף: ${formatDateTimeInZone(transportBooking.pickupAt, transportBooking.pickupTimezone)}`);
  if (transportBooking.pickupText) lines.push(`מאיפה: ${transportBooking.pickupText}`);
  if (transportBooking.dropoffText) lines.push(`ליעד: ${transportBooking.dropoffText}`);

  if (linkedFlight) {
    lines.push("");
    lines.push(`טיסה: ${linkedFlight.airline} ${linkedFlight.flightNumber ?? ""}`.trim());
    lines.push(`נחיתה משוערת: ${formatDateTimeInZone(linkedFlight.arrivalAt, linkedFlight.arrivalTimezone)}`);
    if (linkedFlight.liveStatus) {
      const delayText = linkedFlight.liveDelayMinutes ? ` (עיכוב של ${linkedFlight.liveDelayMinutes} דקות)` : "";
      lines.push(`סטטוס טיסה: ${FLIGHT_LIVE_STATUS_LABELS[linkedFlight.liveStatus]}${delayText}`);
    }
  }

  lines.push("");
  lines.push("תודה!");
  return lines.join("\n");
}
