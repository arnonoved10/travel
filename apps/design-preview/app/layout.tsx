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
