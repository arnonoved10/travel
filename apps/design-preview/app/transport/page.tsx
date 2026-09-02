"use client";

import { useState } from "react";
import { ScreenShell, ScreenHeader, Card, Badge, DangerButton, SecondaryButton, Ltr, PhoneIcon, CarIcon, COLOR, SPACE } from "../design-system";

/**
 * מסך "הסעה ותחבורה" (14) — נתוני-דמו מוצהרים (נהג/רכב/כתובת-איסוף);
 * אין באפליקציה שירות-הסעות חי לחבר אליו. "בטל הזמנה" משנה בפועל את
 * הסטטוס המקומי (לא רק כפתור-דמו); "התקשרות"/"צור קשר" מציגים הודעה
 * כנה כי אין מספר-טלפון אמיתי בהדגמה הזו.
 */
export default function TransportScreen() {
  const [cancelled, setCancelled] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function handleCancel() {
    if (cancelled) return;
    if (confirm("לבטל את ההזמנה?")) {
      setCancelled(true);
      setNotice(null);
    }
  }

  return (
    <ScreenShell>
      <ScreenHeader title="הסעה ותחבורה" />
      <Badge tone={cancelled ? "danger" : "warning"}>{cancelled ? "ההזמנה בוטלה" : "בדרך לאיסוף"}</Badge>
      {!cancelled ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>הנהג יגיע בעוד</div>
          <div style={{ fontSize: "34px", fontWeight: 700, color: COLOR.textPrimary }}>08:45</div>
        </div>
      ) : null}

      <Card style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: COLOR.cardElevated }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary }}>יוקי טנאקה</div>
          <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>4.9 ★★★★★</div>
        </div>
        <button
          type="button"
          onClick={() => setNotice("מתקשר ליוקי טנאקה... (הדגמה בלבד, אין מספר טלפון אמיתי)")}
          style={{ width: "40px", height: "40px", borderRadius: "50%", background: COLOR.primary, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          aria-label="התקשרות"
        >
          <PhoneIcon color="#fff" />
        </button>
      </Card>

      <Card style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
        <CarIcon />
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>טויוטה אלפארד שחור</div>
          <div style={{ fontSize: "11px", color: COLOR.textSecondary }}><Ltr text="あ 12-34" /></div>
        </div>
      </Card>

      <div style={{ height: "140px", borderRadius: "16px", background: COLOR.cardElevated, border: `1px solid ${COLOR.border}` }} />

      {notice ? <div style={{ fontSize: "11.5px", color: COLOR.textSecondary, textAlign: "center" }}>{notice}</div> : null}

      {!cancelled ? (
        <div style={{ display: "flex", gap: SPACE.sm }}>
          <DangerButton onClick={handleCancel}>בטל הזמנה</DangerButton>
          <SecondaryButton onClick={() => setNotice("הודעה נשלחה ליוקי טנאקה (הדגמה בלבד)")}>צור קשר עם הנהג</SecondaryButton>
        </div>
      ) : null}
    </ScreenShell>
  );
}
