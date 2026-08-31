import type { FlightLegType } from "@travel-app/shared-types";

export const FLIGHT_LEG_TYPE_LABELS: Record<FlightLegType, string> = {
  outbound: "טיסת הלוך",
  return: "טיסת חזור",
  internal: "טיסה פנימית",
  connecting: "טיסת המשך",
};
