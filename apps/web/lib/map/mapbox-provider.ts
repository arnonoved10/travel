import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type {
  MapProvider,
  MapProviderInitOptions,
  MapMarkerSpec,
  MapStyleId,
  MapMoveState,
} from "./types";
import { getMapboxToken } from "./config";
import { markerElementFor } from "./marker-style";

const STYLE_URLS: Record<Exclude<MapStyleId, "terrain" | "night">, string> = {
  "standard-3d": "mapbox://styles/mapbox/standard",
  satellite: "mapbox://styles/mapbox/standard-satellite",
  street: "mapbox://styles/mapbox/streets-v12",
};

const DEM_SOURCE_ID = "trips-app-mapbox-dem";
const CLUSTER_SOURCE_ID = "trips-app-marker-cluster";
const CLUSTER_LAYER_ID = "trips-app-marker-cluster-circles";
const CLUSTER_COUNT_LAYER_ID = "trips-app-marker-cluster-count";

interface ClusterPointFeature {
  type: "Feature";
  properties: { id: string };
  geometry: { type: "Point"; coordinates: [number, number] };
}
interface ClusterFeatureCollection {
  type: "FeatureCollection";
  features: ClusterPointFeature[];
}

function toClusterFeatureCollection(specs: MapMarkerSpec[]): ClusterFeatureCollection {
  return {
    type: "FeatureCollection",
    features: specs.map((s) => ({
      type: "Feature",
      properties: { id: s.id },
      geometry: { type: "Point", coordinates: toLngLat([s.lat, s.lng]) },
    })),
  };
}

/** [lat, lng] (this abstraction's convention) → Mapbox's native [lng, lat]. */
function toLngLat(coord: [number, number]): [number, number] {
  return [coord[1], coord[0]];
}

export class MapboxMapProvider implements MapProvider {
  readonly name = "mapbox";
  readonly capabilities = {
    supports3d: true,
    supportsSatellite: true,
    supportsStyleSwitch: true,
    supportedStyles: ["standard-3d", "satellite", "street", "terrain", "night"] as MapStyleId[],
    supportsClustering: true,
  };

  private map: mapboxgl.Map | null = null;
  private markers = new Map<string, mapboxgl.Marker>();
  private userLocationMarker: mapboxgl.Marker | null = null;
  private pendingMarker: mapboxgl.Marker | null = null;
  private currentStyle: MapStyleId = "standard-3d";
  private currentTheme: "dark" | "light" = "dark";
  private markerClickListeners = new Set<(markerId: string) => void>();
  private mapClickListeners = new Set<(coords: { lat: number; lng: number }) => void>();
  private moveendListeners = new Set<(state: MapMoveState) => void>();
  private loadListeners = new Set<(err?: Error) => void>();
  private errorListeners = new Set<(err?: Error) => void>();

  // קיבוץ-סמנים (clustering) — ר' setMarkers/enableClustering. lastMarkerSpecs/
  // markerSpecsById נשמרים כדי ש-enableClustering יוכל לעבור בין מצבים בלי
  // שהקורא יצטרך לספק שוב את רשימת-הסמנים המלאה.
  private clusteringEnabled = false;
  private lastMarkerSpecs: MapMarkerSpec[] = [];
  private markerSpecsById = new Map<string, MapMarkerSpec>();
  private clusterInteractionsBound = false;

