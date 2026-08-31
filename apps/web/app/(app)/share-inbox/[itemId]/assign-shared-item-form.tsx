"use client";

import { useActionState, useMemo, useState } from "react";
import type { DocumentEntityType, DocumentType } from "@travel-app/shared-types";
import { assignSharedInboxItemAction, type AssignSharedItemFormState } from "../actions";
import { inputStyle, submitButtonStyle } from "@/app/(app)/trips/[tripId]/bookings/form-styles";
import { DOCUMENT_TYPE_LABELS } from "@/lib/document-labels";
import { Select } from "@/components/ui/Select";

export interface EntityOption {
  id: string;
  label: string;
}

export interface EntityGroupOption {
  entityType: DocumentEntityType;
  label: string;
  entities: EntityOption[];
}

export interface TripOption {
  tripId: string;
  tripName: string;
  entityGroups: EntityGroupOption[];
}

const DOCUMENT_TYPE_OPTIONS: DocumentType[] = [
  "booking_confirmation",
  "receipt",
  "invoice",
  "payment_confirmation",
  "voucher",
  "ticket",
  "policy",
  "screenshot",
  "image",
  "pdf",
  "other",
];

const initialState: AssignSharedItemFormState = {};

// שרשרת בחירה בת 3 שלבים (טיול → סוג-הזמנה → הזמנה ספציפית) שכולה כבר בסקופ
// בצד-הלקוח (נבנתה מראש בשרת ב-page.tsx) — בלי round-trip לכל שינוי בחירה,
// כי מדובר בכמות-נתונים קטנה (כמה טיולים, כמה הזמנות בכל אחד) לאפליקציה אישית.
export function AssignSharedItemForm({ itemId, trips, defaultNotes }: { itemId: string; trips: TripOption[]; defaultNotes: string }) {
  const action = assignSharedInboxItemAction.bind(null, itemId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [tripId, setTripId] = useState(trips[0]?.tripId ?? "");
  const selectedTrip = useMemo(() => trips.find((t) => t.tripId === tripId), [trips, tripId]);

  const [entityType, setEntityType] = useState<string>(selectedTrip?.entityGroups[0]?.entityType ?? "");
  const selectedGroup = useMemo(() => selectedTrip?.entityGroups.find((g) => g.entityType === entityType), [selectedTrip, entityType]);

  if (trips.length === 0) {
    return <p style={{ color: "var(--color-text-muted)" }}>אין עדיין טיולים לשייך אליהם — צור טיול קודם.</p>;
  }

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "420px" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
        טיול
        <Select
          name="tripId"
          value={tripId}
          onChange={(v) => {
            const nextTrip = trips.find((t) => t.tripId === v);
            setTripId(v);
            setEntityType(nextTrip?.entityGroups[0]?.entityType ?? "");
          }}
          style={inputStyle}
          options={trips.map((trip) => ({ value: trip.tripId, label: trip.tripName }))}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
        לאיזה סוג הזמנה
        <Select
          name="entityType"
          value={entityType}
          onChange={(v) => setEntityType(v)}
          style={inputStyle}
          options={(selectedTrip?.entityGroups ?? []).map((group) => ({ value: group.entityType, label: group.label }))}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
        למה בדיוק
        <Select
          name="entityId"
          required
          defaultValue=""
          style={inputStyle}
          key={`${tripId}-${entityType}`}
          placeholder="בחר..."
          options={(selectedGroup?.entities ?? []).map((entity) => ({ value: entity.id, label: entity.label }))}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
        סוג מסמך
        <Select
          name="documentType"
          defaultValue="booking_confirmation"
          style={inputStyle}
          options={DOCUMENT_TYPE_OPTIONS.map((value) => ({ value, label: DOCUMENT_TYPE_LABELS[value] }))}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
        הערות (אופציונלי)
        <textarea name="notes" defaultValue={defaultNotes} rows={3} style={{ ...inputStyle, resize: "vertical" as const }} />
      </label>

      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}

      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "משייך..." : "שייך למסמך"}
      </button>
    </form>
  );
}
