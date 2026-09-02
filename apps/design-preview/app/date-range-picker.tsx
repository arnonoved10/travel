"use client";

import { useState } from "react";

/**
 * יומן-בחירת-טווח-תאריכים אמיתי בתוך-האפליקציה (לא input[type=date] מובנה
 * של הדפדפן) — לפי דיווח מפורש שהיומן המובנה "לא נפתח". רכיב עצמאי-לגמרי
 * (לא תלוי ב-design-system.tsx או ב-legacy-shared.tsx) כדי שיהיה שמיש גם
 * במסכים הישנים (מסלול) וגם החדשים (עריכת טיול), בלי לגעת במערכות-העיצוב
 * המשותפות. עיצוב נייטרלי-כהה שמתאים לשתיהן.
 */

const COLORS = {
  overlay: "rgba(0,0,0,0.6)",
  sheetBg: "#0e1930",
  border: "rgba(120,150,200,0.2)",
  text: "#f4f6fb",
  textMuted: "#9aa3bd",
  primary: "#8a5adf",
  primaryBg: "rgba(138,90,223,0.22)",
  rangeBg: "rgba(138,90,223,0.12)",
  danger: "#ef6f61",
};

const WEEKDAY_LABELS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const MONTH_LABELS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function DateRangePicker({
  initialStartDate,
  initialEndDate,
  title = "בחירת תאריכי הטיול",
  onClose,
  onConfirm,
}: {
  initialStartDate?: string;
  initialEndDate?: string;
  title?: string;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => void;
}) {
  const initial = initialStartDate ? fromISO(initialStartDate) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [start, setStart] = useState<string | null>(initialStartDate ?? null);
  const [end, setEnd] = useState<string | null>(initialEndDate ?? null);

  function handleDayClick(iso: string) {
    if (!start || (start && end)) {
      setStart(iso);
      setEnd(null);
    } else if (iso < start) {
      setStart(iso);
      setEnd(null);
    } else {
      setEnd(iso);
    }
  }

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);
  const cells: (string | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: totalDays }, (_, i) => toISO(new Date(viewYear, viewMonth, i + 1)))];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: COLORS.overlay }} />
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
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "15px", fontWeight: 800, color: COLORS.text }}>{title}</span>
          <button type="button" onClick={onClose} aria-label="סגירה" style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", color: COLORS.text, cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <button type="button" onClick={() => changeMonth(1)} aria-label="חודש הבא" style={{ background: "none", border: "none", color: COLORS.text, fontSize: "18px", cursor: "pointer", padding: "4px 10px" }}>
            ‹
          </button>
          <span style={{ fontSize: "14px", fontWeight: 700, color: COLORS.text }}>
            {MONTH_LABELS[viewMonth]} {viewYear}
          </span>
          <button type="button" onClick={() => changeMonth(-1)} aria-label="חודש קודם" style={{ background: "none", border: "none", color: COLORS.text, fontSize: "18px", cursor: "pointer", padding: "4px 10px" }}>
            ›
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
          {WEEKDAY_LABELS.map((w) => (
            <div key={w} style={{ textAlign: "center", fontSize: "11px", color: COLORS.textMuted, padding: "4px 0" }}>
              {w}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
          {cells.map((iso, i) => {
            if (!iso) return <div key={`empty-${i}`} />;
            const isStart = iso === start;
            const isEnd = iso === end;
            const inRange = start && end && iso > start && iso < end;
            const dayNum = Number(iso.split("-")[2]);
            return (
              <button
                key={iso}
                type="button"
                data-testid={`calendar-day-${iso}`}
                onClick={() => handleDayClick(iso)}
                style={{
                  aspectRatio: "1",
                  border: "none",
                  borderRadius: isStart || isEnd ? "10px" : "8px",
                  background: isStart || isEnd ? COLORS.primary : inRange ? COLORS.rangeBg : "transparent",
                  color: isStart || isEnd ? "#fff" : COLORS.text,
                  fontSize: "13px",
                  fontWeight: isStart || isEnd ? 800 : 500,
                  cursor: "pointer",
                }}
              >
                {dayNum}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px", fontSize: "12px", color: COLORS.textMuted }}>
          <span>יציאה: {start ? fmtDisplay(start) : "—"}</span>
          <span>חזרה: {end ? fmtDisplay(end) : "—"}</span>
        </div>

        <button
          type="button"
          disabled={!start || !end}
          onClick={() => start && end && onConfirm(start, end)}
          style={{
            width: "100%",
            marginTop: "14px",
            padding: "13px",
            borderRadius: "12px",
            background: start && end ? COLORS.primary : "rgba(255,255,255,0.08)",
            border: "none",
            color: start && end ? "#fff" : COLORS.textMuted,
            fontSize: "14.5px",
            fontWeight: 800,
            cursor: start && end ? "pointer" : "default",
          }}
        >
          אישור תאריכים
        </button>
      </div>
    </div>
  );
}

function fmtDisplay(iso: string): string {
  return fromISO(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}
