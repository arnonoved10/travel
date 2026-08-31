export interface RainWindowHourlyPoint {
  forecastAt: string;
  precipitationProbabilityPercent: number | null;
}

export interface RainWindow {
  startAt: string;
  endAt: string;
  maxProbabilityPercent: number;
}

/**
 * מזקק תחזית שעתית (הסתברות-לגשם-לפי-שעה) ל"חלונות גשם" רציפים — למשל
 * "14:00–16:00" במקום להציג למשתמש טבלה של 8 מספרים שהוא צריך לפרש בעצמו.
 * פונקציה טהורה, לא ממציאה כלום — קלט/פלט הם רק הנתונים שכבר קיימים
 * בתחזית האמיתית מהספק (Open-Meteo).
 */
export function computeRainWindows(hourly: RainWindowHourlyPoint[], thresholdPercent = 50): RainWindow[] {
  const sorted = [...hourly].sort((a, b) => a.forecastAt.localeCompare(b.forecastAt));
  const windows: RainWindow[] = [];
  let current: RainWindow | null = null;

  for (const point of sorted) {
    const probability = point.precipitationProbabilityPercent;
    if (probability !== null && probability >= thresholdPercent) {
      if (current) {
        current.endAt = point.forecastAt;
        current.maxProbabilityPercent = Math.max(current.maxProbabilityPercent, probability);
      } else {
        current = { startAt: point.forecastAt, endAt: point.forecastAt, maxProbabilityPercent: probability };
      }
    } else if (current) {
      windows.push(current);
      current = null;
    }
  }
  if (current) windows.push(current);

  return windows;
}
