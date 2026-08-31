import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getFinanceRepository, getTripRepository, getUserRepository, isDemoMode } from "@travel-app/data-layer";
import { AppShell } from "@/components/ui/AppShell";
import type { SidebarGroup } from "@/components/ui/Sidebar";
import { getActiveTrip } from "@/lib/active-trip";

// עודכן 2026-08-28 (בקשת משתמש: "מה צריך להוריד... שיהיה מובן ומסודר"):
// "עכשיו" מוזג לתוך "היום שלי" (חפיפה כבדה, ר' apps/web/app/(app)/today/page.tsx),
// ו-4 עמודי-רשימה גלובליים כמעט-זהים (אנשי-קשר/כרטיסי-תשלום/נקודות-מיילים/
// חשבונות-חיצוניים) התאחדו לפריט אחד ("אנשי קשר ופרטים", טאבים בתוך /contacts).
function buildSidebarGroups(walletItem: { href: string; label: string; emoji: string } | null): SidebarGroup[] {
  return [
    {
      title: "סקירה",
      items: [
        { href: "/dashboard", label: "דשבורד" },
        ...(walletItem ? [walletItem] : []),
        { href: "/stats", label: "סטטיסטיקות" },
        { href: "/today", label: "היום שלי" },
        { href: "/emergency", label: "חירום" },
      ],
    },
    {
      title: "טיולים",
      items: [
        { href: "/trips", label: "טיולים" },
        { href: "/map", label: "מפה" },
        { href: "/places", label: "מקומות" },
        { href: "/contacts", label: "אנשי קשר ופרטים" },
        { href: "/share-inbox", label: "תיבת שיתופים" },
        { href: "/trash", label: "פח" },
      ],
    },
  ];
}

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // שער-הדרכה: כל מסך מחובר עובר דרך ה-layout הזה, אז זה המקום היחיד
  // שצריך את הבדיקה — לא נוגעים בכל מסך בנפרד. /onboarding עצמו נמצא
  // מחוץ ל-(app), אז אין כאן סיכון ל-redirect loop.
  const userRepository = await getUserRepository();
  const { onboardingCompletedAt } = await userRepository.getOnboardingStatus({ userId: user.id });
  if (!onboardingCompletedAt) {
    redirect("/onboarding");
  }

  const tripRepository = await getTripRepository();
  const trips = await tripRepository.list({ userId: user.id });
  const today = getTodayIsoDate();
  const activeTrip = getActiveTrip(trips, today);

  // ארנק בסיידבר, בין "דשבורד" ל"סטטיסטיקות" — לבקשת משתמש מפורשת (מיקום
  // מדויק לפי שיחה: "יש רשימה של דשבורד ואחריו סטטיסטיקה אז לשים בינהם").
  // wallets[0] כ"ארנק ראשי" — אותה קונבנציה בדיוק כמו StatCard "יתרת ארנק"
  // בדשבורד (ר' dashboard/page.tsx).
  let walletItem: { href: string; label: string; emoji: string; prefetch: boolean } | null = null;
  if (activeTrip) {
    const financeRepository = await getFinanceRepository();
    const wallets = await financeRepository.listWallets({ tripId: activeTrip.trip.id });
    const primaryWallet = wallets[0] ?? null;
    if (primaryWallet) {
      // #wallet, לא #finances — "ארנק" הוא <details> סגור-בברירת-מחדל מקונן
      // בתוך סקשן #finances (ר' trips/[tripId]/page.tsx, BookingGroup id="wallet").
      // OpenDetailsFromHash פותח <details> רק כשה-hash תואם-בדיוק את ה-id שלו,
      // אז #finances היה נוחת בראש הסקשן בלי לפתוח את האקורדיון בפועל.
      walletItem = {
        href: `/trips/${activeTrip.trip.id}#wallet`,
        label: `ארנק · ${primaryWallet.currentBalance.toLocaleString("he-IL")} ${primaryWallet.currencyCode}`,
        emoji: "💰",
        // prefetch:false — קריטי: הסיידבר קבוע-נראה בכל עמוד באפליקציה, אז
        // בלי זה Next.js היה מבצע prefetch לעמוד-הטיול הכבד הזה (עשרות
        // שאילתות-DB במקביל, ר' trips/[tripId]/page.tsx) מחדש בכל ניווט לכל
        // עמוד — לא רק בלחיצה בפועל. זוהה מלוגים אמיתיים: /trips/{id} נטען
        // חוזר-ונשנה בכל מעבר-עמוד (דשבורד/סטטיסטיקות/וכו'), בדיוק בתבנית של
        // prefetch-אוטומטי, וייתכן שזה מה שגרם ל"העמוד לא נטען" בדפדפן.
        prefetch: false,
      };
    }
  }

  return (
    <AppShell
      sidebarGroups={buildSidebarGroups(walletItem)}
      activeTripId={activeTrip?.trip.id ?? null}
      activeTripName={activeTrip?.trip.name ?? null}
      isDemoMode={isDemoMode()}
      userLabel={user.email}
    >
      {children}
    </AppShell>
  );
}
