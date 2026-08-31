"use client";

import type { CSSProperties } from "react";
import { useAppPreferences } from "@/components/preferences-provider";
import {
  NAVIGATION_APP_LABELS,
  MAP_STYLE_LABELS,
  type NavigationApp,
  type MapStyleName,
  type WeatherUnit,
  type DistanceUnit,
  type TimeFormat,
} from "@/lib/preferences/types";
import { ALL_CURRENCY_CODES, CURRENCY_NAMES, GLOBAL_DEFAULT_CURRENCY_CODES } from "@/lib/currencies";
import { Select } from "@/components/ui/Select";

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

const inputStyle: CSSProperties = {
  padding: "0.5rem 0.75rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)",
  fontSize: "0.875rem",
};

const hintStyle: CSSProperties = {
  fontSize: "0.8125rem",
  color: "var(--color-text-muted)",
};

export function PreferencesForm() {
  const { prefs, setPrefs } = useAppPreferences();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "560px" }}>
      <div style={cardStyle}>
        <div style={sectionTitleStyle}>מטבע בית ברירת מחדל</div>
        <Select
          value={prefs.defaultHomeCurrency}
          onChange={(v) => setPrefs({ defaultHomeCurrency: v })}
          style={{ ...inputStyle, maxWidth: "14rem" }}
          groups={[
            {
              label: "הכי שימושיים",
              options: GLOBAL_DEFAULT_CURRENCY_CODES.map((code) => ({ value: code, label: `${CURRENCY_NAMES[code] ?? code} (${code})` })),
            },
            {
              label: "עוד מטבעות",
              options: ALL_CURRENCY_CODES.filter((code) => !GLOBAL_DEFAULT_CURRENCY_CODES.includes(code))
                .sort((a, b) => (CURRENCY_NAMES[a] ?? a).localeCompare(CURRENCY_NAMES[b] ?? b, "he"))
                .map((code) => ({ value: code, label: `${CURRENCY_NAMES[code] ?? code} (${code})` })),
            },
          ]}
        />
        <div style={hintStyle}>המטבע שהמערכת נופלת אליו כשלא מוגדר מטבע אחר.</div>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitleStyle}>אפליקציית ניווט ברירת מחדל</div>
        <Select
          value={prefs.defaultNavigationApp}
          onChange={(v) => setPrefs({ defaultNavigationApp: v as NavigationApp })}
          style={inputStyle}
          options={Object.entries(NAVIGATION_APP_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>

      <div style={cardStyle}>
        <div style={sectionTitleStyle}>סגנון מפה ברירת מחדל</div>
        <Select
          value={prefs.defaultMapStyle}
          onChange={(v) => setPrefs({ defaultMapStyle: v as MapStyleName })}
          style={inputStyle}
          options={Object.entries(MAP_STYLE_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <div style={hintStyle}>ישפיע בפועל כשהמפה התלת-ממדית תחובר (דורש Mapbox Token).</div>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitleStyle}>יחידת טמפרטורה</div>
        <Select
          value={prefs.defaultWeatherUnit}
          onChange={(v) => setPrefs({ defaultWeatherUnit: v as WeatherUnit })}
          style={inputStyle}
          options={[
            { value: "celsius", label: "צלזיוס (°C)" },
            { value: "fahrenheit", label: "פרנהייט (°F)" },
          ]}
        />
        <div style={hintStyle}>חל על כל תצוגות מזג האוויר באפליקציה (מסך &quot;עכשיו&quot;, &quot;היום&quot;, ותכנון מסלול).</div>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitleStyle}>יחידת מרחק</div>
        <Select
          value={prefs.defaultDistanceUnit}
          onChange={(v) => setPrefs({ defaultDistanceUnit: v as DistanceUnit })}
          style={inputStyle}
          options={[
            { value: "km", label: "ק\"מ" },
            { value: "miles", label: "מייל" },
          ]}
        />
        <div style={hintStyle}>חל על מרחקים במסלול היום ובמקומות קרובים.</div>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitleStyle}>פורמט שעה</div>
        <Select
          value={prefs.defaultTimeFormat}
          onChange={(v) => setPrefs({ defaultTimeFormat: v as TimeFormat })}
          style={inputStyle}
          options={[
            { value: "24h", label: "24 שעות (14:30)" },
            { value: "12h", label: "12 שעות (2:30 PM)" },
          ]}
        />
      </div>
    </div>
  );
}
