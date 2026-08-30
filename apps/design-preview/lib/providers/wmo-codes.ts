// מיפוי קודי WMO (World Meteorological Organization) שמשמש Open-Meteo לתיאור
// מצב מזג אוויר. הרשימה המלאה מתועדת ב-open-meteo.com/en/docs.
export function wmoCodeToCondition(code: number): { condition: string; icon: string } {
  const map: Record<number, { condition: string; icon: string }> = {
    0: { condition: "בהיר", icon: "☀️" },
    1: { condition: "בהיר בעיקר", icon: "🌤️" },
    2: { condition: "מעונן חלקית", icon: "⛅" },
    3: { condition: "מעונן", icon: "☁️" },
    45: { condition: "ערפל", icon: "🌫️" },
    48: { condition: "ערפל קפוא", icon: "🌫️" },
    51: { condition: "טפטוף קל", icon: "🌦️" },
    53: { condition: "טפטוף בינוני", icon: "🌦️" },
    55: { condition: "טפטוף כבד", icon: "🌧️" },
    56: { condition: "טפטוף קפוא קל", icon: "🌧️" },
    57: { condition: "טפטוף קפוא כבד", icon: "🌧️" },
    61: { condition: "גשם קל", icon: "🌧️" },
    63: { condition: "גשם בינוני", icon: "🌧️" },
    65: { condition: "גשם כבד", icon: "🌧️" },
    66: { condition: "גשם קפוא קל", icon: "🌧️" },
    67: { condition: "גשם קפוא כבד", icon: "🌧️" },
    71: { condition: "שלג קל", icon: "🌨️" },
    73: { condition: "שלג בינוני", icon: "🌨️" },
    75: { condition: "שלג כבד", icon: "❄️" },
    77: { condition: "גרגירי שלג", icon: "❄️" },
    80: { condition: "ממטרים קלים", icon: "🌦️" },
    81: { condition: "ממטרים בינוניים", icon: "🌧️" },
    82: { condition: "ממטרים עזים", icon: "⛈️" },
    85: { condition: "ממטרי שלג קלים", icon: "🌨️" },
    86: { condition: "ממטרי שלג כבדים", icon: "❄️" },
    95: { condition: "סופת רעמים", icon: "⛈️" },
    96: { condition: "סופת רעמים עם ברד קל", icon: "⛈️" },
    99: { condition: "סופת רעמים עם ברד כבד", icon: "⛈️" },
  };
  return map[code] ?? { condition: "לא ידוע", icon: "❓" };
}
