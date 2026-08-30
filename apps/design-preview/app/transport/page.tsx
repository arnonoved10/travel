"use client";

import { ScreenShell, ScreenHeader, Card, Badge, DangerButton, SecondaryButton, PhoneIcon, CarIcon, COLOR, SPACE } from "../design-system";

/**
 * מסך "הסעה ותחבורה" (14) — נתוני-דמו מוצהרים (נהג/רכב/כתובת-איסוף);
 * אין באפליקציה שירות-הסעות חי לחבר אליו.
 */
export default function TransportScreen() {
  return (
    <ScreenShell>
      <ScreenHeader title="הסעה ותחבורה" />
      <Badge tone="warning">בדרך לאיסוף</Badge>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>הנהג יגיע בעוד</div>
        <div style={{ fontSize: "34px", fontWeight: 700, color: COLOR.textPrimary }}>08:45</div>
      </div>

      <Card style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: COLOR.cardElevated }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary }}>יוקי טנאקה</div>
          <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>4.9 ★★★★★</div>
        </div>
        <button type="button" style={{ width: "40px", height: "40px", borderRadius: "50%", background: COLOR.primary, border: "none", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="התקשרות">
          <PhoneIcon color="#fff" />
        </button>
      </Card>

      <Card style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
        <CarIcon />
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>טויוטה אלפארד שחור</div>
          <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>あ 12-34</div>
        </div>
      </Card>

      <div style={{ height: "140px", borderRadius: "16px", background: COLOR.cardElevated, border: `1px solid ${COLOR.border}` }} />

      <div style={{ display: "flex", gap: SPACE.sm }}>
        <DangerButton>בטל הזמנה</DangerButton>
        <SecondaryButton>צור קשר עם הנהג</SecondaryButton>
      </div>
    </ScreenShell>
  );
}
