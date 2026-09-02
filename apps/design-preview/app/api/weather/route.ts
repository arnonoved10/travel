import { NextResponse } from "next/server";
import { openMeteoWeatherProvider } from "../../../lib/providers/open-meteo-provider";

/**
 * מזג-אוויר אמיתי (Open-Meteo) — Route Handler רגיל, לא server action.
 * נמצא ונתפס בבדיקה מול production: אותה קריאה בדיוק, מול אותו ספק, עובדת
 * באופן עקבי (100% מהניסיונות) כשקוראים לה כ-Route Handler רגיל, אך נכשלת
 * לעיתים קרובות (מוחזר null בלי חריגה) כש-getDemoWeatherAction נקראת
 * כ-server action מרכיב-לקוח — נראה ספציפי למנגנון-הזימון של server
 * actions ב-Vercel, לא לספק/לרשת/לקוד עצמו (אומת ישירות: getRatesToILS,
 * server action באותו קובץ ובאותה שיטה, לא נכשל אף פעם באותן בדיקות).
 * getDemoWeatherAction הוסרה מ-app/actions.ts לטובת המסלול הזה בלבד.
 */
const BANGKOK = { lat: 13.7563, lng: 100.5018 };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const coords = latParam && lngParam ? { lat: Number(latParam), lng: Number(lngParam) } : BANGKOK;

  try {
    const [current, daily, hourly] = await Promise.all([
      openMeteoWeatherProvider.getCurrentConditions(coords),
      openMeteoWeatherProvider.getDailyForecast(coords, { days: 1 }),
      openMeteoWeatherProvider.getHourlyForecast(coords, { hours: 6 }),
    ]);
    return NextResponse.json({
      temperatureC: current.temperatureC,
      feelsLikeC: current.feelsLikeC,
      minTemperatureC: daily[0]?.minTemperatureC ?? null,
      maxTemperatureC: daily[0]?.maxTemperatureC ?? null,
      condition: current.condition,
      precipitationProbabilityPercent: daily[0]?.precipitationProbabilityPercent ?? null,
      humidityPercent: current.humidityPercent,
      windSpeedKph: current.windSpeedKph,
      sunrise: daily[0]?.sunrise ?? null,
      sunset: daily[0]?.sunset ?? null,
      hourly: hourly.map((h) => ({ time: h.forecastAt, temperatureC: h.temperatureC, condition: h.condition, precipitationProbabilityPercent: h.precipitationProbabilityPercent })),
      provider: current.provider,
    });
  } catch {
    return NextResponse.json(null);
  }
}
