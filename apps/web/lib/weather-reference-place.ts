import type { HotelStay } from "@travel-app/shared-types";
import type { TripPlaceWithPlace } from "@travel-app/data-layer";

export interface WeatherReferencePlace {
  lat: number;
  lng: number;
  name: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
}

/** best-effort: המדינה היא בד"כ המקטע האחרון בכתובת-מפורמטת של גוגל (כשהחיפוש
 * ביקש languageCode "he" — ר' google-place-search.ts) — לא ניחוש-כתיב חכם,
 * ולא ודאי (למשל אם המשתמש הקליד כתובת ידנית בפורמט אחר). */
function countryFromAddress(address: string | null): string | null {
  if (!address) return null;
  const last = address.split(",").at(-1)?.trim();
  return last || null;
}

/**
 * "איפה נמצא הטיול" לצורך מזג-אוויר/שעון-עולם/דגל — קודם מקום מקושר (TripPlace,
 * הכי-אמין: יש לו city/country אמיתיים). בלעדיו, נופלים למלון-הראשון-בטיול עם
 * קואורדינטות — כדי שהזנת מלון (שכבר תופסת lat/lng אמיתיים דרך החיפוש) תפעיל
 * את שעון-היעד/הדגל מיד, בלי לחייב גם קישור-מקום נפרד באותו טיול.
 */
export function resolveWeatherReferencePlace(tripPlaces: TripPlaceWithPlace[], hotelStays: HotelStay[]): WeatherReferencePlace | null {
  const linkedPlace = tripPlaces.find((tp) => tp.place.lat !== null && tp.place.lng !== null)?.place;
  if (linkedPlace) {
    return { lat: linkedPlace.lat!, lng: linkedPlace.lng!, name: linkedPlace.name, city: linkedPlace.city, country: linkedPlace.country, address: linkedPlace.address };
  }

  const earliestHotelWithCoords = [...hotelStays].filter((h) => h.lat !== null && h.lng !== null).sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))[0];
  if (earliestHotelWithCoords) {
    return {
      lat: earliestHotelWithCoords.lat!,
      lng: earliestHotelWithCoords.lng!,
      name: earliestHotelWithCoords.hotelName,
      city: null,
      country: countryFromAddress(earliestHotelWithCoords.address),
      address: earliestHotelWithCoords.address,
    };
  }

  return null;
}
