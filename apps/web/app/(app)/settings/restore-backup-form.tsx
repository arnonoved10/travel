"use client";

import { useActionState } from "react";
import { restoreBackupAction, type RestoreBackupFormState } from "./actions";

const ENTITY_LABELS: Record<string, string> = {
  trips: "טיולים",
  places: "מקומות",
  paymentCards: "כרטיסי תשלום",
  contacts: "אנשי קשר",
  tripCountries: "מדינות",
  tripCities: "ערים",
  tripPlaces: "קישורי מקום-לטיול",
  wallets: "ארנקים",
  hotelStays: "מלונות",
  flights: "טיסות",
  transportBookings: "הסעות",
  carRentals: "השכרות רכב",
  insurances: "ביטוחים",
  bookingBenefits: "הטבות הזמנה",
  transportQuotes: "הצעות מחיר תחבורה",
  plannedActivities: "תכנון עתידי",
  expenses: "הוצאות",
  payments: "תשלומים",
  currencyExchanges: "המרות מטבע",
  refunds: "החזרים",
  deposits: "פיקדונות",
  budgetCategoryLimits: "תקציבי קטגוריה",
  documents: "מסמכים",
  checklistItems: "פריטי צ'קליסט",
};

const initialState: RestoreBackupFormState = {};

export function RestoreBackupForm() {
  const [state, formAction, isPending] = useActionState(restoreBackupAction, initialState);

  return (
    <div>
      <form action={formAction} style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <input
          name="file"
          type="file"
          accept="application/json"
          required
          style={{
            padding: "0.375rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-elevated)",
            color: "var(--color-text-primary)",
          }}
        />
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius-full)",
            border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
            background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
            color: "var(--color-primary)",
            fontWeight: 600,
            cursor: isPending ? "default" : "pointer",
          }}
        >
          {isPending ? "משחזר..." : "שחזר מגיבוי"}
        </button>
      </form>
      <p style={{ margin: "0.375rem 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
        השחזור יוצר את כל הנתונים מהגיבוי כחדשים (טיולים/מקומות חדשים לגמרי) — לא דורס נתונים קיימים.
      </p>

      {state.formError ? <p style={{ color: "var(--color-danger)", fontSize: "0.875rem" }}>{state.formError}</p> : null}

      {state.summary ? (
        <div style={{ marginTop: "0.75rem", padding: "0.75rem", borderRadius: "var(--radius-md)", background: "var(--color-surface)" }}>
          <p style={{ margin: 0, fontWeight: 600 }}>השחזור הושלם.</p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0.375rem 0 0", fontSize: "0.8125rem", display: "flex", flexWrap: "wrap", gap: "0.25rem 0.75rem" }}>
            {Object.entries(state.summary.restoredCounts)
              .filter(([, count]) => count > 0)
              .map(([entity, count]) => (
                <li key={entity}>
                  {ENTITY_LABELS[entity] ?? entity}: {count}
                </li>
              ))}
          </ul>
          {state.summary.skipped.length > 0 ? (
            <div style={{ marginTop: "0.5rem", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              <p style={{ margin: 0 }}>לא שוחזר במלואו:</p>
              <ul style={{ margin: "0.25rem 0 0", paddingInlineStart: "1.25rem" }}>
                {state.summary.skipped.map((s, i) => (
                  <li key={i}>{s.reason}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
