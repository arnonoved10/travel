import type { WeatherForecastSnapshot } from "@travel-app/shared-types";

export type WeatherAlertSeverity = "info" | "warning";

export interface WeatherAlertItem {
  severity: WeatherAlertSeverity;
  title: string;
  detail: string;
  forecastAt: string;
}

type Snapshot = Omit<WeatherForecastSnapshot, "id" | "retrievedAt">;

const RAIN_PROBABILITY_THRESHOLD = 60;
const WIND_SPEED_THRESHOLD_KPH = 40;
const HEAT_THRESHOLD_C = 35;
const UV_THRESHOLD = 8;

/**
 * גוזר התראות מזג אוויר מנתוני תחזית אמיתיים בלבד (ספים על נתונים שכבר
 * הגיעו מהספק) — לא קורא ל-API בעצמו ולא ממציא אזהרה רשמית. ראה
 * IMPLEMENTATION_GAPS.md P0 סעיף 8 (Weather Alerts).
 */
export function detectWeatherAlerts(hourly: Snapshot[]): WeatherAlertItem[] {
  const alerts: WeatherAlertItem[] = [];

  for (const hour of hourly) {
    if (hour.precipitationProbabilityPercent !== null && hour.precipitationProbabilityPercent >= RAIN_PROBABILITY_THRESHOLD) {
      alerts.push({
        severity: "warning",
        title: "סיכוי גבוה לגשם",
        detail: `${hour.precipitationProbabilityPercent}% סיכוי לגשם בשעה ${new Date(hour.forecastAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`,
        forecastAt: hour.forecastAt,
      });
    }
    if (hour.windSpeedKph !== null && hour.windSpeedKph >= WIND_SPEED_THRESHOLD_KPH) {
      alerts.push({
        severity: "warning",
        title: "רוח חזקה",
        detail: `רוח של ${Math.round(hour.windSpeedKph)} קמ"ש בשעה ${new Date(hour.forecastAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`,
        forecastAt: hour.forecastAt,
      });
    }
    if (hour.temperatureC !== null && hour.temperatureC >= HEAT_THRESHOLD_C) {
      alerts.push({
        severity: "warning",
        title: "חום קיצוני",
        detail: `${Math.round(hour.temperatureC)}° בשעה ${new Date(hour.forecastAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`,
        forecastAt: hour.forecastAt,
      });
    }
    if (hour.uvIndex !== null && hour.uvIndex >= UV_THRESHOLD) {
      alerts.push({
        severity: "info",
        title: "קרינת UV גבוהה",
        detail: `מדד UV ${Math.round(hour.uvIndex)} — הגנה מהשמש מומלצת`,
        forecastAt: hour.forecastAt,
      });
    }
  }

  return alerts;
}

export interface ActivityRainAlert {
  activityId: string;
  activityName: string;
  plannedAt: string;
  precipitationProbabilityPercent: number;
}

/**
 * גשם צפוי בזמן פעילות מתוכננת — סוג ה-Alert שנדחה בכוונה מ-P0 כי היה מחובר
 * רק ל-RouteStop, לא ל-PlannedActivity (ראה IMPLEMENTATION_GAPS.md). הקורא
 * אחראי לשלוף את התחזית לכל פעילות (מקום+שעה) ולמצוא את השעה הקרובה ביותר —
 * הפונקציה כאן רק מיישמת את סף ה-60% על נתון שכבר הותאם, לא ניגשת ל-API.
 */
export function detectRainDuringActivities(
  activities: Array<{ id: string; name: string; plannedAt: string; forecastPrecipitationProbabilityPercent: number | null }>,
): ActivityRainAlert[] {
  return activities
    .filter((a) => a.forecastPrecipitationProbabilityPercent !== null && a.forecastPrecipitationProbabilityPercent >= RAIN_PROBABILITY_THRESHOLD)
    .map((a) => ({
      activityId: a.id,
      activityName: a.name,
      plannedAt: a.plannedAt,
      precipitationProbabilityPercent: a.forecastPrecipitationProbabilityPercent!,
    }));
}
