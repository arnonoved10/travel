import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Heebo } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "../components/service-worker-registration";
import { AIAssistant } from "./ai-assistant";

const heebo = Heebo({
  subsets: ["latin", "hebrew"],
  variable: "--font-heebo",
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body>
        <ServiceWorkerRegistration />
        {children}
        <AIAssistant />
      </body>
    </html>
  );
}
