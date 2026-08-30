"use client";

import { useState } from "react";
import { ScreenShell, ScreenHeader, PillTabs, Card, Badge, PrimaryButton, HeartIcon, PinIcon, COLOR, SPACE } from "../design-system";

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

/** מסך "המלצות בסביבה" (31) — נתוני-דמו מוצהרים; אין חיבור לספק-
 * המלצות/מיקום אמיתי (הגיאולוקציה האמיתית של המכשיר משמשת בארנק/עוד, לא
 * כאן). */
export default function NearbyScreen() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const shown = PLACES.filter((p) => filter === "all" || p.category === filter);
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
            <HeartIcon size={17} />
          </Card>
        ))}
      </div>
      <PrimaryButton>שמור לתוכנית הטיול</PrimaryButton>
    </ScreenShell>
  );
}
