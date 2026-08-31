"use client";

import type { CSSProperties } from "react";
import { useTheme, THEME_ACCENT_PRESETS } from "@/components/theme-provider";
import type { ThemeBrightness, ThemeContrast, ThemeDensity, ThemeMode, ThemeTextSize } from "@/lib/theme/types";

const cardStyle: CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: "1.25rem",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

const sectionTitleStyle: CSSProperties = {
  fontWeight: 600,
  fontSize: "0.9375rem",
};

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.375rem",
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "0.25rem",
        flexWrap: "wrap",
      }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            border: "none",
            cursor: "pointer",
            padding: "0.4rem 0.85rem",
            borderRadius: "var(--radius-sm)",
            background: value === opt.value ? "var(--color-primary)" : "transparent",
            color: value === opt.value ? "#fff" : "var(--color-text)",
            fontSize: "0.875rem",
            fontWeight: value === opt.value ? 600 : 400,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ThemeSettingsForm() {
  const { prefs, setPrefs } = useTheme();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "560px" }}>
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>מצב תצוגה</div>
        <SegmentedControl<ThemeMode>
          value={prefs.mode}
          onChange={(mode) => setPrefs({ mode })}
          options={[
            { value: "light", label: "בהיר" },
            { value: "dark", label: "כהה" },
            { value: "auto", label: "אוטומטי" },
          ]}
        />
        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          &quot;אוטומטי&quot; עוקב אחרי הגדרת מערכת ההפעלה שלך.
        </div>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitleStyle}>צבע Accent</div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {THEME_ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              aria-label={preset.label}
              title={preset.label}
              onClick={() => setPrefs({ accent: preset.value })}
              style={{
                width: "2.25rem",
                height: "2.25rem",
                borderRadius: "50%",
                background: preset.hex,
                border:
                  prefs.accent === preset.value
                    ? "3px solid var(--color-text)"
                    : "1px solid var(--color-border)",
                cursor: "pointer",
              }}
            />
          ))}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
            }}
          >
            מותאם אישית
            <input
              type="color"
              value={prefs.customAccentHex}
              onChange={(e) => setPrefs({ accent: "custom", customAccentHex: e.target.value })}
              style={{
                width: "2.25rem",
                height: "2.25rem",
                padding: 0,
                border:
                  prefs.accent === "custom" ? "3px solid var(--color-text)" : "1px solid var(--color-border)",
                borderRadius: "50%",
                cursor: "pointer",
              }}
            />
          </label>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitleStyle}>בהירות</div>
        <SegmentedControl<ThemeBrightness>
          value={prefs.brightness}
          onChange={(brightness) => setPrefs({ brightness })}
          options={[
            { value: "dim", label: "עמום" },
            { value: "normal", label: "רגיל" },
            { value: "bright", label: "בהיר" },
          ]}
        />
      </div>

      <div style={cardStyle}>
        <div style={sectionTitleStyle}>צפיפות ממשק</div>
        <SegmentedControl<ThemeDensity>
          value={prefs.density}
          onChange={(density) => setPrefs({ density })}
          options={[
            { value: "compact", label: "קומפקטי" },
            { value: "comfortable", label: "נוח" },
            { value: "spacious", label: "מרווח" },
          ]}
        />
      </div>

      <div style={cardStyle}>
        <div style={sectionTitleStyle}>נוספים</div>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
          <input
            type="checkbox"
            checked={prefs.roundedCorners}
            onChange={(e) => setPrefs({ roundedCorners: e.target.checked })}
          />
          פינות מעוגלות
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
          <input
            type="checkbox"
            checked={prefs.animations}
            onChange={(e) => setPrefs({ animations: e.target.checked })}
          />
          אנימציות
        </label>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitleStyle}>נגישות</div>
        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "0.125rem" }}>ניגודיות</div>
        <SegmentedControl<ThemeContrast>
          value={prefs.contrast}
          onChange={(contrast) => setPrefs({ contrast })}
          options={[
            { value: "normal", label: "רגילה" },
            { value: "high", label: "גבוהה" },
          ]}
        />
        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "0.5rem", marginBottom: "0.125rem" }}>גודל טקסט</div>
        <SegmentedControl<ThemeTextSize>
          value={prefs.textSize}
          onChange={(textSize) => setPrefs({ textSize })}
          options={[
            { value: "normal", label: "רגיל" },
            { value: "large", label: "גדול" },
          ]}
        />
      </div>
    </div>
  );
}
