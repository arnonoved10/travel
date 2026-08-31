import type { Trip } from "@travel-app/shared-types";

export interface DestinationPhotoSet {
  hero: string;
  mapDemo: string;
  tip: string;
  credit: string;
}

/**
 * Curated real photography (Wikimedia Commons, freely licensed) keyed by destination
 * keywords found in the trip's own name/notes — never guessed for a trip we can't
 * identify. `Trip.coverImageUrl` (a real per-trip field, no UI to set it yet) always
 * takes priority over this lookup when present; see trip-hero-card.tsx.
 *
 * Hotlinked directly from upload.wikimedia.org, the same "prefer a real free external
 * source over fabricated content" principle already used for OSM tiles/Open-Meteo — see
 * DECISIONS.md. CC-BY-SA requires attribution, shown as a small credit line wherever
 * these appear.
 */
const DESTINATION_PHOTOS: { keywords: string[]; photos: DestinationPhotoSet }[] = [
  {
    keywords: ["תאילנד", "בנגקוק", "thailand", "bangkok"],
    photos: {
      hero: "https://upload.wikimedia.org/wikipedia/commons/d/db/Bangkok%2C_Thailand%2C_Aerial_view.jpg",
      mapDemo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Chao_Phraya_-_Wat_Arun.JPG",
      tip: "https://upload.wikimedia.org/wikipedia/commons/1/12/Wat_Arun_Ratchawararam_Ratchawaramahawihan_Temple.jpg",
      credit: "תמונה: Wikimedia Commons",
    },
  },
  {
    keywords: ["פראג", "prague"],
    photos: {
      hero: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Prague_panorama.jpg",
      mapDemo: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Prague_panorama.jpg",
      tip: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Prague_panorama.jpg",
      credit: "תמונה: Wikimedia Commons",
    },
  },
];

export function getDestinationPhotos(trip: Pick<Trip, "name" | "notes">): DestinationPhotoSet | null {
  const haystack = `${trip.name} ${trip.notes ?? ""}`.toLowerCase();
  for (const entry of DESTINATION_PHOTOS) {
    if (entry.keywords.some((k) => haystack.includes(k.toLowerCase()))) {
      return entry.photos;
    }
  }
  return null;
}
