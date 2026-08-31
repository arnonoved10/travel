"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";
import { ICON_SIZE } from "./tokens";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

/** רשימת-בחירה מותאמת-אישית שמחליפה את ה-`<select>` המובנה בכל האפליקציה —
 * הדפדפן/מערכת-ההפעלה מציירים את רשימת ה-`<option>` הנפתחת בעצמם ומתעלמים
 * כמעט לגמרי מ-style שהוגדר על ה-select ההורה, ולכן היא תמיד יוצאת בהירה
 * (רקע/טקסט לבן) גם כשהאפליקציה כהה. הרכיב הזה מצייר את התפריט הנפתח בעצמו,
 * כך שהוא צבוע כמו שאר המערכת, עם אנימציית-פתיחה עדינה (`lift-in`, כבר קיים
 * ב-globals.css).
 *
 * תאימות-טפסים: מוסיף `<input type="hidden" name={name}>` אמיתי לתוך ה-DOM,
 * כדי שכל טופס קיים שמסתמך על `FormData`/Server Action ימשיך לעבוד בלי שום
 * שינוי בצד-השרת — הרכיב הוא רק תחליף-תצוגה, לא שינוי-פרוטוקול. */
export function Select({
  name,
  defaultValue,
  value,
  onChange,
  options,
  groups,
  placeholder = "בחר…",
  required,
  disabled,
  style,
}: {
  name?: string;
  defaultValue?: string;
  /** שליטה מבחוץ (controlled) — כשמוגדר, הרכיב לא מנהל state פנימי לבחירה. */
  value?: string;
  onChange?: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const allOptions: SelectOption[] = groups ? groups.flatMap((g) => g.options) : (options ?? []);
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const selected = value !== undefined ? value : internalValue;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function selectValue(v: string) {
    if (value === undefined) setInternalValue(v);
    onChange?.(v);
    setOpen(false);
  }

  const selectedOption = allOptions.find((o) => o.value === selected);

  function renderOption(opt: SelectOption) {
    const isSelected = opt.value === selected;
    return (
      <li key={opt.value} role="option" aria-selected={isSelected}>
        <button
          type="button"
          disabled={opt.disabled}
          onClick={() => selectValue(opt.value)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
            padding: "0.5rem 0.75rem",
            border: "none",
            background: isSelected ? "color-mix(in srgb, var(--color-primary) 16%, transparent)" : "transparent",
            color: opt.disabled ? "var(--color-text-muted)" : "var(--color-text-primary)",
            font: "var(--text-body)",
            fontSize: "1rem",
            textAlign: "start",
            cursor: opt.disabled ? "default" : "pointer",
            borderRadius: "var(--radius-sm)",
          }}
          onMouseEnter={(e) => {
            if (!opt.disabled && !isSelected) e.currentTarget.style.background = "var(--color-surface)";
          }}
          onMouseLeave={(e) => {
            if (!opt.disabled && !isSelected) e.currentTarget.style.background = "transparent";
          }}
        >
          <span>{opt.label}</span>
          {isSelected ? <Check size={14} weight="bold" color="var(--color-primary)" aria-hidden /> : null}
        </button>
      </li>
    );
  }

  return (
    <div ref={rootRef} style={{ position: "relative", width: "100%", ...style }}>
      {name ? <input type="hidden" name={name} value={selected} required={required} /> : null}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          padding: "0.625rem 0.875rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface-elevated)",
          color: selectedOption ? "var(--color-text-primary)" : "var(--color-text-muted)",
          font: "var(--text-body)",
          fontSize: "1rem",
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "border-color var(--duration-fast) var(--ease-out)",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedOption?.label ?? placeholder}
        </span>
        <CaretDown
          size={ICON_SIZE.sm}
          weight="bold"
          aria-hidden
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform var(--duration-fast) var(--ease-out)", color: "var(--color-text-muted)" }}
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          style={{
            position: "absolute",
            insetInlineStart: 0,
            insetInlineEnd: 0,
            top: "calc(100% + 0.375rem)",
            zIndex: 50,
            margin: 0,
            padding: "0.375rem",
            listStyle: "none",
            maxHeight: "17rem",
            overflowY: "auto",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            // רקע אטום, לא הטוקן השקוף-למחצה — הרשימה יכולה להיפתח מעל תמונת-רקע
            // או כרטיס-גרדיאנט (למשל GlassCard hero), וטקסט כמעט-לבן על שקיפות
            // נמחק שם באותה צורה שתוקנה בבורר-הכתובת במפה.
            background: "var(--color-bg-elevated)",
            boxShadow: "var(--shadow-lg)",
            animation: "lift-in var(--duration-base) var(--ease-out)",
          }}
        >
          {groups
            ? groups.map((g) => (
                <li key={g.label}>
                  <div
                    style={{
                      padding: "0.375rem 0.75rem 0.125rem",
                      font: "var(--text-label)",
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    {g.label}
                  </div>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>{g.options.map(renderOption)}</ul>
                </li>
              ))
            : (options ?? []).map(renderOption)}
        </ul>
      ) : null}
    </div>
  );
}
