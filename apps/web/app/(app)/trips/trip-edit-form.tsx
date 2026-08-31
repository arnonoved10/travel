"use client";

import { useActionState } from "react";
import type { Trip } from "@travel-app/shared-types";
import { updateTripAction, type TripFormState } from "./actions";
import { TRIP_TYPE_LABELS } from "@/lib/trip-type-labels";
import { CurrencySelect } from "@/components/currency-select";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";

const STATUS_LABELS: Record<Trip["status"], string> = {
  planning: "בתכנון",
  upcoming: "קרוב",
  active: "פעיל",
  completed: "הושלם",
  archived: "בארכיון",
};

const initialState: TripFormState = {};

export function TripEditForm({ trip }: { trip: Trip }) {
  const action = updateTripAction.bind(null, trip.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "420px" }}>
      <Field label="שם הטיול" name="name" defaultValue={trip.name} required errors={state?.fieldErrors?.name} />

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>סטטוס</span>
        <Select
          name="status"
          defaultValue={trip.status}
          style={inputStyle}
          options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </label>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
          <span>תאריך התחלה</span>
          <DatePicker name="startDate" defaultValue={trip.startDate} required />
          {state?.fieldErrors?.startDate?.map((message) => (
            <span key={message} style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>
              {message}
            </span>
          ))}
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
          <span>תאריך סיום</span>
          <DatePicker name="endDate" defaultValue={trip.endDate} required />
          {state?.fieldErrors?.endDate?.map((message) => (
            <span key={message} style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>
              {message}
            </span>
          ))}
        </label>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>מטבע בסיס</span>
        <CurrencySelect name="baseCurrencyCode" defaultValue={trip.baseCurrencyCode ?? undefined} style={inputStyle} />
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
          defaultValue={trip.tripType ?? ""}
          style={inputStyle}
          placeholder="לא נבחר"
          options={Object.entries(TRIP_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>הערות</span>
        <textarea name="notes" rows={3} defaultValue={trip.notes ?? ""} style={{ ...inputStyle, resize: "vertical" }} />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>הערות רפואיות אישיות (למסך חירום, אופציונלי)</span>
        <textarea
          name="medicalNotes"
          rows={3}
          defaultValue={trip.medicalNotes ?? ""}
          placeholder="אלרגיות, תרופות קבועות, מחלות כרוניות — כל מה שרלוונטי במקרה חירום"
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>תוקף הדרכון (אופציונלי)</span>
        <DatePicker name="passportExpiryDate" defaultValue={trip.passportExpiryDate ?? ""} />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>תוקף רישיון-נהיגה בינלאומי (אופציונלי — רלוונטי רק אם יש השכרת-רכב)</span>
        <DatePicker name="internationalDrivingPermitExpiryDate" defaultValue={trip.internationalDrivingPermitExpiryDate ?? ""} />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>תוקף רישיון-נהיגה ישראלי (אופציונלי — רלוונטי רק אם יש השכרת-רכב)</span>
        <DatePicker name="israeliDrivingLicenseExpiryDate" defaultValue={trip.israeliDrivingLicenseExpiryDate ?? ""} />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.375rem", fontSize: "0.875rem" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input type="checkbox" name="visaRequirementsChecked" defaultChecked={trip.visaRequirementsChecked} />
          בדקתי דרישות ויזה לכל היעדים בטיול
        </span>
        <span style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
          המערכת לא קובעת בעצמה אם צריך ויזה — כל מדינה שונה, ויש מדינות עם פטור לתקופה מסוימת (למשל 30 יום) ואחרות שדורשות
          ויזה מראש. אפשר לבדוק באתר הקונסולרי הרשמי של משרד החוץ:{" "}
          <a href="https://govextra.gov.il/foreign-affairs/consular-affairs/travel/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
            govextra.gov.il
          </a>
          .
        </span>
      </label>

      {state?.formError ? <p style={{ color: "var(--color-danger)" }}>{state.formError}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: "0.75rem 1.25rem",
          borderRadius: "var(--radius-full)",
          border: "none",
          background: isPending ? "var(--color-secondary)" : "var(--gradient-brand)",
          color: isPending ? "var(--color-text-muted)" : "#fff",
          fontWeight: 700,
          cursor: isPending ? "default" : "pointer",
          boxShadow: isPending ? "none" : "var(--glow-brand)",
          transition: "all var(--duration-base) var(--ease-out)",
        }}
      >
        {isPending ? "שומר..." : "שמור שינויים"}
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
  defaultValue,
  errors,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  defaultValue?: string;
  errors?: string[];
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
      <span>{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        maxLength={maxLength}
        defaultValue={defaultValue}
        style={inputStyle}
      />
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
