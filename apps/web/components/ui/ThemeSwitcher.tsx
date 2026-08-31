"use client";

import { Sun, Moon, MonitorSmartphone } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import type { ThemeMode } from "@/lib/theme/types";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "./tokens";

const MODES: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "בהיר" },
  { value: "dark", icon: Moon, label: "כהה" },
  { value: "auto", icon: MonitorSmartphone, label: "אוטומטי" },
];

/** Compact 3-way toggle for the TopBar — full accent/brightness/density controls stay on
 * /settings (see ThemeSettingsForm); this is a quick-access shortcut for mode only. */
export function ThemeSwitcher() {
  const { prefs, setPrefs } = useTheme();

  return (
    <div
      role="group"
      aria-label="מצב תצוגה"
      style={{
        display: "flex",
        gap: "0.125rem",
        padding: "0.1875rem",
        borderRadius: "var(--radius-full)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
      }}
    >
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const active = prefs.mode === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            aria-label={mode.label}
            title={mode.label}
            onClick={() => setPrefs({ mode: mode.value })}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "1.875rem",
              height: "1.875rem",
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              background: active ? "var(--gradient-brand)" : "transparent",
              color: active ? "#fff" : "var(--color-text-muted)",
              boxShadow: active ? "var(--glow-brand)" : "none",
              transition: "all var(--duration-base) var(--ease-out)",
            }}
          >
            <Icon size={ICON_SIZE.sm} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
