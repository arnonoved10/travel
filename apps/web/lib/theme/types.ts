export type ThemeMode = "dark" | "light" | "auto";
export type ThemeAccent = "purple" | "blue" | "cyan" | "green" | "orange" | "gold" | "pink" | "custom";
export type ThemeBrightness = "dim" | "normal" | "bright";
export type ThemeDensity = "compact" | "comfortable" | "spacious";
export type ThemeContrast = "normal" | "high";
export type ThemeTextSize = "normal" | "large";

export interface ThemePrefs {
  mode: ThemeMode;
  accent: ThemeAccent;
  customAccentHex: string;
  brightness: ThemeBrightness;
  density: ThemeDensity;
  roundedCorners: boolean;
  animations: boolean;
  contrast: ThemeContrast;
  textSize: ThemeTextSize;
}

export const DEFAULT_THEME_PREFS: ThemePrefs = {
  // "dark", לא "auto" — בקשת משתמש מפורשת: "העיצוב הכהה צריך להיות ברירת
  // המחדל של המסך". עם "auto", משתמש שה-OS/דפדפן שלו מוגדר-בהיר (נפוץ ב-
  // Windows כברירת-מחדל) היה רואה את כל האפליקציה בפלטה הבהירה תמיד, בלי
  // קשר לאיכות-ההתאמה של הרכיבים לעיצוב-הכהה של המוקאפ — זו הייתה הסיבה
  // האמיתית ש"הכל נראה בהיר" למרות שהקוד כבר בנוי עם טוקנים כהים. עדיין
  // ניתן-לשינוי-ידני ב-הגדרות (ThemeSwitcher) — זו רק ברירת-המחדל למשתמש חדש.
  mode: "dark",
  accent: "purple",
  customAccentHex: "#8b5cf6",
  brightness: "normal",
  density: "comfortable",
  roundedCorners: true,
  animations: true,
  contrast: "normal",
  textSize: "normal",
};

export const THEME_ACCENT_PRESETS: { value: ThemeAccent; label: string; hex: string }[] = [
  { value: "purple", label: "סגול", hex: "#8b5cf6" },
  { value: "blue", label: "כחול", hex: "#3b82f6" },
  { value: "cyan", label: "טורקיז", hex: "#06b6d4" },
  { value: "green", label: "ירוק", hex: "#22c55e" },
  { value: "orange", label: "כתום", hex: "#f97316" },
  { value: "gold", label: "זהב", hex: "#d4a017" },
  { value: "pink", label: "ורוד", hex: "#ec4899" },
];

// גרסה v2 — כשברירת-המחדל השתנתה מ-"auto" ל-"dark" (ר' DEFAULT_THEME_PREFS
// למעלה), כל localStorage שנשמר לפני-כן תחת המפתח הישן עדיין מכיל "auto"
// ומחזיר-את-אותה-בעיה בכל טעינה (matchMedia במחשב הזה מעדיף בהיר). מפתח
// חדש = ערכים ישנים פשוט לא נמצאים, נופלים לברירת-המחדל החדשה — בלי לגעת
// בקוד-הקריאה בכלל.
export const THEME_STORAGE_KEY = "trips-app:theme-prefs:v2";
