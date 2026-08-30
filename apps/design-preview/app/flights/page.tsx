"use client";

import { useState } from "react";
import { ScreenShell, PageTitle, PillTabs, Card, PrimaryButton, SecondaryButton, Money, COLOR, SPACE } from "../design-system";

const TABS = [
  { key: "upcoming" as const, label: "הבאים" },
  { key: "past" as const, label: "קודמות" },
];

/** מסך "טיסות" (15) — נתוני-דמו מוצהרים; אין חיבור לספק-טיסות אמיתי. */
export default function FlightsScreen() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  return (
    <ScreenShell>
      <PageTitle title="טיסות" />
      <PillTabs options={TABS} value={tab} onChange={setTab} />

      {tab === "upcoming" ? (
        <>
          <Card style={{ textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>הטיסה הבאה TLV → NRT</div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: COLOR.textPrimary, marginTop: "4px" }}>03:45:12</div>
          </Card>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACE.md }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>אל על LY80</span>
              <span style={{ fontSize: "11px", color: COLOR.success, fontWeight: 700 }}>אושר</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: COLOR.textPrimary }}>TLV</div>
                <div style={{ fontSize: "10.5px", color: COLOR.textSecondary }}>14:25 · 15/06</div>
              </div>
              <div style={{ flex: 1, textAlign: "center", fontSize: "11px", color: COLOR.textSecondary }}>✈</div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: COLOR.textPrimary }}>NRT</div>
                <div style={{ fontSize: "10.5px", color: COLOR.textSecondary }}>07:45 · 16/06</div>
              </div>
            </div>
            <div style={{ marginTop: SPACE.md, display: "flex", gap: SPACE.md, fontSize: "11px", color: COLOR.textSecondary }}>
              <span>טרמינל 3</span>
              <span>נוסעים: 2</span>
            </div>
          </Card>

          <div style={{ display: "flex", gap: SPACE.sm }}>
            <SecondaryButton>צ'ק-אין אונליין</SecondaryButton>
            <PrimaryButton>הוסף לטיול</PrimaryButton>
          </div>
        </>
      ) : (
        <Card style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: "12.5px" }}>אין טיסות קודמות להצגה</Card>
      )}
    </ScreenShell>
  );
}
