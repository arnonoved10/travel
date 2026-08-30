import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Rubik } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "../components/service-worker-registration";

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trip Master — Design Preview",
  description: "גרסת-תצוגה מבודדת של עיצוב האפליקציה — נתונים מקומיים בלבד, לא מחוברת ל-Supabase או לאפליקציה האמיתית.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#050f24",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={rubik.variable}>
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
