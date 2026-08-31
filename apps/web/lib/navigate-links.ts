// בונה קישורי ניווט חיצוניים (Google Maps / Waze) בלי צורך במפתח API —
// עדיפות לקואורדינטות (lat/lng) על פני כתובת טקסטואלית, כי הן מדויקות יותר.
export function buildNavigateLinks(place: {
  lat: number | null;
  lng: number | null;
  address?: string | null;
}): { googleMapsUrl: string | null; wazeUrl: string | null } {
  const { lat, lng, address } = place;

  if (lat !== null && lng !== null) {
    return {
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      wazeUrl: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
    };
  }

  if (address) {
    const encoded = encodeURIComponent(address);
    return {
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
      wazeUrl: `https://waze.com/ul?q=${encoded}&navigate=yes`,
    };
  }

  return { googleMapsUrl: null, wazeUrl: null };
}
