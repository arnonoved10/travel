import type { DistanceUnit } from "@/lib/preferences/types";

const KM_TO_MILES = 0.621371;

export function kmToMiles(km: number): number {
  return km * KM_TO_MILES;
}

export function formatDistance(km: number, unit: DistanceUnit): string {
  if (unit === "miles") {
    const miles = kmToMiles(km);
    return miles < 0.1 ? `${Math.round(miles * 5280)} ft` : `${miles.toFixed(1)} mi`;
  }
  return km < 1 ? `${Math.round(km * 1000)} מ'` : `${km.toFixed(1)} ק"מ`;
}
