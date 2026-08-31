import type { FlightLiveStatus } from "@travel-app/shared-types";
import type { StatusBadgeTone } from "@/components/ui/StatusBadge";

export const FLIGHT_LIVE_STATUS_LABELS: Record<FlightLiveStatus, string> = {
  scheduled: "מתוכננת",
  active: "באוויר",
  landed: "נחתה",
  cancelled: "בוטלה",
  diverted: "הוסטה",
  incident: "אירוע חריג",
  unknown: "לא ידוע",
};

/** גוון-תצוגה נגזר מהמשמעות (מבוטלת/מוסטת = מסוכן, נחתה = הצלחה), לא שרירותי. */
export const FLIGHT_LIVE_STATUS_TONE: Record<FlightLiveStatus, StatusBadgeTone> = {
  scheduled: "neutral",
  active: "info",
  landed: "success",
  cancelled: "danger",
  diverted: "danger",
  incident: "danger",
  unknown: "neutral",
};
