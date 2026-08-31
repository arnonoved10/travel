// "כספומט קרוב" — לא דרך PoiProvider/PlaceCategory (ATM אינו קטגוריית-Place
// הגיונית לשמירה בספרייה, ר' overpass-provider.ts). אותו דפוס fetch/parse
// בדיוק, אבל עצמאי ומוחזר בצורה גנרית משלו. אותו שרת Overpass חינמי, בלי מפתח.
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export interface AtmCandidate {
  externalId: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
}

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

function buildAddress(tags: Record<string, string> | undefined): string | null {
  if (!tags) return null;
  const streetLine = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
  const combined = [streetLine, tags["addr:city"]].filter(Boolean).join(", ");
  return combined || null;
}

/** null = הספק נכשל/לא הגיב. מערך ריק = הצליח ולא נמצא כספומט ברדיוס. */
export async function findNearbyAtms(lat: number, lng: number, radiusKm: number): Promise<AtmCandidate[] | null> {
  const radiusMeters = Math.round(radiusKm * 1000);
  const around = `around:${radiusMeters},${lat},${lng}`;
  const ql = `[out:json][timeout:25];(node["amenity"="atm"](${around});way["amenity"="atm"](${around}););out center 40;`;

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(ql)}`,
  });
  if (!response.ok) {
    throw new Error(`Overpass ATM request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OverpassResponse;
  if (!Array.isArray(data.elements)) return null;

  const seen = new Set<string>();
  const candidates: AtmCandidate[] = [];
  for (const el of data.elements) {
    const externalId = `${el.type}/${el.id}`;
    if (seen.has(externalId)) continue;
    seen.add(externalId);

    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (elLat === undefined || elLng === undefined) continue;

    const name = el.tags?.name || el.tags?.operator || el.tags?.brand || "כספומט";
    candidates.push({ externalId, name, lat: elLat, lng: elLng, address: buildAddress(el.tags) });
  }

  return candidates;
}
