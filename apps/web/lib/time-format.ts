import type { TimeFormat } from "@/lib/preferences/types";
import { safeTimeZone } from "./dates";

export function formatTime(iso: string, format: TimeFormat, timeZone?: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: format === "12h",
    timeZone: timeZone ? safeTimeZone(timeZone) : undefined,
  }).format(new Date(iso));
}
