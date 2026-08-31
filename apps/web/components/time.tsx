"use client";

import { useAppPreferences } from "@/components/preferences-provider";
import { formatTime } from "@/lib/time-format";

export function Time({ iso, timeZone }: { iso: string; timeZone?: string }) {
  const { prefs } = useAppPreferences();
  return <>{formatTime(iso, prefs.defaultTimeFormat, timeZone)}</>;
}
