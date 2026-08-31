export interface PlaceStats {
  visitCount: number;
  spentByCurrency: Map<string, number>;
}

/**
 * "כמה פעמים הייתי / כמה הוצאתי" לכל מקום, חוצה-טיולים — Place גלובלי,
 * לא פר-טיול (ר' FEATURE_AUDIT.md #8). ביקור = TripPlace עם status="visited"
 * (ייחודי לפי tripId+placeId בסכימה, אז כל טיול נספר פעם אחת). הוצאה
 * מיוחסת למקום רק כש-Expense.placeId מוגדר במפורש — לא ניחוש/שיוך גיאוגרפי.
 */
export function computePlaceStats(params: {
  tripPlaces: { placeId: string; status: string }[];
  expenses: { placeId: string | null; amount: number; currencyCode: string }[];
}): Map<string, PlaceStats> {
  const stats = new Map<string, PlaceStats>();

  function getOrCreate(placeId: string): PlaceStats {
    const existing = stats.get(placeId);
    if (existing) return existing;
    const created: PlaceStats = { visitCount: 0, spentByCurrency: new Map() };
    stats.set(placeId, created);
    return created;
  }

  for (const tp of params.tripPlaces) {
    if (tp.status !== "visited") continue;
    getOrCreate(tp.placeId).visitCount += 1;
  }

  for (const expense of params.expenses) {
    if (!expense.placeId) continue;
    const entry = getOrCreate(expense.placeId);
    entry.spentByCurrency.set(expense.currencyCode, (entry.spentByCurrency.get(expense.currencyCode) ?? 0) + expense.amount);
  }

  return stats;
}
