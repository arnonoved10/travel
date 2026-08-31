import type { PlaceCategory, TripPlaceStatus } from "@travel-app/shared-types";

export type MapStyleId = "standard-3d" | "satellite" | "street" | "terrain" | "night";

// All [number, number] coordinate tuples in this interface are [lat, lng] — matching this
// app's existing convention (haversine-distance.ts, TripPlace/Place lat/lng fields), NOT
// Mapbox GL's native [lng, lat] order. Concrete providers convert internally; callers of
// this abstraction never need to think about a provider's native axis order.

export interface MapMarkerSpec {
  id: string;
  lat: number;
  lng: number;
  category: PlaceCategory;
  status?: TripPlaceStatus;
  selected?: boolean;
}

export interface MapProviderCapabilities {
  supports3d: boolean;
  supportsSatellite: boolean;
  supportsStyleSwitch: boolean;
  supportedStyles: MapStyleId[];
  supportsClustering: boolean;
}

export type MapProviderEvent = "markerClick" | "mapClick" | "moveend" | "load" | "error";

export interface MapMoveState {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface MapProviderInitOptions {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
  theme: "dark" | "light";
}

/**
 * Provider-agnostic map abstraction — mirrors the WeatherProvider/RoutingProvider
 * interface+factory pattern (see DECISIONS.md), but lives in apps/web because
 * concrete implementations touch window/document/canvas directly and must stay
 * client-only (unlike Weather/Routing's pure fetch() implementations).
 */
export interface MapProvider {
  readonly name: string;
  readonly capabilities: MapProviderCapabilities;

  init(container: HTMLElement, options: MapProviderInitOptions): void;
  destroy(): void;

  setStyle(style: MapStyleId): void;
  /** Re-applies the current style's light/dark variant (e.g. Mapbox Standard's lightPreset) —
   * called when the app theme changes while the map is already mounted. */
  setTheme(theme: "dark" | "light"): void;
  setPitch(pitch: number): void;
  flyTo(center: [number, number], opts?: { zoom?: number; pitch?: number; bearing?: number }): void;
  fitBounds(bounds: [[number, number], [number, number]]): void;

  setMarkers(markers: MapMarkerSpec[]): void;
  setUserLocation(coords: { lat: number; lng: number } | null): void;
  /** נקודה זמנית-עוד-לא-נשמרה ("סימון מקום חדש", ר' /map) — אותו רעיון בדיוק
   * כמו setUserLocation, סמן ייעודי מחוץ ל-setMarkers כי אין לה category אמיתי. */
  setPendingMarker(coords: { lat: number; lng: number } | null, label?: string): void;
  /** Toggles marker clustering (only meaningful when `capabilities.supportsClustering` is
   * true — a no-op otherwise). MapboxMapProvider groups nearby unclustered points into a
   * native GeoJSON-source cluster while zoomed out; clicking a cluster zooms in to expand it. */
  enableClustering(enabled: boolean): void;

  fullscreen(enabled: boolean): void;
  resize(): void;

  on(event: "markerClick", cb: (markerId: string) => void): () => void;
  /** קליק על המפה עצמה, לא על marker/cluster — משמש לזרימת "סימון מקום חדש"
   * (ר' /map, שקילום ל-onMapClick של leaflet-map.tsx הישן). */
  on(event: "mapClick", cb: (coords: { lat: number; lng: number }) => void): () => void;
  on(event: "moveend", cb: (state: MapMoveState) => void): () => void;
  on(event: "load" | "error", cb: (err?: Error) => void): () => void;
}
