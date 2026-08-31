import type { PlaceCategory } from "@travel-app/shared-types";

/** [from, to] gradient stops per category — grouped by theme (food/nature/shopping/
 * transport/health/lodging) so visually related categories read as a family.
 *
 * Kept in its own zero-dependency module (no react-dom/server, no DOM APIs) so it can be
 * safely imported from both Server Components (e.g. dashboard cards) and client-only map
 * code (marker-style.ts) — importing it via marker-style.ts directly broke the build,
 * since that file pulls in react-dom/server which can't be bundled for the browser. */
export const CATEGORY_GRADIENTS: Record<PlaceCategory, [string, string]> = {
  hotel: ["#7c5cff", "#5b3df0"],
  restaurant: ["#f97316", "#ea580c"],
  cafe: ["#d4a017", "#b8890f"],
  bar: ["#ec4899", "#db2777"],
  mall: ["#a855f7", "#9333ea"],
  shop: ["#c084fc", "#a855f7"],
  massage: ["#f472b6", "#ec4899"],
  attraction: ["#f59e0b", "#d97706"],
  entertainment: ["#e879f9", "#c026d3"],
  beach: ["#06b6d4", "#0891b2"],
  nature: ["#22c55e", "#16a34a"],
  river: ["#38bdf8", "#0ea5e9"],
  waterfall: ["#0ea5e9", "#0284c7"],
  viewpoint: ["#14b8a6", "#0d9488"],
  market: ["#eab308", "#ca8a04"],
  airport: ["#3b82f6", "#2563eb"],
  port: ["#0ea5e9", "#0369a1"],
  train_station: ["#6366f1", "#4f46e5"],
  hospital: ["#ef4444", "#dc2626"],
  pharmacy: ["#f43f5e", "#e11d48"],
  chabad_house: ["#3b82f6", "#1d4ed8"],
  car_rental_company: ["#64748b", "#475569"],
  other: ["#94a3b8", "#64748b"],
};
