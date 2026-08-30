"use client";

import { useState } from "react";
import { ScreenShell, ScreenHeader, PillTabs, Card, PrimaryButton, SecondaryButton, CarIcon, ScooterIcon, COLOR, SPACE } from "../design-system";

const TABS = [
  { key: "car" as const, label: "רכב" },
  { key: "scooter" as const, label: "קטנוע" },
];

/** מסך "השכרת רכב וקטנוע" (36) — נתוני-דמו מוצהרים; אין חיבור לספק-
 * השכרה אמיתי. */
export default function RentalScreen() {
  const [tab, setTab] = useState<"car" | "scooter">("car");
  return (
    <ScreenShell>
      <ScreenHeader title="השכרת רכב וקטנוע" />
      <PillTabs options={TABS} value={tab} onChange={setTab} />

      <Card style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
        <div style={{ width: "64px", height: "48px", borderRadius: "10px", background: COLOR.cardElevated, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {tab === "car" ? <CarIcon size={28} /> : <ScooterIcon size={28} />}
        </div>
        <div>
          <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary }}>{tab === "car" ? "Toyota Yaris Hybrid" : "Honda PCX 150"}</div>
          <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>{tab === "car" ? "Economy · אוטומטי" : "125cc · אוטומטי"} · Hertz</div>
        </div>
      </Card>

      <Card>
        <Row label="איסוף" value="28/05/2025" />
        <Row label="החזרה" value="04/06/2025" />
        <Row label="מיקום איסוף" value="Rome Fiumicino Airport (FCO)" />
        <Row label="פיקדון" value="€300" />
        <Row label="ביטוח" value="Full Coverage" last />
      </Card>

      <div style={{ display: "flex", gap: SPACE.sm }}>
        <SecondaryButton>נווט למיקום איסוף</SecondaryButton>
        <PrimaryButton>סמן כפעיל</PrimaryButton>
      </div>
    </ScreenShell>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: last ? "none" : `1px solid ${COLOR.border}` }}>
      <span style={{ fontSize: "12px", color: COLOR.textSecondary }}>{label}</span>
      <span style={{ fontSize: "12.5px", fontWeight: 600, color: COLOR.textPrimary }}>{value}</span>
    </div>
  );
}
