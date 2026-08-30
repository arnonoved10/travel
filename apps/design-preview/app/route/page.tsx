"use client";

import Link from "next/link";
import { Card, IconSlot, ScreenHeader, ScreenShell, StatusChip, BottomNav, COLOR } from "../shared";

/**
 * מסך מסלול (design-preview בלבד) — נתוני-דוגמה קבועים, לא מחובר ל-DB.
 * כל תחנה מקשרת למסך-היומן של היום הראשון שלה (drill-down אמיתי, לא רק
 * ויזואלי) — בדיקת-ניווט אמיתית בין שני המסכים החדשים.
 */

type StopStatus = "בוצע" | "מאושר" | "ממתין לאישור";

const STATUS_TONE: Record<StopStatus, "success" | "purple" | "warning"> = {
  בוצע: "success",
  מאושר: "purple",
  "ממתין לאישור": "warning",
};

const STOPS = [
  {
    city: "תל אביב",
    dates: "30 באפריל – 4 במאי",
    firstDay: "2026-04-30",
    status: "בוצע" as StopStatus,
    hotel: null as string | null,
    attractions: [] as string[],
    restaurants: [] as string[],
    travelToNext: "טיסה · כ-6 שעות",
  },
  {
    city: "בנגקוק",
    dates: "4 – 10 במאי",
    firstDay: "2026-05-04",
    status: "מאושר" as StopStatus,
    hotel: "[דמו] מלון סנטרל בבנגקוק",
    attractions: ["Wat Arun – מקדש השחר", "שוק ג'אטוצ'אק"],
    restaurants: ["Sirocco Sky Bar"],
    travelToNext: "הסעה פרטית · כשעתיים",
  },
  {
    city: "פטאיה",
    dates: "10 – 15 במאי",
    firstDay: "2026-05-10",
    status: "ממתין לאישור" as StopStatus,
    hotel: "Pattaya Beach Resort",
    attractions: ["חוף פטאיה", "שוק צף פֿ-פת"],
    restaurants: ["מסעדת דגים על החוף"],
    travelToNext: "רכבת · כשעה",
  },
  {
    city: "קוה צ'אנג",
    dates: "15 – 20 במאי",
    firstDay: "2026-05-15",
    status: "מאושר" as StopStatus,
    hotel: "Koh Chang Paradise Resort",
    attractions: ["מפל קלונג פלו", "צלילה באי"],
    restaurants: [],
    travelToNext: "מעבורת + הסעה · כ-4 שעות",
  },
  {
    city: "בנגקוק",
    dates: "20 – 22 ביוני",
    firstDay: "2026-06-20",
    status: "מאושר" as StopStatus,
    hotel: "[דמו] מלון סנטרל בבנגקוק",
    attractions: [],
    restaurants: [],
    travelToNext: null,
  },
];

function ActionButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 12px",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.06)",
        border: `1px solid ${COLOR.cardBorder}`,
        color: COLOR.textPrimary,
        fontSize: "11.5px",
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      <IconSlot size={15} />
      {label}
    </button>
  );
}

export default function RoutePreviewScreen() {
  return (
    <ScreenShell>
      <ScreenHeader title="מסלול הטיול" subtitle="[דמו] טיול לתאילנד · 5 תחנות" />

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <ActionButton label="הוסף תחנה" />
        <ActionButton label="שנה סדר תחנות" />
        <ActionButton label="מעבר למפה" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {STOPS.map((stop, i) => (
          <div key={`${stop.city}-${stop.firstDay}`} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <Link href={`/planner?day=${stop.firstDay}&city=${encodeURIComponent(stop.city)}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Card style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    <span
                      aria-hidden
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        background: "rgba(138,90,223,0.18)",
                        border: `1px solid ${COLOR.purple}55`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: COLOR.purple,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: "14px", color: "#fff" }}>{stop.city}</div>
                      <div style={{ fontSize: "11px", color: COLOR.textMuted }}>{stop.dates}</div>
                    </div>
                  </div>
                  <StatusChip label={stop.status} tone={STATUS_TONE[stop.status]} />
                </div>

                {stop.hotel ? (
                  <div style={{ fontSize: "12px", color: COLOR.textSecondary, marginBottom: "6px" }}>
                    🏨 {stop.hotel}
                  </div>
                ) : null}

                {stop.attractions.length > 0 || stop.restaurants.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "11.5px", color: COLOR.textSecondary }}>
                    {stop.attractions.map((a) => (
                      <div key={a}>· {a}</div>
                    ))}
                    {stop.restaurants.map((r) => (
                      <div key={r}>· {r} (מסעדה)</div>
                    ))}
                  </div>
                ) : null}
              </Card>
            </Link>

            {stop.travelToNext ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingInlineStart: "34px", fontSize: "11px", color: COLOR.textMuted }}>
                <span style={{ width: "1px", height: "14px", background: COLOR.cardBorder }} />
                {stop.travelToNext}
                <button
                  type="button"
                  style={{
                    marginInlineStart: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 9px",
                    borderRadius: "999px",
                    background: "rgba(138,90,223,0.14)",
                    border: `1px solid ${COLOR.purple}40`,
                    color: COLOR.purple,
                    fontSize: "10.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ניווט
                  <IconSlot size={12} />
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <BottomNav active="route" />
    </ScreenShell>
  );
}
