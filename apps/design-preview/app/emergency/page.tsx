"use client";

import { ScreenShell, ScreenHeader, Card, PrimaryButton, Ltr, PhoneIcon, COLOR, SPACE } from "../design-system";

const LOCAL_NUMBERS = [
  { label: "חירום כללי", number: "112" },
  { label: "מגן דוד אדום", number: "118" },
  { label: "משטרה", number: "113" },
];

const CONTACTS = [
  { label: "מרכז סיוע 24/7", phone: "+972 3 123 4567" },
  { label: 'ד"ר רון כהן', phone: "+39 333 123 4567" },
  { label: "מקום לינה — NH Collection", phone: "+39 06 1234 5678" },
];

/** מסך "אנשי קשר לחירום" (33) — מספרי-חירום כלליים לתיירים ביפן/איטליה
 * (ציבוריים, לא ספציפיים-למשתמש) + אנשי-קשר מדמו הפרופיל/ההזמנות. */
export default function EmergencyScreen() {
  return (
    <ScreenShell>
      <ScreenHeader title="אנשי קשר לחירום" action={<PhoneIcon />} />

      <div style={{ background: `${COLOR.danger}1A`, border: `1px solid ${COLOR.danger}55`, borderRadius: "16px", padding: SPACE.md, fontSize: "12px", fontWeight: 700, color: COLOR.danger, textAlign: "center" }}>
        חירום — מספרי חירום מקומיים
      </div>

      <div style={{ display: "flex", gap: SPACE.sm }}>
        {LOCAL_NUMBERS.map((n) => (
          <a key={n.number} href={`tel:${n.number}`} style={{ flex: 1, textDecoration: "none" }}>
            <Card style={{ textAlign: "center", borderColor: `${COLOR.danger}55` }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: COLOR.danger }}>{n.number}</div>
              <div style={{ fontSize: "10.5px", color: COLOR.textSecondary, marginTop: "4px" }}>{n.label}</div>
            </Card>
          </a>
        ))}
      </div>

      <div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>אנשי קשר חשובים</div>
        <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
          {CONTACTS.map((c) => (
            <Card key={c.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>{c.label}</div>
                <div style={{ fontSize: "11px", color: COLOR.textSecondary }}><Ltr text={c.phone} /></div>
              </div>
              <a href={`tel:${c.phone}`} aria-label="התקשרות" style={{ width: "36px", height: "36px", borderRadius: "50%", background: COLOR.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PhoneIcon color="#fff" size={16} />
              </a>
            </Card>
          ))}
        </div>
      </div>

      <PrimaryButton>שיתוף מיקום נוכחי</PrimaryButton>
    </ScreenShell>
  );
}
