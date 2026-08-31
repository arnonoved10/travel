import { BlockedIntegrationState } from "@/components/blocked-state";

export function TokenMissingPanel() {
  return (
    <BlockedIntegrationState
      title="מפת ה-Demo עדיין לא מחוברת"
      description="מסך זה בונה מפה תלת-ממדית אמיתית עם Mapbox GL JS (Standard style) — לא תמונה מדומה. כדי שהיא תרנדר בפועל צריך NEXT_PUBLIC_MAPBOX_TOKEN אמיתי בקובץ apps/web/.env.local."
      steps={[
        <>
          פתח חשבון חינמי ב-
          <a href="https://account.mapbox.com/auth/signup/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
            {" "}
            account.mapbox.com
          </a>
        </>,
        "העתק את ה-Public Token שלך (לא ה-Secret Token)",
        "הדבק אותו בתור ערך NEXT_PUBLIC_MAPBOX_TOKEN ב-apps/web/.env.local והפעל מחדש את שרת הפיתוח",
      ]}
      footnote="טייר חינמי: עד 50,000 טעינות מפה בחודש. אחרי זה — תמחור מדורג לפי נפח (ראה mapbox.com/pricing)."
    />
  );
}
