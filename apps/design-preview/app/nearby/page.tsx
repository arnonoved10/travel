"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, PillTabs, Card, Badge, PrimaryButton, HeartIcon, PinIcon, COLOR, SPACE } from "../design-system";
import { saveActivity, type TripActivity } from "../trip-content";
import { today, nextId } from "../wallet-data";

const FILTERS = [
  { key: "all" as const, label: "הכל" },
  { key: "coffee" as const, label: "קפה" },
  { key: "food" as const, label: "אוכל" },
  { key: "attractions" as const, label: "אטרקציות" },
];

const PLACES = [
  { id: "p1", name: "קפה רומא", category: "coffee" as const, rating: 4.6, note: "פתוח עכשיו" },
  { id: "p2", name: "קולוסאום", category: "attractions" as const, rating: 4.8, note: "פתוח עכשיו" },
  { id: "p3", name: "טרטוריה דה לוקה", category: "food" as const, rating: 4.5, note: "פתוח עכשיו" },
  { id: "p4", name: "גלריות בורגזה", category: "attractions" as const, rating: 4.7, note: "נסגר ב-17:00" },
];

const CATEGORY_LABEL: Record<(typeof PLACES)[number]["category"], TripActivity["category"]> = {
  coffee: "אוכל",
  food: "אוכל",
  attractions: "אתר",
};

/** מסך "המלצות בסביבה" (31) — נתוני-דמו מוצהרים; אין חיבור לספק-
 * המלצות/מיקום אמיתי (הגיאולוקציה האמיתית של המכשיר משמשת בארנק/עוד, לא
 * כאן). "שמור לתוכנית הטיול" הופך את המקומות המסומנים-בלב לפעילויות
 * אמיתיות שנשמרות ליומן היום (trip-content.ts) — לא רק כפתור-דמו. */
export default function NearbyScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const shown = PLACES.filter((p) => filter === "all" || p.category === filter);

  function toggleLiked(id: string) {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSaveToPlan() {
    const selected = PLACES.filter((p) => liked.has(p.id));
    if (selected.length === 0) return;
    for (const p of selected) {
      saveActivity(today(), { id: nextId("act"), time: "12:00", durationLabel: "שעה", title: p.name, category: CATEGORY_LABEL[p.category], location: p.name, notes: "נוסף ממסך המלצות בסביבה" });
    }
    router.push("/planner");
  }

  return (
    <ScreenShell>
      <ScreenHeader title="המלצות בסביבה" action={<PinIcon />} />
      <PillTabs options={FILTERS} value={filter} onChange={setFilter} />
      <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
        {shown.map((p) => (
          <Card key={p.id} style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: COLOR.cardElevated, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary }}>{p.name}</div>
              <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>
                {p.rating} ★★★★★ · <span style={{ color: COLOR.success }}>{p.note}</span>
              </div>
            </div>
            <button type="button" onClick={() => toggleLiked(p.id)} aria-label={liked.has(p.id) ? "הסרה מהמועדפים" : "הוספה למועדפים"} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
              <HeartIcon size={17} filled={liked.has(p.id)} color={liked.has(p.id) ? COLOR.danger : undefined} />
            </button>
          </Card>
        ))}
      </div>
      <PrimaryButton onClick={handleSaveToPlan} disabled={liked.size === 0}>
        {liked.size > 0 ? `שמירת ${liked.size} מקומות לתוכנית הטיול` : "שמור לתוכנית הטיול"}
      </PrimaryButton>
    </ScreenShell>
  );
}
