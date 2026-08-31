// העדפות אפליקציה פונקציונליות — נפרד במכוון מ-ThemePrefs (עיצוב חזותי).
// נשמר ב-localStorage כמו Theme, כי אין עדיין Supabase לשמירת העדפות משתמש
// בצד שרת. ראה IMPLEMENTATION_GAPS.md P1 סעיף 8 (Preferences).
export type NavigationApp = "google_maps" | "waze" | "apple_maps";
export type MapStyleName = "standard_3d" | "satellite" | "street";
export type WeatherUnit = "celsius" | "fahrenheit";
export type DistanceUnit = "km" | "miles";
export type TimeFormat = "24h" | "12h";

export interface AppPreferences {
  defaultHomeCurrency: string;
  defaultNavigationApp: NavigationApp;
  defaultMapStyle: MapStyleName;
  defaultWeatherUnit: WeatherUnit;
  defaultDistanceUnit: DistanceUnit;
  defaultTimeFormat: TimeFormat;
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  defaultHomeCurrency: "ILS",
  defaultNavigationApp: "google_maps",
  defaultMapStyle: "standard_3d",
  defaultWeatherUnit: "celsius",
  defaultDistanceUnit: "km",
  defaultTimeFormat: "24h",
};

export const NAVIGATION_APP_LABELS: Record<NavigationApp, string> = {
  google_maps: "Google Maps",
  waze: "Waze",
  apple_maps: "Apple Maps",
};

export const MAP_STYLE_LABELS: Record<MapStyleName, string> = {
  standard_3d: "תלת-ממד (ברירת מחדל)",
  satellite: "לוויין",
  street: "רחוב",
};

export const APP_PREFERENCES_STORAGE_KEY = "trips-app:app-preferences";
