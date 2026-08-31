"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_THEME_PREFS,
  THEME_ACCENT_PRESETS,
  THEME_STORAGE_KEY,
  type ThemePrefs,
} from "@/lib/theme/types";

interface ThemeContextValue {
  prefs: ThemePrefs;
  resolvedMode: "dark" | "light";
  setPrefs: (update: Partial<ThemePrefs>) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyPrefsToDocument(prefs: ThemePrefs, resolvedMode: "dark" | "light") {
  const root = document.documentElement;
  root.setAttribute("data-theme", resolvedMode);
  root.setAttribute("data-accent", prefs.accent);
  root.setAttribute("data-brightness", prefs.brightness);
  root.setAttribute("data-density", prefs.density);
  root.setAttribute("data-rounded", String(prefs.roundedCorners));
  root.setAttribute("data-animations", String(prefs.animations));
  root.setAttribute("data-contrast", prefs.contrast);
  root.setAttribute("data-text-size", prefs.textSize);

  if (prefs.accent === "custom") {
    root.style.setProperty("--color-primary", prefs.customAccentHex);
    root.style.setProperty("--color-primary-hover", prefs.customAccentHex);
  } else {
    root.style.removeProperty("--color-primary");
    root.style.removeProperty("--color-primary-hover");
  }
}

function resolveMode(mode: ThemePrefs["mode"]): "dark" | "light" {
  if (mode === "auto") {
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return mode;
}

function readStoredPrefs(): ThemePrefs {
  if (typeof window === "undefined") return DEFAULT_THEME_PREFS;
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_THEME_PREFS, ...JSON.parse(raw) };
    }
  } catch {
    // localStorage unavailable/corrupt — fall back to defaults
  }
  return DEFAULT_THEME_PREFS;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Lazy initializers (not an effect) — the inline script in app/layout.tsx already applied
  // these same values to <html> before hydration, so this just brings React state in sync
  // with what's already painted, without a synchronous setState-in-effect cascade.
  const [prefs, setPrefsState] = useState<ThemePrefs>(() => readStoredPrefs());
  const [resolvedMode, setResolvedMode] = useState<"dark" | "light">(() => resolveMode(readStoredPrefs().mode));

  useEffect(() => {
    if (prefs.mode !== "auto") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = resolveMode("auto");
      setResolvedMode(resolved);
      applyPrefsToDocument(prefs, resolved);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.mode]);

  const setPrefs = (update: Partial<ThemePrefs>) => {
    setPrefsState((current) => {
      const next = { ...current, ...update };
      const resolved = resolveMode(next.mode);
      setResolvedMode(resolved);
      applyPrefsToDocument(next, resolved);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable (private browsing etc.) — theme just won't persist
      }
      return next;
    });
  };

  const value = useMemo(() => ({ prefs, resolvedMode, setPrefs }), [prefs, resolvedMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

export { THEME_ACCENT_PRESETS };
