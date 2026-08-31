import type { AuditAction } from "@travel-app/shared-types";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: "נוצר",
  update: "עודכן",
  delete: "נמחק",
  status_change: "שינוי סטטוס",
};

export const AUDIT_ENTITY_TYPE_LABELS: Record<string, string> = {
  trip: "הטיול",
  planned_activity: "תכנית",
};

export const AUDIT_FIELD_LABELS: Record<string, string> = {
  name: "שם",
  status: "סטטוס",
  startDate: "תאריך התחלה",
  endDate: "תאריך סיום",
  baseCurrencyCode: "מטבע בסיס",
  primaryTimezone: "אזור זמן",
  notes: "הערות",
};
