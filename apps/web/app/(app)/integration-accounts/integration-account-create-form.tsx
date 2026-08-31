"use client";

import { useActionState } from "react";
import { INTEGRATION_SERVICE_LABELS } from "@/lib/integration-account-labels";
import { Select } from "@/components/ui/Select";
import { createIntegrationAccountAction, type IntegrationAccountFormState } from "./actions";

const initialState: IntegrationAccountFormState = {};

export function IntegrationAccountCreateForm() {
  const [state, formAction, isPending] = useActionState(createIntegrationAccountAction, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "420px" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>שירות</span>
        <Select
          name="serviceName"
          required
          style={inputStyle}
          defaultValue=""
          placeholder="בחר שירות"
          options={Object.entries(INTEGRATION_SERVICE_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </label>

      <Field label="שם משתמש/אימייל בחשבון" name="emailOrUsername" />
      <Field label="קישור לחשבון האישי" name="accountLink" type="url" placeholder="https://..." errors={state?.fieldErrors?.accountLink} />
      <Field label="קישור להזמנות שלי" name="bookingsLink" type="url" placeholder="https://..." errors={state?.fieldErrors?.bookingsLink} />
      <Field label="קישור לאתר/אפליקציה" name="websiteLink" type="url" placeholder="https://..." errors={state?.fieldErrors?.websiteLink} />

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>הערות</span>
        <textarea name="notes" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
      </label>

      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
        קישור ידני בלבד — לשמירת קישורים/פרטי-חשבון לעיון מהיר, לא התחברות אוטומטית או סנכרון-הזמנות.
      </p>

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
        {isPending ? "שומר..." : "הוסף חשבון"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  errors,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  errors?: string[];
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <span>{label}</span>
      <input name={name} type={type} placeholder={placeholder} style={inputStyle} />
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
