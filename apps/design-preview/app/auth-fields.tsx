"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { COLOR, Field, SPACE, inputStyle } from "./design-system";

/**
 * שדות משותפים למסכי ההתחברות וההרשמה.
 *
 * fontSize של 16px אינו קישוט: ב-iOS Safari, מיקוד בשדה עם גופן קטן מ-16px
 * מפעיל זום אוטומטי שמותח את כל המסך ולא חוזר לאחור. inputStyle הכללי
 * הוא 14px ומתאים לשאר המסכים, ולכן ההגדלה מוגבלת למסכי האימות בלבד.
 */
export const authInputStyle: CSSProperties = {
  ...inputStyle,
  fontSize: "16px",
  textAlign: "left",
};

function EyeIcon({ off, color = COLOR.textSecondary }: { off: boolean; color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      {off ? <path d="M4 20 20 4" /> : null}
    </svg>
  );
}

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Field label={label}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          type={isVisible ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          dir="ltr"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          // מקום לכפתור העין בקצה השמאלי של השדה (הכיוון כאן ltr)
          style={{ ...authInputStyle, paddingLeft: "44px" }}
        />
        <button
          type="button"
          onClick={() => setIsVisible((v) => !v)}
          aria-label={isVisible ? `הסתרת ${label}` : `הצגת ${label}`}
          aria-pressed={isVisible}
          style={{
            position: "absolute",
            insetInlineEnd: "auto",
            left: SPACE.sm,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            padding: 0,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <EyeIcon off={isVisible} />
        </button>
      </div>
    </Field>
  );
}
