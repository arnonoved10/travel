"use client";

import { useActionState } from "react";
import { LOYALTY_PROGRAM_TYPE_LABELS } from "@/lib/loyalty-program-labels";
import { Select } from "@/components/ui/Select";
import { createLoyaltyProgramAction, type LoyaltyProgramFormState } from "./actions";

const initialState: LoyaltyProgramFormState = {};

export function LoyaltyProgramCreateForm() {
  const [state, formAction, isPending] = useActionState(createLoyaltyProgramAction, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "420px" }}>
      <Field label="שם התוכנית" name="programName" required errors={state?.fieldErrors?.programName} />

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>סוג</span>
        <Select
          name="programType"
          style={inputStyle}
          defaultValue=""
          placeholder="בחר סוג (אופציונלי)"
          options={Object.entries(LOYALTY_PROGRAM_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </label>

      <Field label="מספר חבר" name="memberNumber" />
      <Field label="יתרת נקודות/מיילים" name="currentBalance" type="number" />
      <Field label="דרגה (זהב/כסף/פלטינום...)" name="tierStatus" />

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>הערות</span>
        <textarea name="notes" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
      </label>

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
        {isPending ? "שומר..." : "הוסף תוכנית"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  errors,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  errors?: string[];
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <span>{label}</span>
      <input name={name} type={type} required={required} style={inputStyle} />
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
