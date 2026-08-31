"use client";

import { useAppPreferences } from "@/components/preferences-provider";
import { formatTemperature } from "@/lib/temperature-format";

export function Temperature({ celsius }: { celsius: number | null }) {
  const { prefs } = useAppPreferences();
  if (celsius === null) return null;
  return <>{formatTemperature(celsius, prefs.defaultWeatherUnit)}</>;
}
