"use client";

import { useActionState, useState } from "react";
import { createTripAction, type TripFormState } from "./actions";
import { TRIP_TYPE_LABELS } from "@/lib/trip-type-labels";
import { DEFAULT_OPENING_CURRENCY_SLOTS, MAX_OPENING_CURRENCY_SLOTS } from "@/lib/opening-balance-constants";
import { CurrencySelect } from "@/components/currency-select";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";

const initialState: TripFormState = {};

export function TripCreateForm() {
  const [state, formAction, isPending] = useActionState(createTripAction, initialState);
  const [currencySlots, setCurrencySlots] = useState(DEFAULT_OPENING_CURRENCY_SLOTS);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "420px" }}>
      <Field label="שם הטיול" name="name" required errors={state?.fieldErrors?.name} />
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
          <span>תאריך התחלה</span>
          <DatePicker name="startDate" required />
          {state?.fieldErrors?.startDate?.map((message) => (
            <span key={message} style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>
              {message}
            </span>
          ))}
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
          <span>תאריך סיום</span>
          <DatePicker name="endDate" required />
          {state?.fieldErrors?.endDate?.map((message) => (
            <span key={message} style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>
              {message}
            </span>
          ))}
        </label>
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>מטבע בסיס (אופציונלי)</span>
        <CurrencySelect name="baseCurrencyCode" style={inputStyle} />
        {state?.fieldErrors?.baseCurrencyCode?.map((message) => (
          <span key={message} style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>
            {message}
          </span>
        ))}
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>סוג טיול (אופציונלי — מזין הצעות-אריזה מותאמות)</span>
        <Select
          name="tripType"
          defaultValue=""
          style={inputStyle}
          placeholder="לא נבחר"
          options={Object.entries(TRIP_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </label>

      <fieldset style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "0.75rem", margin: 0 }}>
        <legend style={{ padding: "0 0.375rem", fontSize: "0.875rem" }}>יתרת פתיחה לארנק (אופציונלי, עד {MAX_OPENING_CURRENCY_SLOTS} מטבעות)</legend>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          כמה כסף יש לך בכל מטבע כשהטיול מתחיל — אפשר גם להוסיף מאוחר יותר מתוך מסך הטיול.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {Array.from({ length: currencySlots }, (_, index) => index + 1).map((i) => (
            <div key={i} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <CurrencySelect name={`openingCurrency${i}`} style={{ ...inputStyle, flex: "1 1 140px" }} />
              <input
                name={`openingAmount${i}`}
                type="number"
                step="0.01"
                min={0}
                placeholder="סכום"
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          ))}
        </div>
        {currencySlots < MAX_OPENING_CURRENCY_SLOTS ? (
          <button
            type="button"
            onClick={() => setCurrencySlots((count) => Math.min(count + 1, MAX_OPENING_CURRENCY_SLOTS))}
            style={{
              marginTop: "0.5rem",
              padding: "0.375rem 0.625rem",
              borderRadius: "var(--radius-full)",
              border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
              background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
              color: "var(--color-primary)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.8125rem",
            }}
          >
            + הוסף מטבע נוסף
          </button>
        ) : null}
      </fieldset>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>הערות</span>
        <textarea name="notes" rows={3} style={textAreaStyle} />
      </label>

      {state?.formError ? <p style={{ color: "var(--color-danger)" }}>{state.formError}</p> : null}

      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "יוצר..." : "צור טיול"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  maxLength,
  errors,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  errors?: string[];
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
      <span>{label}</span>
      <input name={name} type={type} required={required} maxLength={maxLength} style={inputStyle} />
      {errors?.map((message) => (
        <span key={message} style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>
          {message}
        </span>
      ))}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.625rem 0.875rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)",
};

const textAreaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical" };

function submitButtonStyle(isPending: boolean): React.CSSProperties {
  return {
    padding: "0.75rem 1.25rem",
    borderRadius: "var(--radius-full)",
    border: "none",
    background: isPending ? "var(--color-secondary)" : "var(--gradient-brand)",
    color: isPending ? "var(--color-text-muted)" : "#fff",
    fontWeight: 700,
    cursor: isPending ? "default" : "pointer",
    boxShadow: isPending ? "none" : "var(--glow-brand)",
    transition: "all var(--duration-base) var(--ease-out)",
  };
}
