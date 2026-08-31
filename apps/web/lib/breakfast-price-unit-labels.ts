import type { BreakfastPriceUnit } from "@travel-app/shared-types";

const BREAKFAST_PRICE_UNIT_LABELS: Record<BreakfastPriceUnit, string> = {
  per_person: " לאדם",
  per_room: " לחדר",
  per_day: " ליום",
  per_stay: " לכל השהות",
};

export function breakfastPriceUnitLabel(unit: BreakfastPriceUnit | null): string {
  return unit ? BREAKFAST_PRICE_UNIT_LABELS[unit] : "";
}
