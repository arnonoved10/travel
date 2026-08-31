export interface PackingWeatherDayInput {
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  precipitationProbabilityPercent: number | null;
  uvIndex: number | null;
}

export interface PackingWeatherSuggestion {
  name: string;
  reason: string;
}

/**
 * מציע פריטי-אריזה לפי תחזית רב-יומית לטיול (טבלת-החלטה קבועה על גשם/חום/
 * קור/UV — לא מומצא ולא נשלף מ-API חיצוני כאן, רק מסכם ימים שכבר נשלפו).
 * הצעה בלבד — לא מוסיף כלום אוטומטית לרשימת האריזה.
 */
export function suggestPackingItemsForWeather(days: PackingWeatherDayInput[]): PackingWeatherSuggestion[] {
  const suggestions: PackingWeatherSuggestion[] = [];

  const maxPrecipitationProbabilityPercent = maxOf(days, (d) => d.precipitationProbabilityPercent);
  const maxTemperatureC = maxOf(days, (d) => d.maxTemperatureC);
  const minTemperatureC = minOf(days, (d) => d.minTemperatureC);
  const maxUvIndex = maxOf(days, (d) => d.uvIndex);

  if (maxPrecipitationProbabilityPercent !== null && maxPrecipitationProbabilityPercent >= 50) {
    suggestions.push({ name: "מטריה", reason: `סיכוי גבוה לגשם בטיול (עד ${Math.round(maxPrecipitationProbabilityPercent)}%)` });
    suggestions.push({ name: "מעיל גשם / ג'קט אטום למים", reason: "צפוי גשם באחד מימי הטיול" });
  }

  if (maxTemperatureC !== null && maxTemperatureC >= 30) {
    suggestions.push({ name: "כובע ומשקפי שמש", reason: `חום צפוי (עד ${Math.round(maxTemperatureC)}°)` });
    suggestions.push({ name: "בקבוק מים רב-פעמי", reason: "חום צפוי — חשוב להישאר שתויים" });
  }

  if (maxUvIndex !== null && maxUvIndex >= 6) {
    suggestions.push({ name: "קרם הגנה", reason: `מדד UV גבוה (עד ${Math.round(maxUvIndex)})` });
  }

  if (minTemperatureC !== null && minTemperatureC <= 12) {
    suggestions.push({ name: "שכבות חמות / סוודר", reason: `קור צפוי (עד ${Math.round(minTemperatureC)}°)` });
  }

  if (minTemperatureC !== null && minTemperatureC <= 5) {
    suggestions.push({ name: "מעיל חורף וכפפות", reason: `קור משמעותי צפוי (עד ${Math.round(minTemperatureC)}°)` });
  }

  return suggestions;
}

function maxOf<T>(items: T[], select: (item: T) => number | null): number | null {
  const values = items.map(select).filter((v): v is number => v !== null);
  return values.length === 0 ? null : Math.max(...values);
}

function minOf<T>(items: T[], select: (item: T) => number | null): number | null {
  const values = items.map(select).filter((v): v is number => v !== null);
  return values.length === 0 ? null : Math.min(...values);
}
