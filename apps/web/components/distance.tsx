"use client";

import { useAppPreferences } from "@/components/preferences-provider";
import { formatDistance } from "@/lib/distance-format";

export function Distance({ km }: { km: number | null }) {
  const { prefs } = useAppPreferences();
  if (km === null) return null;
  return <>{formatDistance(km, prefs.defaultDistanceUnit)}</>;
}
