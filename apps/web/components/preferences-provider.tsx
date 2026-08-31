"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { APP_PREFERENCES_STORAGE_KEY, DEFAULT_APP_PREFERENCES, type AppPreferences } from "@/lib/preferences/types";

interface PreferencesContextValue {
  prefs: AppPreferences;
  setPrefs: (update: Partial<AppPreferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readStoredPrefs(): AppPreferences {
  if (typeof window === "undefined") return DEFAULT_APP_PREFERENCES;
  try {
    const raw = localStorage.getItem(APP_PREFERENCES_STORAGE_KEY);
    if (raw) return { ...DEFAULT_APP_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    // localStorage unavailable/corrupt — fall back to defaults
  }
  return DEFAULT_APP_PREFERENCES;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<AppPreferences>(() => readStoredPrefs());

  const setPrefs = (update: Partial<AppPreferences>) => {
    setPrefsState((current) => {
      const next = { ...current, ...update };
      try {
        localStorage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable — preference just won't persist across reloads
      }
      return next;
    });
  };

  const value = useMemo(() => ({ prefs, setPrefs }), [prefs]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useAppPreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("useAppPreferences must be used within a PreferencesProvider");
  }
  return ctx;
}
