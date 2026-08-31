"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useAnchoredPosition } from "@/lib/use-anchored-position";
import { Select } from "./Select";
import { ICON_SIZE } from "./tokens";

const WEEKDAY_LABELS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** "YYYY-MM-DD" מ-Date מקומי (לא UTC — נמנע מהחלקה של יום כשהאזור שלילי ל-UTC). */
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseDateStr(s: string | undefined): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function formatDisplay(dateStr: string, withTime: string | null): string {
  const d = parseDateStr(dateStr);
  if (!d) return "";
  const datePart = d.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" });
  return withTime ? `${datePart} · ${withTime}` : datePart;
}

/** בונה grid חודשי מלא (6 שורות × 7 עמודות, כולל ימי-ריפוד מהחודש הקודם/הבא)
 * — לוגיקה עצמאית ופשוטה, לא תלויה ב-lib/calendar.ts (זה משרת תצוגת-אירועים
 * חוצת-טיול, לא בורר-קלט). ראשון בשבוע = יום ראשון, כמו בלוח העברי המקובל. */
function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
}

const HOURS = Array.from({ length: 24 }, (_, h) => ({ value: pad2(h), label: pad2(h) }));
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5).map((m) => ({ value: pad2(m), label: pad2(m) }));

interface BasePickerProps {
  name?: string;
  defaultValue?: string;
  /** שליטה מבחוץ (controlled) — כשמוגדר, הרכיב לא מנהל state פנימי לתאריך. */
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}

