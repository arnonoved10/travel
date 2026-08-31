"use client";

import { useActionState } from "react";
import { createChecklistItemAction, type ChecklistFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "../bookings/form-styles";

const initialState: ChecklistFormState = {};

export function ChecklistItemForm({ tripId, listType, showCategory }: { tripId: string; listType: "packing" | "before_trip"; showCategory: boolean }) {
  const action = createChecklistItemAction.bind(null, tripId, listType);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end", marginTop: "0.5rem" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem", flex: 1, minWidth: "160px" }}>
        פריט חדש
        <input name="name" required style={inputStyle} />
      </label>
      {showCategory ? (
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
          קטגוריה
          <input name="category" style={{ ...inputStyle, maxWidth: "140px" }} />
        </label>
      ) : null}
      {showCategory ? (
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
          כמות
          <input name="quantity" type="number" min="1" step="1" style={{ ...inputStyle, maxWidth: "80px" }} />
        </label>
      ) : null}
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "מוסיף..." : "הוסף"}
      </button>
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
    </form>
  );
}
