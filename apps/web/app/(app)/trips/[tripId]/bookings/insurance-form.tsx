"use client";

import { useActionState } from "react";
import { createInsuranceAction, type BookingFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "./form-styles";
import { DatePicker } from "@/components/ui/DatePicker";

const initialState: BookingFormState = {};

export function InsuranceForm({
  tripId,
  plannedActivityId = null,
  defaultValues,
}: {
  tripId: string;
  plannedActivityId?: string | null;
  defaultValues?: { company?: string };
}) {
  const action = createInsuranceAction.bind(null, tripId, plannedActivityId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input name="company" placeholder="חברת ביטוח" defaultValue={defaultValues?.company} required style={inputStyle} />
        <input name="policyType" placeholder="סוג פוליסה" style={inputStyle} />
      </div>
      {state?.fieldErrors?.company?.map((m) => (
        <ErrorText key={m}>{m}</ErrorText>
      ))}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <DatePicker name="startDate" required style={{ minWidth: "140px" }} />
        <DatePicker name="endDate" required style={{ minWidth: "140px" }} />
      </div>
      {state?.fieldErrors?.endDate?.map((m) => (
        <ErrorText key={m}>{m}</ErrorText>
      ))}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input name="policyNumber" placeholder="מספר פוליסה" style={inputStyle} />
        <input name="insuredNumber" placeholder="מספר מבוטח" style={inputStyle} />
      </div>
      <input name="extensions" placeholder="הרחבות כיסוי" style={inputStyle} />
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="coverageNotes" placeholder="פירוט כיסוי" style={{ ...inputStyle, flex: 1, minWidth: "160px" }} />
        <input name="deductible" type="number" step="0.01" min={0} placeholder="השתתפות עצמית" style={{ ...inputStyle, minWidth: "140px" }} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="emergencyPhone" placeholder="טלפון חירום" style={inputStyle} />
        <input name="emergencyWhatsapp" placeholder="WhatsApp חירום" style={inputStyle} />
        <input name="emergencyEmail" type="email" placeholder="אימייל חירום" style={inputStyle} />
        <input name="emergencyWebsite" placeholder="אתר חירום" style={inputStyle} />
      </div>
      <textarea name="emergencyInstructions" placeholder="הוראות חירום" style={{ ...inputStyle, minHeight: "3rem" }} />
      {state?.formError ? <ErrorText>{state.formError}</ErrorText> : null}
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "שומר..." : "הוסף ביטוח"}
      </button>
    </form>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{children}</span>;
}
