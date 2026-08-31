"use client";

import { useActionState } from "react";
import type { Expense } from "@travel-app/shared-types";
import { uploadDocumentAction, type DocumentFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "../bookings/form-styles";
import { DOCUMENT_TYPE_LABELS } from "@/lib/document-labels";
import { Select } from "@/components/ui/Select";

const UPLOAD_DOCUMENT_TYPE_OPTIONS = ["receipt", "invoice", "payment_confirmation", "screenshot", "image", "pdf", "other"] as const;

const initialState: DocumentFormState = {};

export function DocumentUploadForm({ tripId, expenses }: { tripId: string; expenses: Expense[] }) {
  const action = uploadDocumentAction.bind(null, tripId, "expense");
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (expenses.length === 0) {
    return <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>הוסף הוצאה קודם כדי לצרף לה קבלה/מסמך.</p>;
  }

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <Select
        name="entityId"
        required
        style={inputStyle}
        defaultValue=""
        placeholder="לאיזו הוצאה?"
        options={expenses.map((expense) => ({
          value: expense.id,
          label: `${expense.description ?? expense.category} — ${expense.amount} ${expense.currencyCode}`,
        }))}
      />
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Select
          name="documentType"
          required
          style={inputStyle}
          defaultValue="receipt"
          options={UPLOAD_DOCUMENT_TYPE_OPTIONS.map((value) => ({ value, label: DOCUMENT_TYPE_LABELS[value] }))}
        />
        <input name="file" type="file" accept="image/*,application/pdf" required style={inputStyle} />
      </div>
      <input name="notes" placeholder="הערות (אופציונלי)" style={inputStyle} />

      {state?.fieldErrors?.fileUrl?.map((m) => (
        <span key={m} style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>
          {m}
        </span>
      ))}
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "מעלה..." : "העלה מסמך"}
      </button>
      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>גודל קובץ מקסימלי: 3MB.</p>
    </form>
  );
}
