// מספרי חירום כלליים לפי מדינה — נתון ידני מתוחזק, לא ממקור API חי. אלה
// מספרים ציבוריים ויציבים (לא צפויים להשתנות), אבל בכל זאת יש להציג אותם
// בכנות כ"כללי, לבדוק מול המקור הרשמי" — לא כמידע רשמי מאומת בזמן אמת.
// ראה IMPLEMENTATION_GAPS.md P0 סעיף 14 (Emergency Screen).
export interface CountryEmergencyNumbers {
  country: string;
  police: string;
  ambulance: string;
  fire: string;
  notes?: string;
}

export const EMERGENCY_NUMBERS_BY_COUNTRY: Record<string, CountryEmergencyNumbers> = {
  תאילנד: { country: "תאילנד", police: "191", ambulance: "1669", fire: "199", notes: "תיירים: משטרת תיירים 1155" },
  ישראל: { country: "ישראל", police: "100", ambulance: "101", fire: "102" },
  ארהב: { country: "ארה״ב", police: "911", ambulance: "911", fire: "911" },
  "ארצות הברית": { country: "ארצות הברית", police: "911", ambulance: "911", fire: "911" },
  בריטניה: { country: "בריטניה", police: "999", ambulance: "999", fire: "999", notes: "לא דחוף: 101" },
  צרפת: { country: "צרפת", police: "17", ambulance: "15", fire: "18", notes: "כללי אירופי: 112" },
  גרמניה: { country: "גרמניה", police: "110", ambulance: "112", fire: "112" },
  איטליה: { country: "איטליה", police: "113", ambulance: "118", fire: "115" },
  ספרד: { country: "ספרד", police: "091", ambulance: "112", fire: "112" },
  יוון: { country: "יוון", police: "100", ambulance: "166", fire: "199" },
};

export const DEFAULT_EMERGENCY_NUMBERS: CountryEmergencyNumbers = {
  country: "כללי",
  police: "112",
  ambulance: "112",
  fire: "112",
  notes: "112 עובד כמספר חירום כללי ברוב מדינות אירופה ובחלק ניכר מהעולם — לבדוק מול משרד החוץ הישראלי לפני הנסיעה.",
};

export function getEmergencyNumbersForCountry(country: string | null): CountryEmergencyNumbers {
  if (!country) return DEFAULT_EMERGENCY_NUMBERS;
  return EMERGENCY_NUMBERS_BY_COUNTRY[country.trim()] ?? DEFAULT_EMERGENCY_NUMBERS;
}