  init(container: HTMLElement, options: MapProviderInitOptions): void {
    const token = getMapboxToken();
    if (!token) {
      throw new Error("MapboxMapProvider.init() called without NEXT_PUBLIC_MAPBOX_TOKEN configured");
    }
    mapboxgl.accessToken = token;
    this.currentTheme = options.theme;

    this.map = new mapboxgl.Map({
      container,
      style: STYLE_URLS["standard-3d"],
      center: toLngLat(options.center),
      zoom: options.zoom,
      pitch: options.pitch ?? 55,
      bearing: options.bearing ?? 0,
    });

    this.map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-left");

    this.map.on("load", () => {
      this.applyLightPresetForTheme(options.theme);
      this.loadListeners.forEach((cb) => cb());
    });
    this.map.on("error", (e) => {
      this.errorListeners.forEach((cb) => cb(e.error instanceof Error ? e.error : new Error("Mapbox error")));
    });
    this.map.on("moveend", () => {
      const state = this.getMoveState();
      this.moveendListeners.forEach((cb) => cb(state));
    });
    // קליק כללי על הקנבס — לא יורה אם הקליק פגע בשכבת ה-cluster (יש לה handler
    // ספציפי משלה, ר' bindClusterInteractions). קליק על marker בכלל לא מגיע
    // לכאן: mapboxgl.Marker הוא DOM element ממוקם-מעל הקנבס, לא חלק ממנו.
    this.map.on("click", (e) => {
      if (this.map?.getLayer(CLUSTER_LAYER_ID)) {
        const hits = this.map.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER_ID] });
        if (hits.length > 0) return;
      }
      const { lat, lng } = e.lngLat;
      this.mapClickListeners.forEach((cb) => cb({ lat, lng }));
    });
    // setStyle() (style switcher, terrain/night toggles) replaces the whole style, which
    // wipes any custom source/layers we added — including the cluster source. Recreate it
    // on every style.load if clustering is currently on, so switching styles mid-clustering
    // doesn't silently drop all markers until the next unrelated setMarkers() call.
    this.map.on("style.load", () => {
      if (!this.clusteringEnabled) return;
      this.ensureClusterLayers();
      this.updateClusterSource(this.lastMarkerSpecs);
      this.setClusterLayersVisible(true);
      this.syncUnclusteredDomMarkers();
    });
  }

  private getMoveState(): MapMoveState {
    if (!this.map) return { center: [0, 0], zoom: 0, bearing: 0, pitch: 0 };
    const c = this.map.getCenter();
    return {
      center: [c.lat, c.lng],
      zoom: this.map.getZoom(),
      bearing: this.map.getBearing(),
      pitch: this.map.getPitch(),
    };
  }

  private applyLightPresetForTheme(theme: "dark" | "light"): void {
    if (!this.map) return;
    try {
      this.map.setConfigProperty("basemap", "lightPreset", theme === "dark" ? "night" : "day");
    } catch {
      // Style may not be the Standard style (e.g. streets-v12) — lightPreset doesn't apply, ignore.
    }
  }

  private applyTerrain(enabled: boolean): void {
    if (!this.map) return;
    if (enabled) {
      if (!this.map.getSource(DEM_SOURCE_ID)) {
        this.map.addSource(DEM_SOURCE_ID, {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
      }
      this.map.setTerrain({ source: DEM_SOURCE_ID, exaggeration: 1.4 });
    } else {
      this.map.setTerrain(null);
    }
  }

  destroy(): void {
    this.markers.forEach((m) => m.remove());
    this.markers.clear();
    this.userLocationMarker?.remove();
    this.userLocationMarker = null;
    this.pendingMarker?.remove();
    this.pendingMarker = null;
    this.map?.remove();
    this.map = null;
    this.markerClickListeners.clear();
    this.mapClickListeners.clear();
    this.moveendListeners.clear();
    this.loadListeners.clear();
    this.errorListeners.clear();
    this.clusteringEnabled = false;
    this.lastMarkerSpecs = [];
    this.markerSpecsById.clear();
    this.clusterInteractionsBound = false;
  }

  setStyle(style: MapStyleId): void {
    if (!this.map) return;
    this.currentStyle = style;

    if (style === "terrain") {
      this.map.setStyle(STYLE_URLS["standard-3d"]);
      this.map.once("style.load", () => {
        this.applyLightPresetForTheme(this.currentTheme);
        this.applyTerrain(true);
      });
      return;
    }

    if (style === "night") {
      // "night" is an explicit lighting choice, independent of the app's own dark/light
      // theme setting — always forces the night preset regardless of currentTheme.
      this.map.setStyle(STYLE_URLS["standard-3d"]);
      this.map.once("style.load", () => {
        this.applyTerrain(false);
        this.applyLightPresetForTheme("dark");
      });
      return;
    }

    this.map.setStyle(STYLE_URLS[style]);
    this.map.once("style.load", () => {
      this.applyTerrain(false);
      this.applyLightPresetForTheme(this.currentTheme);
    });
  }

  setTheme(theme: "dark" | "light"): void {
    this.currentTheme = theme;
    // "night" style intentionally ignores the app theme (see setStyle) — re-applying here
    // would fight the user's explicit night-style choice.
    if (this.currentStyle !== "night") {
      this.applyLightPresetForTheme(theme);
    }
  }

  setPitch(pitch: number): void {
    this.map?.easeTo({ pitch, duration: 400 });
  }

  flyTo(center: [number, number], opts?: { zoom?: number; pitch?: number; bearing?: number }): void {
    this.map?.flyTo({
      center: toLngLat(center),
      zoom: opts?.zoom,
      pitch: opts?.pitch,
      bearing: opts?.bearing,
      duration: 800,
    });
  }

  fitBounds(bounds: [[number, number], [number, number]]): void {
    this.map?.fitBounds([toLngLat(bounds[0]), toLngLat(bounds[1])], { padding: 48, duration: 600 });
  }

  setMarkers(specs: MapMarkerSpec[]): void {
    if (!this.map) return;
    this.lastMarkerSpecs = specs;
    this.markerSpecsById = new Map(specs.map((s) => [s.id, s]));

    if (this.clusteringEnabled) {
      this.updateClusterSource(specs);
      this.syncUnclusteredDomMarkers();
    } else {
      this.renderDomMarkers(specs);
    }
  }

  /** מרנדר תגי-DOM מותאמים-אישית (markerElementFor) לרשימת specs נתונה — משמש
   * הן ב"בלי-קיבוץ" (כל הסמנים) והן ב"עם-קיבוץ" (רק הסמנים שלא נכנסו לאשכול
   * בזום הנוכחי, ר' syncUnclusteredDomMarkers). דיפ מול this.markers הקיים כרגיל. */
  private renderDomMarkers(specs: MapMarkerSpec[]): void {
    if (!this.map) return;
    const nextIds = new Set(specs.map((s) => s.id));

    for (const [id, marker] of this.markers) {
      if (!nextIds.has(id)) {
        marker.remove();
        this.markers.delete(id);
      }
    }

    for (const spec of specs) {
      const existing = this.markers.get(spec.id);
      if (existing) {
        existing.setLngLat(toLngLat([spec.lat, spec.lng]));
        existing.getElement().replaceWith(markerElementFor(spec));
        continue;
      }
      const el = markerElementFor(spec);
      el.addEventListener("click", () => this.markerClickListeners.forEach((cb) => cb(spec.id)));
      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat(toLngLat([spec.lat, spec.lng]))
        .addTo(this.map);
      this.markers.set(spec.id, marker);
    }
  }

  /** יוצר את המקור/השכבות פעם אחת (idempotent) — נשארים קיימים גם כש-clustering
   * כבוי, רק מוסתרים (setClusterLayersVisible), כדי לא להירשם/להסיר event
   * listeners בכל החלפת-מצב. */
  private ensureClusterLayers(): void {
    if (!this.map || this.map.getSource(CLUSTER_SOURCE_ID)) return;

    this.map.addSource(CLUSTER_SOURCE_ID, {
      type: "geojson",
      data: toClusterFeatureCollection([]),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    this.map.addLayer({
      id: CLUSTER_LAYER_ID,
      type: "circle",
      source: CLUSTER_SOURCE_ID,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": ["step", ["get", "point_count"], "#8b5cf6", 10, "#7c3aed", 30, "#6d28d9"],
        "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 30, 30],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });
    this.map.addLayer({
      id: CLUSTER_COUNT_LAYER_ID,
      type: "symbol",
      source: CLUSTER_SOURCE_ID,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
        "text-size": 13,
      },
      paint: { "text-color": "#ffffff" },
    });

    this.bindClusterInteractions();
  }

  private updateClusterSource(specs: MapMarkerSpec[]): void {
    if (!this.map) return;
    this.ensureClusterLayers();
    const source = this.map.getSource(CLUSTER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    source?.setData(toClusterFeatureCollection(specs) as unknown as GeoJSON.FeatureCollection);
  }

  private setClusterLayersVisible(visible: boolean): void {
    if (!this.map || !this.map.getLayer(CLUSTER_LAYER_ID)) return;
    const v = visible ? "visible" : "none";
    this.map.setLayoutProperty(CLUSTER_LAYER_ID, "visibility", v);
    this.map.setLayoutProperty(CLUSTER_COUNT_LAYER_ID, "visibility", v);
  }

  /** נרשם פעם אחת בלבד (clusterInteractionsBound) — קליק על אשכול מזום-פנימה
   * עד לרמת-הזום שבה הוא מתפרק (getClusterExpansionZoom), לא "מפזר" ידנית. */
  private bindClusterInteractions(): void {
    if (!this.map || this.clusterInteractionsBound) return;
    this.clusterInteractionsBound = true;
    const map = this.map;

    map.on("click", CLUSTER_LAYER_ID, (e) => {
      const feature = map.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER_ID] })[0];
      if (!feature || feature.geometry.type !== "Point") return;
      const clusterId = feature.properties?.cluster_id as number | undefined;
      if (clusterId === undefined) return;
      const coordinates = feature.geometry.coordinates as [number, number];
      const source = map.getSource(CLUSTER_SOURCE_ID) as mapboxgl.GeoJSONSource;
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom === null || zoom === undefined) return;
        map.easeTo({ center: coordinates, zoom, duration: 500 });
      });
    });

    map.on("mouseenter", CLUSTER_LAYER_ID, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", CLUSTER_LAYER_ID, () => {
      map.getCanvas().style.cursor = "";
    });

    // חברות-באשכול משתנה עם זום/תזוזה — מסנכרן מחדש אילו סמנים מוצגים כ-DOM
    // (הבלתי-מקובצים) לעומת מוצגים כעיגול-אשכול (השכבה הנייטיבית).
    map.on("zoomend", () => {
      if (this.clusteringEnabled) this.syncUnclusteredDomMarkers();
    });
    map.on("moveend", () => {
      if (this.clusteringEnabled) this.syncUnclusteredDomMarkers();
    });
    map.on("sourcedata", (e) => {
      if (this.clusteringEnabled && e.sourceId === CLUSTER_SOURCE_ID && map.isSourceLoaded(CLUSTER_SOURCE_ID)) {
        this.syncUnclusteredDomMarkers();
      }
    });
  }

  private syncUnclusteredDomMarkers(): void {
    if (!this.map || !this.map.isSourceLoaded(CLUSTER_SOURCE_ID)) return;
    const features = this.map.querySourceFeatures(CLUSTER_SOURCE_ID, {
      filter: ["!", ["has", "point_count"]],
    });

    const seen = new Set<string>();
    const unclustered: MapMarkerSpec[] = [];
    for (const f of features) {
      const id = f.properties?.id as string | undefined;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const spec = this.markerSpecsById.get(id);
      if (spec) unclustered.push(spec);
    }
    this.renderDomMarkers(unclustered);
  }

  setUserLocation(coords: { lat: number; lng: number } | null): void {
    if (!this.map) return;
    if (!coords) {
      this.userLocationMarker?.remove();
      this.userLocationMarker = null;
      return;
    }
    const el = document.createElement("div");
    el.style.width = "16px";
    el.style.height = "16px";
    el.style.borderRadius = "50%";
    el.style.background = "#3b82f6";
    el.style.border = "3px solid #fff";
    el.style.boxShadow = "0 0 0 4px rgba(59,130,246,0.35)";

    if (this.userLocationMarker) {
      this.userLocationMarker.setLngLat(toLngLat([coords.lat, coords.lng]));
    } else {
      this.userLocationMarker = new mapboxgl.Marker({ element: el }).setLngLat(toLngLat([coords.lat, coords.lng])).addTo(this.map);
    }
  }

  /** אותה תבנית-עלה-אדום כמו ה-pendingIcon הישן ב-leaflet-map.tsx, כדי שהמעבר
   * ל-Mapbox לא ישנה איך "סימון מקום חדש" נראה למשתמש. label (שם/כתובת שנמצאה
   * בחיפוש) מוצג כ-popup פתוח-תמידית — בלי צורך בקליק, אותו רעיון כמו ה-Tooltip
   * הקבוע ב-leaflet-map.tsx. */
  setPendingMarker(coords: { lat: number; lng: number } | null, label?: string): void {
    if (!this.map) return;
    if (!coords) {
      this.pendingMarker?.remove();
      this.pendingMarker = null;
      return;
    }
    if (this.pendingMarker) {
      this.pendingMarker.setLngLat(toLngLat([coords.lat, coords.lng]));
      if (label) this.pendingMarker.setPopup(new mapboxgl.Popup({ closeButton: false, closeOnClick: false }).setText(label));
      return;
    }
    const el = document.createElement("div");
    el.style.width = "1.5rem";
    el.style.height = "1.5rem";
    el.style.borderRadius = "50% 50% 50% 0";
    el.style.background = "#e0492f";
    el.style.border = "2px solid #fff";
    el.style.transform = "rotate(-45deg)";
    el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.35)";
    this.pendingMarker = new mapboxgl.Marker({ element: el, anchor: "bottom" }).setLngLat(toLngLat([coords.lat, coords.lng]));
    if (label) {
      this.pendingMarker.setPopup(new mapboxgl.Popup({ closeButton: false, closeOnClick: false }).setText(label));
      this.pendingMarker.addTo(this.map);
      this.pendingMarker.togglePopup();
    } else {
      this.pendingMarker.addTo(this.map);
    }
  }

  enableClustering(enabled: boolean): void {
    this.clusteringEnabled = enabled;
    if (!this.map) return;

    if (enabled) {
      this.updateClusterSource(this.lastMarkerSpecs);
      this.setClusterLayersVisible(true);
      this.syncUnclusteredDomMarkers();
    } else {
      this.setClusterLayersVisible(false);
      this.renderDomMarkers(this.lastMarkerSpecs);
    }
  }

  fullscreen(enabled: boolean): void {
    const container = this.map?.getContainer();
    if (!container) return;
    if (enabled && document.fullscreenElement !== container) {
      container.requestFullscreen?.().catch(() => {});
    } else if (!enabled && document.fullscreenElement === container) {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  resize(): void {
    this.map?.resize();
  }

  on(event: "markerClick", cb: (markerId: string) => void): () => void;
  on(event: "mapClick", cb: (coords: { lat: number; lng: number }) => void): () => void;
  on(event: "moveend", cb: (state: MapMoveState) => void): () => void;
  on(event: "load" | "error", cb: (err?: Error) => void): () => void;
  on(
    event: "markerClick" | "mapClick" | "moveend" | "load" | "error",
    cb:
      | ((markerId: string) => void)
      | ((coords: { lat: number; lng: number }) => void)
      | ((state: MapMoveState) => void)
      | ((err?: Error) => void),
  ): () => void {
    if (event === "markerClick") {
      const fn = cb as (markerId: string) => void;
      this.markerClickListeners.add(fn);
      return () => this.markerClickListeners.delete(fn);
    }
    if (event === "mapClick") {
      const fn = cb as (coords: { lat: number; lng: number }) => void;
      this.mapClickListeners.add(fn);
      return () => this.mapClickListeners.delete(fn);
    }
    if (event === "moveend") {
      const fn = cb as (state: MapMoveState) => void;
      this.moveendListeners.add(fn);
      return () => this.moveendListeners.delete(fn);
    }
    if (event === "load") {
      const fn = cb as (err?: Error) => void;
      this.loadListeners.add(fn);
      return () => this.loadListeners.delete(fn);
    }
    const fn = cb as (err?: Error) => void;
    this.errorListeners.add(fn);
    return () => this.errorListeners.delete(fn);
  }
}
