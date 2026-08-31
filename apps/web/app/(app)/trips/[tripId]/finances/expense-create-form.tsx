"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Place, TripCompanion } from "@travel-app/shared-types";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/expense-labels";
import { TIP_CATEGORY_LABELS } from "@/lib/tip-labels";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-method-labels";
import { createExpenseAction, type FinanceFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "../bookings/form-styles";
import { CurrencySelect } from "@/components/currency-select";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";

const initialState: FinanceFormState = {};

// קטגוריות עם שדות ייעודיים נוספים (מקום, דירוג אישי) — לפי הדרישה המקורית
// "מסאז'ים, אוכל, פירות, קניות, אטרקציות — מסכים ייעודיים". תמונה נדחית
// (תלויה ב-Storage אמיתי, כמו Documents), וטיפ נפרד כבר קיים כ-category=tip.
const DEDICATED_CATEGORIES = new Set(["massage", "food", "fruit", "shopping", "attraction"]);

export function ExpenseCreateForm({
  tripId,
  linkedPlaces = [],
  companions = [],
  preferredCurrencyCodes,
  defaultDate,
  onSuccess,
}: {
  tripId: string;
  linkedPlaces?: Place[];
  companions?: TripCompanion[];
  preferredCurrencyCodes?: string[];
  /** מוצג כשדה-תאריך ניתן-לעריכה (לא תמיד "עכשיו") — כשמגיע ממסך-יום ספציפי
   * (days/[date]/page.tsx) ממולא לאותו יום. */
  defaultDate?: string;
  /** נקרא אחרי שמירה מוצלחת (בלי שגיאות) — למשל להוספה-מהירה בדשבורד שרוצה
   * לסגור/לאפס את עצמה בלי לחכות לניווט-עמוד. */
  onSuccess?: (createdId: string) => void;
}) {
  const action = createExpenseAction.bind(null, tripId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [category, setCategory] = useState("");
  const showDedicatedFields = DEDICATED_CATEGORIES.has(category);
  const timezoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state !== initialState && !state.formError && !state.fieldErrors && state.createdId) onSuccess?.(state.createdId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      onSubmit={() => {
        // נקבע רק ברגע השליחה (לא ב-render/Effect) כדי למנוע חוסר-התאמת Server/Client —
        // Intl.DateTimeFormat תלוי-סביבה, ו-formData נבנה מה-DOM בפועל בזמן ה-submit.
        if (timezoneInputRef.current) timezoneInputRef.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
      }}
      style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
    >
      <input ref={timezoneInputRef} type="hidden" name="timezone" />
      <DatePicker name="expenseAt" defaultValue={defaultDate} placeholder="תאריך ההוצאה (ברירת מחדל: עכשיו)" style={{ maxWidth: "220px" }} />
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          name="category"
          list="expense-category-suggestions"
          placeholder="קטגוריה (בחר או הקלד חדשה)"
          required
          style={inputStyle}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <datalist id="expense-category-suggestions">
          {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </datalist>
        <input name="description" placeholder="תיאור" style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input name="amount" type="number" min="0.01" step="0.01" placeholder="סכום" required style={inputStyle} />
        <CurrencySelect name="currencyCode" required preferredCurrencyCodes={preferredCurrencyCodes} style={{ ...inputStyle, flex: "1 1 140px" }} />
        <Select
          name="paymentMethod"
          defaultValue=""
          style={{ ...inputStyle, flex: "1 1 140px" }}
          placeholder="שולם ב... (אופציונלי — יורד מהארנק)"
          options={Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>

      {showDedicatedFields ? (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Select
            name="placeId"
            style={{ ...inputStyle, flex: 1, minWidth: "140px" }}
            defaultValue=""
            placeholder="מקום בטיול (אופציונלי)"
            options={linkedPlaces.map((place) => ({ value: place.id, label: place.name }))}
          />
          <Select
            name="personalRating"
            style={inputStyle}
            defaultValue=""
            placeholder="דירוג אישי"
            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: "★".repeat(n) }))}
          />
          {category === "shopping" || category === "fruit" ? (
            <>
              <input name="itemName" placeholder={category === "fruit" ? "איזה פרי" : "מה קניתי"} style={{ ...inputStyle, flex: 1, minWidth: "120px" }} />
              <input name="quantity" type="number" min="1" step="1" placeholder="כמות" style={{ ...inputStyle, maxWidth: "80px" }} />
            </>
          ) : null}
        </div>
      ) : null}

      {category === "tip" ? (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input name="tipRecipient" placeholder="למי ניתן הטיפ" style={inputStyle} />
          <Select
            name="tipCategory"
            style={inputStyle}
            defaultValue=""
            placeholder="קטגוריית טיפ"
            options={Object.entries(TIP_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </div>
      ) : null}

      {companions.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>הוצאה משותפת עם (אופציונלי):</span>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {companions.map((companion) => (
              <label key={companion.id} style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem" }}>
                <input type="checkbox" name="participantIds" value={companion.id} />
                {companion.displayName}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {state?.fieldErrors?.amount?.map((m) => (
        <span key={m} style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>
          {m}
        </span>
      ))}
      {state?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{state.formError}</span> : null}
      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "שומר..." : "הוסף הוצאה"}
      </button>
    </form>
  );
}