function PopoverCalendar({
  selectedDate,
  onPick,
  min,
  max,
  footer,
  positionStyle,
  popoverRef,
}: {
  selectedDate: Date | null;
  onPick: (d: Date) => void;
  min?: string;
  max?: string;
  footer?: React.ReactNode;
  /** מיקום מחושב (fixed, מוצמד לכפתור) — הרכיב מרונדר דרך portal ישירות ל-
   * document.body, כדי שלא ייחתך על-ידי overflow:hidden של אב כלשהו (למשל
   * GlassCard — ר' components/ui/GlassCard.tsx). ר' useAnchoredPosition למטה. */
  positionStyle: React.CSSProperties;
  /** ה-DOM-node של הלוח עצמו נמצא מחוץ ל-subtree של rootRef (בגלל ה-portal) —
   * בלי ref נפרד עליו, useOutsideClose היה מזהה כל קליק בתוך הלוח כ"קליק
   * בחוץ" ומיד סוגר את עצמו (mousedown לפני click), כך שבחירת-תאריך אף פעם
   * לא הייתה מגיעה ל-onPick. ר' useOutsideClose למטה. */
  popoverRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date());
  const minDate = parseDateStr(min);
  const maxDate = parseDateStr(max);
  const grid = buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth());
  const today = toDateStr(new Date());

  return (
    <div
      ref={popoverRef}
      style={{
        position: "fixed",
        zIndex: 1000,
        padding: "0.75rem",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
        // רקע אטום, לא הטוקן השקוף-למחצה — אותו תיקון כמו ברשימת-הכתובות במפה:
        // הלוח יכול להיפתח מעל תמונת-רקע/כרטיס-גרדיאנט, וטקסט כמעט-לבן על
        // שקיפות בלתי-קריא שם.
        background: "var(--color-bg-elevated)",
        boxShadow: "var(--shadow-lg)",
        animation: "lift-in var(--duration-base) var(--ease-out)",
        ...positionStyle,
        // אחרי הפריסה בכוונה — positionStyle (מ-useAnchoredPosition המשותף) כולל
        // עכשיו width של רכיב-העוגן (משמש את LocationPickerMap), אבל הלוח-השנתי
        // צריך רוחב קבוע משלו בלי קשר לרוחב הכפתור שפתח אותו.
        width: "17.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <button
          type="button"
          aria-label="חודש קודם"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          style={{ display: "flex", width: "1.75rem", height: "1.75rem", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-sm)", border: "none", background: "transparent", color: "var(--color-text-secondary)", cursor: "pointer" }}
        >
          <CaretRight size={ICON_SIZE.sm} weight="bold" aria-hidden />
        </button>
        <div style={{ font: "var(--text-card-title)", fontSize: "0.875rem" }}>
          {viewDate.toLocaleDateString("he-IL", { month: "long", year: "numeric" })}
        </div>
        <button
          type="button"
          aria-label="חודש הבא"
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          style={{ display: "flex", width: "1.75rem", height: "1.75rem", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-sm)", border: "none", background: "transparent", color: "var(--color-text-secondary)", cursor: "pointer" }}
        >
          <CaretLeft size={ICON_SIZE.sm} weight="bold" aria-hidden />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.125rem", marginBottom: "0.125rem" }}>
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} style={{ textAlign: "center", font: "var(--text-label)", fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
            {w}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.125rem" }}>
        {grid.map((d) => {
          const dStr = toDateStr(d);
          const inMonth = d.getMonth() === viewDate.getMonth();
          const isToday = dStr === today;
          const isSelected = selectedDate ? dStr === toDateStr(selectedDate) : false;
          const disabled = (minDate ? dStr < toDateStr(minDate) : false) || (maxDate ? dStr > toDateStr(maxDate) : false);
          return (
            <button
              key={dStr}
              type="button"
              disabled={disabled}
              onClick={() => onPick(d)}
              style={{
                aspectRatio: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--radius-sm)",
                border: isToday && !isSelected ? "1px solid var(--color-primary)" : "1px solid transparent",
                background: isSelected ? "var(--gradient-brand)" : "transparent",
                color: disabled ? "var(--color-text-muted)" : isSelected ? "#fff" : inMonth ? "var(--color-text-primary)" : "var(--color-text-muted)",
                boxShadow: isSelected ? "var(--glow-brand)" : "none",
                fontSize: "0.8125rem",
                fontWeight: isToday || isSelected ? 700 : 400,
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.4 : 1,
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {footer}
    </div>
  );
}

function useOutsideClose(
  open: boolean,
  ref: React.RefObject<HTMLDivElement | null>,
  close: () => void,
  extraRef?: React.RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (extraRef?.current?.contains(target)) return;
      close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, ref, close, extraRef]);
}

const triggerButtonStyle = (empty: boolean): React.CSSProperties => ({
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.5rem",
  padding: "0.625rem 0.875rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: empty ? "var(--color-text-muted)" : "var(--color-text-primary)",
  font: "var(--text-body)",
  fontSize: "1rem",
  cursor: "pointer",
});

/** בורר-תאריך מותאם-אישית — מחליף `<input type="date">` שפותח את בורר מערכת-
 * ההפעלה/הדפדפן. פלט: מחרוזת "YYYY-MM-DD" זהה בדיוק לפורמט ש-`type="date"`
 * מייצר, דרך `<input type="hidden">` אמיתי — Server Actions קיימים ממשיכים
 * לעבוד בלי שינוי. */
export function DatePicker({ name, defaultValue, value: valueProp, onChange, required, disabled, min, max, style, placeholder = "בחר תאריך" }: BasePickerProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const value = valueProp !== undefined ? valueProp : internalValue;
  function setValue(v: string) {
    if (valueProp === undefined) setInternalValue(v);
    onChange?.(v);
  }
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  useOutsideClose(open, rootRef, () => setOpen(false), popoverRef);
  const anchorPosition = useAnchoredPosition(open, rootRef);
  const selectedDate = parseDateStr(value);

  return (
    <div ref={rootRef} style={{ position: "relative", width: "100%", ...style }}>
      {name ? <input type="hidden" name={name} value={value} required={required} /> : null}
      <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)} style={triggerButtonStyle(!value)}>
        <span>{value ? formatDisplay(value, null) : placeholder}</span>
        <CalendarBlank size={ICON_SIZE.sm} weight="fill" aria-hidden style={{ flexShrink: 0, color: "var(--color-text-muted)" }} />
      </button>
      {open && anchorPosition && typeof document !== "undefined"
        ? createPortal(
            <PopoverCalendar
              selectedDate={selectedDate}
              min={min}
              max={max}
              positionStyle={anchorPosition}
              popoverRef={popoverRef}
              onPick={(d) => {
                setValue(toDateStr(d));
                setOpen(false);
              }}
            />,
            document.body,
          )
        : null}
    </div>
  );
}

/** גרסת תאריך+שעה — מחליפה `<input type="datetime-local">`. פלט: "YYYY-MM-
 * DDTHH:mm", זהה בדיוק לפורמט ש-`type="datetime-local"` מייצר (שעון-קיר
 * מקומי, בלי אזור-זמן/שניות) — כך שכל לוגיקת-הפענוח הקיימת בצד-שרת ממשיכה
 * לעבוד בלי שינוי. */
export function DateTimePicker({ name, defaultValue, required, disabled, min, max, style, placeholder = "בחר תאריך ושעה" }: BasePickerProps) {
  const [datePart, timePart0] = (defaultValue ?? "").split("T");
  const [value, setValue] = useState(datePart ?? "");
  const [time, setTime] = useState(timePart0 ?? "12:00");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  useOutsideClose(open, rootRef, () => setOpen(false), popoverRef);
  const anchorPosition = useAnchoredPosition(open, rootRef);
  const selectedDate = parseDateStr(value);
  const [hour, minute] = time.split(":");
  const combined = value ? `${value}T${time}` : "";

  return (
    <div ref={rootRef} style={{ position: "relative", width: "100%", ...style }}>
      {name ? <input type="hidden" name={name} value={combined} required={required} /> : null}
      <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)} style={triggerButtonStyle(!value)}>
        <span>{value ? formatDisplay(value, time) : placeholder}</span>
        <CalendarBlank size={ICON_SIZE.sm} weight="fill" aria-hidden style={{ flexShrink: 0, color: "var(--color-text-muted)" }} />
      </button>
      {open && anchorPosition && typeof document !== "undefined"
        ? createPortal(
            <PopoverCalendar
              selectedDate={selectedDate}
              min={min}
              max={max}
              positionStyle={anchorPosition}
              popoverRef={popoverRef}
              onPick={(d) => setValue(toDateStr(d))}
              footer={
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.625rem", paddingTop: "0.625rem", borderTop: "1px solid var(--color-border)" }}>
                  <span style={{ font: "var(--text-caption)", color: "var(--color-text-muted)", flexShrink: 0 }}>שעה:</span>
                  <Select value={hour} onChange={(h) => setTime(`${h}:${minute}`)} options={HOURS} style={{ width: "5rem" }} />
                  <span style={{ color: "var(--color-text-muted)" }}>:</span>
                  <Select value={minute} onChange={(m) => setTime(`${hour}:${m}`)} options={MINUTES} style={{ width: "5rem" }} />
                </div>
              }
            />,
            document.body,
          )
        : null}
    </div>
  );
}
