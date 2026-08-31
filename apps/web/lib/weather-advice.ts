import type { WeatherForecastSnapshot } from "@travel-app/shared-types";

/**
 * המלצות תיק יומי/לבוש/אזהרת גשם לאופנוע — כולן נגזרות מנתוני מזג אוויר
 * אמיתיים בלבד (WeatherForecastSnapshot שהגיע מהספק). אין כאן שום ניחוש של
 * הנתונים עצמם — רק תרגום של מספרים אמיתיים להמלצה טקסטואלית.
 */
export function getWeatherAdvice(current: Omit<WeatherForecastSnapshot, "id" | "retrievedAt">): string[] {
  const advice: string[] = [];

  if (current.precipitationProbabilityPercent !== null && current.precipitationProbabilityPercent >= 50) {
    advice.push("☔ סיכוי גבוה לגשם — כדאי לקחת מטריה או מעיל גשם.");
    advice.push("🏍️ נוסעים באופנוע/קטנוע? יש סיכוי גבוה לגשם היום — שקלו חלופה או ציוד מתאים.");
  }

  const feelsLike = current.feelsLikeC ?? current.temperatureC;
  if (feelsLike !== null) {
    if (feelsLike >= 32) {
      advice.push("🥵 חם מאוד — בגדים קלים, כובע, ושתייה מרובה.");
    } else if (feelsLike <= 15) {
      advice.push("🧥 קריר — כדאי שכבה חמה נוספת.");
    }
  }

  if (current.uvIndex !== null && current.uvIndex >= 8) {
    advice.push("🕶️ קרינת UV גבוהה — קרם הגנה, כובע ומשקפי שמש.");
  }

  if (current.windSpeedKph !== null && current.windSpeedKph >= 40) {
    advice.push("💨 רוחות חזקות היום.");
  }

  return advice;
}
