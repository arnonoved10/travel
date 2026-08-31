"use client";

import { useActionState } from "react";
import type { BookingBenefit } from "@travel-app/shared-types";
import { createBookingBenefitAction, deleteBookingBenefitAction, type BookingFormState } from "./actions";
import { inputStyle } from "./form-styles";
import { Select } from "@/components/ui/Select";

const BENEFIT_TYPE_LABELS: Record<string, string> = {
  breakfast: "ארוחת בוקר",
  airport_transfer: "הסעה משדה התעופה",
  early_checkin: "צ'ק-אין מוקדם",
  late_checkout: "צ'ק-אאוט מאוחר",
  room_upgrade: "שדרוג חדר",
  lounge_access: "כניסה ל-Lounge",
  parking: "חניה",
  wifi: "WiFi",
  pool_access: "בריכה",
  gym: "חדר כושר",
  spa: "ספא",
  hotel_credit: "קרדיט מלון",
  meals: "ארוחות",
  drinks: "משקאות",
  free_cancellation: "ביטול חינם",
  taxes_included: "מיסים כלולים",
  other: "אחר",
};

const initialState: BookingFormState = {};

export function BookingBenefitsSection({
  tripId,
  bookingId,
  benefits,
}: {
  tripId: string;
  bookingId: string;
  benefits: BookingBenefit[];
}) {
  const action = createBookingBenefitAction.bind(null, tripId, bookingId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <div style={{ marginTop: "0.375rem", fontSize: "0.8125rem" }}>
      {benefits.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 0.375rem 0", display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
          {benefits.map((b) => (
            <li
              key={b.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.125rem 0.5rem",
                borderRadius: "999px",
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
              }}
            >
              <span>
                {b.benefitType ? BENEFIT_TYPE_LABELS[b.benefitType] : b.benefitName}
                {b.benefitType && b.benefitName !== BENEFIT_TYPE_LABELS[b.benefitType] ? ` (${b.benefitName})` : ""}
                {b.valueAmount ? ` · ${b.valueAmount} ${b.valueCurrencyCode ?? ""}` : ""}
              </span>
              <form action={deleteBookingBenefitAction.bind(null, tripId, b.id)}>
                <button type="submit" style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer", padding: 0 }}>
                  ✕
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
      <form action={formAction} style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
        <input name="benefitName" placeholder="הטבה (למשל ארוחת בוקר)" required style={{ ...inputStyle, padding: "0.25rem 0.5rem", maxWidth: "160px" }} />
        <Select
          name="benefitType"
          style={{ ...inputStyle, padding: "0.25rem 0.5rem" }}
          defaultValue=""
          placeholder="סוג (אופציונלי)"
          options={Object.entries(BENEFIT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "0.25rem 0.625rem",
            borderRadius: "var(--radius-full)",
            border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
            background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
            color: "var(--color-primary)",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.75rem",
          }}
        >
          {isPending ? "מוסיף..." : "+ הטבה"}
        </button>
      </form>
      {state?.formError ? <span style={{ color: "var(--color-danger)" }}>{state.formError}</span> : null}
    </div>
  );
}
