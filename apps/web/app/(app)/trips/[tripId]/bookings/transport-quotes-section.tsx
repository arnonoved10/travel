"use client";

import { useActionState } from "react";
import type { TransportQuote } from "@travel-app/shared-types";
import Link from "next/link";
import { createTransportQuoteAction, deleteTransportQuoteAction, toggleTransportQuoteSelectedAction, type BookingFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "./form-styles";
import { VEHICLE_TYPE_LABELS } from "@/lib/vehicle-type-labels";
import { CurrencySelect } from "@/components/currency-select";
import { Select } from "@/components/ui/Select";

const initialState: BookingFormState = {};

export function TransportQuotesSection({
  tripId,
  quotes,
  preferredCurrencyCodes,
}: {
  tripId: string;
  quotes: TransportQuote[];
  preferredCurrencyCodes?: string[];
}) {
  const action = createTransportQuoteAction.bind(null, tripId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {quotes.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {quotes.map((quote) => (
            <li
              key={quote.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface-elevated)",
                border: quote.isSelected ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>
                  {quote.isSelected ? "✓ " : ""}
                  {quote.provider} — {quote.price} {quote.currencyCode}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                  {quote.vehicleType ? VEHICLE_TYPE_LABELS[quote.vehicleType] ?? quote.vehicleType : ""}
                  {quote.terms ? ` · ${quote.terms}` : ""}
                  {quote.notes ? ` · ${quote.notes}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
                {quote.transportBookingId ? (
                  <span style={{ fontSize: "0.75rem", color: "var(--color-success)" }}>✓ הוזמנה</span>
                ) : (
                  <Link
                    href={`/trips/${tripId}?fromQuote=${quote.id}#book-transport`}
                    style={{
                      padding: "0.25rem 0.625rem",
                      borderRadius: "var(--radius-full)",
                      border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
                      background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
                      color: "var(--color-primary)",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      textDecoration: "none",
                    }}
                  >
                    הזמן לפי הצעה זו
                  </Link>
                )}
                <form action={toggleTransportQuoteSelectedAction.bind(null, tripId, quote.id)}>
                  <button
                    type="submit"
                    style={{
                      padding: "0.25rem 0.625rem",
                      borderRadius: "var(--radius-full)",
                      border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
                      background: quote.isSelected ? "var(--gradient-brand)" : "color-mix(in srgb, var(--color-primary) 14%, transparent)",
                      color: quote.isSelected ? "#fff" : "var(--color-primary)",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                  >
                    {quote.isSelected ? "נבחרה" : "בחר"}
                  </button>
                </form>
                <form action={deleteTransportQuoteAction.bind(null, tripId, quote.id)}>
                  <button
                    type="submit"
                    style={{
                      padding: "0.25rem 0.625rem",
                      borderRadius: "var(--radius-full)",
                      border: "1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)",
                      background: "color-mix(in srgb, var(--color-danger) 12%, transparent)",
                      color: "var(--color-danger)",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                  >
                    הסר
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", margin: 0 }}>אין עדיין הצעות מחיר להשוואה.</p>
      )}

      <form action={formAction} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <input name="provider" placeholder="ספק" required style={{ ...inputStyle, maxWidth: "160px" }} />
        <input name="price" type="number" min="0.01" step="0.01" placeholder="מחיר" required style={{ ...inputStyle, maxWidth: "100px" }} />
        <CurrencySelect name="currencyCode" required preferredCurrencyCodes={preferredCurrencyCodes} style={{ ...inputStyle, maxWidth: "170px" }} />
        <Select
          name="vehicleType"
          style={{ ...inputStyle, maxWidth: "140px" }}
          defaultValue=""
          placeholder="סוג רכב (אופציונלי)"
          options={Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <input name="terms" placeholder="תנאים (אופציונלי)" style={{ ...inputStyle, maxWidth: "160px" }} />
        <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
          {isPending ? "מוסיף..." : "+ הצעת מחיר"}
        </button>
      </form>
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
    </div>
  );
}
