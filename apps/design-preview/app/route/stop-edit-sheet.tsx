"use client";

import { useState } from "react";
import { CountryPickerButton } from "../pickers";
import { DateRangePicker } from "../date-range-picker";
import type { TripStop, StopStatus } from "../trip-content";

/**
 * עריכת/הוספת תחנה במסלול הטיול — קודם לא הייתה שום דרך אמיתית לערוך,
 * להוסיף או למחוק תחנה (כפתור "הוסף תחנה" לא עשה כלום, ואין היה עריכה
 * בכלל). רכיב עצמאי (לא נוגע ב-legacy-shared.tsx/design-system.tsx).
 */

const STATUSES: StopStatus[] = ["מאושר", "ממתין לאישור", "בוצע"];

const COLORS = {
  sheetBg: "#0e1930",
  border: "rgba(120,150,200,0.2)",
  text: "#f4f6fb",
  textMuted: "#9aa3bd",
  primary: "#8a5adf",
  danger: "#ef6f61",
};

export function StopEditSheet({
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  initial: TripStop | null;
  onClose: () => void;
  onSave: (stop: Omit<TripStop, "id">) => void;
  onDelete?: () => void;
}) {
  const [city, setCity] = useState(initial?.city ?? "");
  const [countryCode, setCountryCode] = useState<string | null>(initial?.countryCode ?? null);
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [hotel, setHotel] = useState(initial?.hotel ?? "");
  const [transportToNext, setTransportToNext] = useState(initial?.transportToNext ?? "");
  const [status, setStatus] = useState<StopStatus>(initial?.status ?? "מאושר");
  const [attractionsText, setAttractionsText] = useState((initial?.attractions ?? []).join("\n"));
  const [restaurantsText, setRestaurantsText] = useState((initial?.restaurants ?? []).join("\n"));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const canSave = city.trim().length > 0 && !!countryCode && !!startDate && !!endDate;

  function handleSave() {
    if (!canSave || !countryCode) return;
    onSave({
      city: city.trim(),
      countryCode,
      startDate,
      endDate,
      transportToNext: transportToNext.trim(),
      status,
      hotel: hotel.trim() || undefined,
      attractions: attractionsText.split("\n").map((s) => s.trim()).filter(Boolean),
      restaurants: restaurantsText.split("\n").map((s) => s.trim()).filter(Boolean),
    });
  }

  const dateLabel = startDate && endDate ? `${fmt(startDate)} - ${fmt(endDate)}` : "בחירת תאריכים";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "480px",
          background: COLORS.sheetBg,
          borderTop: `1px solid ${COLORS.border}`,
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          padding: "16px",
          maxHeight: "88vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "15px", fontWeight: 800, color: COLORS.text }}>{initial ? "עריכת תחנה" : "הוספת תחנה"}</span>
          <button type="button" onClick={onClose} aria-label="סגירה" style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", color: COLORS.text, cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <FieldLabel label="עיר / יעד">
          <input
            data-testid="stop-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={fieldStyle}
          />
        </FieldLabel>

        <FieldLabel label="מדינה">
          <CountryPickerButton selectedCode={countryCode} onSelect={(c) => setCountryCode(c.code)} testId="stop-country" />
        </FieldLabel>

        <FieldLabel label="תאריכים">
          <button type="button" data-testid="stop-dates-button" onClick={() => setShowDatePicker(true)} style={{ ...fieldStyle, textAlign: "start", cursor: "pointer" }}>
            {dateLabel}
          </button>
        </FieldLabel>

        <FieldLabel label="סטטוס">
          <div style={{ display: "flex", gap: "6px" }}>
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: status === s ? COLORS.primary : "rgba(255,255,255,0.06)",
                  border: `1px solid ${status === s ? COLORS.primary : COLORS.border}`,
                  color: "#fff",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </FieldLabel>

        <FieldLabel label="מלון (לא חובה)">
          <input data-testid="stop-hotel" value={hotel} onChange={(e) => setHotel(e.target.value)} style={fieldStyle} />
        </FieldLabel>

        <FieldLabel label="אטרקציות (שורה לכל אחת, לא חובה)">
          <textarea value={attractionsText} onChange={(e) => setAttractionsText(e.target.value)} rows={2} style={{ ...fieldStyle, resize: "vertical" }} />
        </FieldLabel>

        <FieldLabel label="מסעדות (שורה לכל אחת, לא חובה)">
          <textarea value={restaurantsText} onChange={(e) => setRestaurantsText(e.target.value)} rows={2} style={{ ...fieldStyle, resize: "vertical" }} />
        </FieldLabel>

        <FieldLabel label="מעבר לתחנה הבאה (לא חובה)">
          <input data-testid="stop-transport" value={transportToNext} onChange={(e) => setTransportToNext(e.target.value)} style={fieldStyle} placeholder="למשל: רכבת · כשעה" />
        </FieldLabel>

        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          {initial && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              style={{ padding: "13px 16px", borderRadius: "12px", background: "rgba(239,111,97,0.14)", border: `1px solid ${COLORS.danger}45`, color: COLORS.danger, fontSize: "13.5px", fontWeight: 800, cursor: "pointer" }}
            >
              מחיקת תחנה
            </button>
          ) : null}
          <button
            type="button"
            data-testid="stop-save"
            disabled={!canSave}
            onClick={handleSave}
            style={{
              flex: 1,
              padding: "13px",
              borderRadius: "12px",
              background: canSave ? COLORS.primary : "rgba(255,255,255,0.08)",
              border: "none",
              color: canSave ? "#fff" : COLORS.textMuted,
              fontSize: "14.5px",
              fontWeight: 800,
              cursor: canSave ? "pointer" : "default",
            }}
          >
            שמירה
          </button>
        </div>
      </div>

      {showDatePicker ? (
        <DateRangePicker
          title="תאריכי התחנה"
          initialStartDate={startDate || undefined}
          initialEndDate={endDate || undefined}
          onClose={() => setShowDatePicker(false)}
          onConfirm={(s, e) => {
            setStartDate(s);
            setEndDate(e);
            setShowDatePicker(false);
          }}
        />
      ) : null}
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "11.5px", fontWeight: 600, color: COLORS.textMuted, marginBottom: "4px" }}>{label}</div>
      {children}
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  background: "#0a1526",
  border: `1px solid ${COLORS.border}`,
  color: COLORS.text,
  fontSize: "13.5px",
  fontFamily: "inherit",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
}
