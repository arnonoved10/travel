import { QUICK_ADD_ICONS } from "@/components/nav-icons";
import { QuickAction } from "@/components/ui/QuickAction";
import { buildNavigateLinks } from "@/lib/navigate-links";
import { QuickAddPanelContent } from "@/components/quick-add-panel-content";
import { DashboardCard } from "./dashboard-card";

/** "פעולות מהירות" — כרטיס-ההוספה-המהירה עצמו (מלון/טיסה/הסעה/הוצאה/מקום/
 * המרת-מטבע, ר' quick-add-panel-content.tsx) ממוקם כאן, לא בכרטיס נפרד למעלה
 * (היה quick-add-card.tsx, הוסר) — לבקשת משתמש: "לאזור של הפלוס הייתי שם
 * את זה בדשבורד בפעולות מהירות". שתי הפעולות היחידות שהפאנל לא מכסה (סריקת-
 * קבלה, ניווט) נשארות כקישורים קומפקטיים מתחתיו — לא כפילות, אלא השלמה. */
export function QuickActionsRow({
  activeTripId,
  activeTripName,
  navigateTarget,
}: {
  activeTripId: string | null;
  activeTripName?: string | null;
  /** Coordinates of the place already used for weather (see page.tsx) — reused here so
   * "Navigate" points somewhere real instead of being decorative. */
  navigateTarget?: { lat: number | null; lng: number | null; address?: string | null };
}) {
  const navigateLinks = navigateTarget ? buildNavigateLinks(navigateTarget) : null;

  const actions = [
    // #expense-documents, לא #document-center — האחרון הוא רשימה-לקריאה-בלבד
    // של מסמכים שכבר קיימים; טופס-ההעלאה/סריקה עצמו נמצא ב-BookingGroup
    // (details סגור-בברירת-מחדל) עם id="expense-documents".
    { key: "scan", label: "סרוק קבלה", href: activeTripId ? `/trips/${activeTripId}#expense-documents` : "/trips", icon: QUICK_ADD_ICONS.scan },
    {
      key: "navigate",
      label: "נווט",
      href: navigateLinks?.googleMapsUrl ?? "/map",
      icon: QUICK_ADD_ICONS.navigate,
      external: Boolean(navigateLinks?.googleMapsUrl),
    },
  ];

  return (
    <DashboardCard title="➕ פעולות מהירות">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <QuickAddPanelContent activeTripId={activeTripId} activeTripName={activeTripName} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-2)" }}>
          {actions.map((action) => (
            <QuickAction key={action.key} href={action.href} label={action.label} icon={action.icon} external={action.external} />
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
