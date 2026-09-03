"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenShell, PageTitle, PillTabs, Card, PrimaryButton, SecondaryButton, Money, COLOR, SPACE } from "../design-system";
import { saveActivity } from "../trip-content";
import { nextId } from "../wallet-data";
import { currentScopeTripId } from "../trips-data";

const TABS = [
  { key: "upcoming" as const, label: "הבאים" },
  { key: "past" as const, label: "קודמות" },
];

/** מסך "טיסות" (15) — נתוני-דמו מוצהרים; אין חיבור לספק-טיסות אמיתי. */
export default function FlightsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [notice, setNotice] = useState<string | null>(null);
  const [addedToTrip, setAddedToTrip] = useState(false);

  function handleAddToTrip() {
    saveActivity(currentScopeTripId(), "2025-06-15", { id: nextId("act"), time: "14:25", durationLabel: "17:20 שעות", title: "טיסת אל על LY80 · TLV → NRT", category: "עוד", location: "נמל התעופה בן גוריון, טרמינל 3", notes: "נוסעים: 2" });
    setAddedToTrip(true);
    setTimeout(() => router.push("/planner"), 600);
  }

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
            <SecondaryButton onClick={() => setNotice("צ'ק-אין אונליין אינו זמין בהדגמה זו — אין חיבור לספק-טיסות אמיתי")}>צ'ק-אין אונליין</SecondaryButton>
            <PrimaryButton onClick={handleAddToTrip} disabled={addedToTrip}>{addedToTrip ? "נוסף ליומן ✓" : "הוסף לטיול"}</PrimaryButton>
          </div>
          {notice ? <div style={{ fontSize: "11.5px", color: COLOR.textSecondary, textAlign: "center" }}>{notice}</div> : null}
        </>
      ) : (
        <Card style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: "12.5px" }}>אין טיסות קודמות להצגה</Card>
      )}
    </ScreenShell>
  );
}
