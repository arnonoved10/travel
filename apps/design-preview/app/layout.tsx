import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Assistant } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "../components/service-worker-registration";
import { AIAssistantGate } from "./ai-assistant-gate";

const assistant = Assistant({
  subsets: ["latin", "hebrew"],
  variable: "--font-assistant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trip Master — Design Preview",
  description: "גרסת-תצוגה מבודדת של עיצוב האפליקציה — נתונים מקומיים בלבד, לא מחוברת ל-Supabase או לאפליקציה האמיתית.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#020D1F",
  width: "device-width",
  initialScale: 1,
};

// ברירת-המחדל של Vercel (כ-10 שניות) נמצאה קצרה מדי בפועל ל"קור" ראשוני
// של פונקציית-שרת (cold start) בשילוב עם קריאת server action ל-API חיצוני
// איטי — נצפה ישירות: מזג-האוויר נכשל באופן לא-עקבי מיד אחרי דיפלוי חדש
// (הקריאה הראשונה מ-app/actions.ts), אך תמיד הצליח ברגע שהפונקציה כבר
// "חמה". route segment config כאן ב-layout השורש חל על כל server action
// שנקרא מכל מסך תחתיו — לא ניתן להגדיר את זה בקובץ "use server" עצמו
// (שם מותר לייצא רק פונקציות async).
export const maxDuration = 30;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={assistant.variable}>
      <body>
        <ServiceWorkerRegistration />
        {children}
        <AIAssistantGate />
      </body>
    </html>
  );
}
