import type { PlaceCategory, PoiCandidate, PoiProvider, PoiSearchQuery } from "@travel-app/shared-types";

// שרת ציבורי חינמי של Overpass (נתוני OpenStreetMap) — בלי מפתח, בלי הרשמה.
// אותה רוח בדיוק כמו OSRM/Open-Meteo: אם אין תשובה אמיתית — לא ממציאים
// תוצאה. איטי/מוגבל-קצב יותר מ-OSRM, לכן רדיוס מוגבל (ר' poiSearchQuerySchema).
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// קטגוריה בלי מיפוי הגיוני ל-OSM (hotel/shop/massage/airport/וכו') פשוט
// לא נכללת — לא ממציאים תגית שלא קיימת בעולם האמיתי.
const CATEGORY_TO_OSM_TAGS: Partial<Record<PlaceCategory, [string, string][]>> = {
  river: [
    ["waterway", "river"],
    ["waterway", "stream"],
  ],
  viewpoint: [["tourism", "viewpoint"]],
  restaurant: [["amenity", "restaurant"]],
  entertainment: [
    ["amenity", "nightclub"],
    ["amenity", "cinema"],
    ["tourism", "theme_park"],
    ["leisure", "amusement_arcade"],
  ],
  market: [
    ["shop", "marketplace"],
    ["amenity", "marketplace"],
  ],
  mall: [["shop", "mall"]],
  waterfall: [["waterway", "waterfall"]],
  nature: [["leisure", "nature_reserve"]],
  beach: [["natural", "beach"]],
  bar: [
    ["amenity", "bar"],
    ["amenity", "pub"],
  ],
  cafe: [["amenity", "cafe"]],
  attraction: [["tourism", "attraction"]],
};

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

function matchCategory(tags: Record<string, string> | undefined): PlaceCategory | null {
  if (!tags) return null;
  for (const [category, pairs] of Object.entries(CATEGORY_TO_OSM_TAGS) as [PlaceCategory, [string, string][]][]) {
    if (pairs.some(([key, value]) => tags[key] === value)) return category;
  }
  return null;
}

function buildAddress(tags: Record<string, string> | undefined): string | null {
  if (!tags) return null;
  const streetLine = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
  const combined = [streetLine, tags["addr:city"]].filter(Boolean).join(", ");
  return combined || null;
}

export class OverpassPoiProvider implements PoiProvider {
  readonly name = "overpass";

  async searchNearby(query: PoiSearchQuery): Promise<PoiCandidate[] | null> {
    const tagPairs = query.categories.flatMap((category) => CATEGORY_TO_OSM_TAGS[category] ?? []);
    if (tagPairs.length === 0) return [];

    const radiusMeters = Math.round(query.radiusKm * 1000);
    const around = `around:${radiusMeters},${query.lat},${query.lng}`;
    const clauses = tagPairs
      .map(([key, value]) => `node["${key}"="${value}"](${around});way["${key}"="${value}"](${around});`)
      .join("\n");
    const ql = `[out:json][timeout:25];(${clauses});out center 40;`;

    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(ql)}`,
    });
    if (!response.ok) {
      throw new Error(`Overpass request failed with status ${response.status}`);
    }

    const data = (await response.json()) as OverpassResponse;
    if (!Array.isArray(data.elements)) return null;

    const seen = new Set<string>();
    const candidates: PoiCandidate[] = [];
    for (const el of data.elements) {
      const name = el.tags?.name;
      if (!name) continue; // לא ממציאים שם ל-POI בלי name אמיתי ב-OSM

      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (lat === undefined || lng === undefined) continue;

      const category = matchCategory(el.tags);
      if (!category) continue;

      const externalId = `${el.type}/${el.id}`;
      if (seen.has(externalId)) continue;
      seen.add(externalId);

      candidates.push({ externalId, name, category, lat, lng, address: buildAddress(el.tags) });
    }

    return candidates;
  }
}

export const overpassPoiProvider = new OverpassPoiProvider();
