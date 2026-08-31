import type { OcrStatus } from "@travel-app/shared-types";
import type { StatusBadgeTone } from "@/components/ui/StatusBadge";

export const OCR_STATUS_LABELS: Record<OcrStatus, string> = {
  pending: "טרם נקרא",
  parsed: "נקרא — אין שדות לאישור",
  needs_confirmation: "ממתין לאישור שדות",
  confirmed: "אושר",
  failed: "קריאה נכשלה",
};

export const OCR_STATUS_TONE: Record<OcrStatus, StatusBadgeTone> = {
  pending: "neutral",
  parsed: "info",
  needs_confirmation: "warning",
  confirmed: "success",
  failed: "danger",
};
