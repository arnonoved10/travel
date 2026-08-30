"use client";

import { ScreenShell, PageTitle, BottomNav, Card, Badge, CheckIcon, COLOR, SPACE } from "../design-system";

const URGENT = [
  { id: "n1", title: "גשם חזק צפוי", body: "ברצלונה, ספרד — גשם כבד ורוחות חזקות צפויים בימים הקרובים.", tone: "warning" as const },
  { id: "n2", title: "שינוי בשעת הטיסה", body: "טיסה LY80 תל אביב → טוקיו הוקדמה ל-14:30.", tone: "warning" as const },
];
const EARLIER = [
  { id: "n3", title: "ההזמנה אושרה", body: "מלון NH Collection רומא", tone: "success" as const },
  { id: "n4", title: "תזכורת תחבורה", body: "הסעה משדה התעופה בעוד שעתיים", tone: "primary" as const },
];

/** מסך "מרכז ההתראות" (30) — נתוני-דמו מוצהרים; אין שירות-Push אמיתי
 * מחובר במסך הזה (יש מנגנון push אמיתי באפליקציה האמיתית, לא כאן). */
export default function NotificationsScreen() {
  return (
    <ScreenShell>
      <PageTitle title="מרכז ההתראות" right={<Badge tone="danger">{URGENT.length}</Badge>} />

      <div>
        <div style={{ fontSize: "12.5px", fontWeight: 700, color: COLOR.danger, marginBottom: SPACE.sm }}>דחופות · היום</div>
        <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
          {URGENT.map((n) => (
            <Card key={n.id} style={{ borderColor: `${COLOR.warning}55` }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>{n.title}</div>
              <div style={{ fontSize: "11.5px", color: COLOR.textSecondary, marginTop: "2px" }}>{n.body}</div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: "12.5px", fontWeight: 700, color: COLOR.textSecondary, marginBottom: SPACE.sm }}>קודם לכן</div>
        <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
          {EARLIER.map((n) => (
            <Card key={n.id} style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
              <CheckIcon color={n.tone === "success" ? COLOR.success : COLOR.primaryLight} />
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>{n.title}</div>
                <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>{n.body}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <BottomNav active="notifications" />
    </ScreenShell>
  );
}
