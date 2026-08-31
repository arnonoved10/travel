"use client";

import { useActionState } from "react";
import { CONTACT_CATEGORY_LABELS } from "@/lib/contact-labels";
import { Select } from "@/components/ui/Select";
import { createContactAction, type ContactFormState } from "./actions";

const initialState: ContactFormState = {};

export function ContactCreateForm({ trips = [] }: { trips?: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState(createContactAction, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "420px" }}>
      <Field label="שם" name="name" required errors={state?.fieldErrors?.name} />

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>קטגוריה</span>
        <Select
          name="category"
          style={inputStyle}
          defaultValue=""
          placeholder="בחר קטגוריה (אופציונלי)"
          options={Object.entries(CONTACT_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </label>

      {trips.length > 0 ? (
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span>קשר לטיול ספציפי (אופציונלי)</span>
          <Select
            name="tripId"
            style={inputStyle}
            defaultValue=""
            placeholder="איש קשר גלובלי (לא קשור לטיול ספציפי)"
            options={trips.map((trip) => ({ value: trip.id, label: trip.name }))}
          />
        </label>
      ) : null}

      <Field label="חברה" name="company" />
      <Field label="תפקיד" name="role" />
      <Field label="טלפון" name="phone" type="tel" />
      <Field label="WhatsApp" name="whatsapp" type="tel" />
      <Field label="אימייל" name="email" type="email" errors={state?.fieldErrors?.email} />
      <Field label="אתר אינטרנט" name="website" type="url" errors={state?.fieldErrors?.website} />

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
        {isPending ? "שומר..." : "הוסף איש קשר"}
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
