import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Rubik } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { OfflineBanner } from "@/components/offline-banner";
import { ThemeProvider } from "@/components/theme-provider";
import { PreferencesProvider } from "@/components/preferences-provider";
import { ToastProvider } from "@/components/toast-provider";
import { THEME_STORAGE_KEY } from "@/lib/theme/types";

// Rubik: chosen for full Hebrew+Latin glyph coverage with a modern geometric feel close
// to the reference mockup — Inter/Poppins-style fonts have no Hebrew glyphs at all, which
// matters here since the whole app is RTL Hebrew (see DECISIONS.md, "Redesign יסודי שני").
const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: "מערכת ניהול טיולים",
  description: "מערכת ניהול טיולים אישית",
  manifest: "/manifest.json",
};

// Runs before hydration so the correct theme is painted on first frame — a useEffect would
// run after paint and flash the default theme. Kept as plain JS (no TS/import) since it
// executes as a raw inline <script>, and duplicates ThemeProvider's resolution logic on
// purpose — including the "dark" fallback below, which MUST stay in sync with
// DEFAULT_THEME_PREFS.mode (lib/theme/types.ts). They drifted once already: this script's
// literal "auto" fallback silently overrode the dark-default fix until caught.
const themeInitScript = `(function () {
  try {
    var raw = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var prefs = raw ? JSON.parse(raw) : {};
    var mode = prefs.mode || "dark";
    var resolved = mode === "auto"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : mode;
    var root = document.documentElement;
    root.setAttribute("data-theme", resolved);
    root.setAttribute("data-accent", prefs.accent || "purple");
    root.setAttribute("data-brightness", prefs.brightness || "normal");
    root.setAttribute("data-density", prefs.density || "comfortable");
    root.setAttribute("data-rounded", String(prefs.roundedCorners !== false));
    root.setAttribute("data-animations", String(prefs.animations !== false));
    root.setAttribute("data-contrast", prefs.contrast || "normal");
    root.setAttribute("data-text-size", prefs.textSize || "normal");
    if (prefs.accent === "custom" && prefs.customAccentHex) {
      root.style.setProperty("--color-primary", prefs.customAccentHex);
      root.style.setProperty("--color-primary-hover", prefs.customAccentHex);
    }
  } catch (e) {}
})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning className={rubik.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      {/* data-gramm וכו' — מבקש מתוסף Grammarly (אם מותקן בדפדפן) לא להזריק
          DOM לתוך העמוד. בלי זה, ההזרקה שלו בין ה-render בשרת לבין ה-hydration
          בלקוח גורמת ל"Hydration failed"/"parentNode" אמיתיים בקונסול — לא
          קשור לקוד של האפליקציה, אבל אפשר למנוע אותו מהצד שלנו. */}
      <body suppressHydrationWarning data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false">
        <ThemeProvider>
          <PreferencesProvider>
            <ToastProvider>
              <ServiceWorkerRegistration />
              <OfflineBanner />
              {children}
            </ToastProvider>
          </PreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
