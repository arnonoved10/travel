"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/**
 * מפה תלת-ממדית אמיתית ואינטראקטיבית (design-preview בלבד) — MapLibre GL
 * JS (ספרייה חופשית, קוד-פתוח, ללא מפתח API) על אריחי-וקטור של
 * OpenFreeMap (openfreemap.org — שירות חינמי לגמרי, ללא הרשמה, ללא
 * הגבלת-בקשות; הסגנון "liberty" תומך בהטיה תלת-ממדית ובהגבהת-בניינים
 * מובנית). מחליף את המפה הדו-ממדית הקודמת (Leaflet, עדיין ב-
 * leaflet-map-inner.tsx אך לא בשימוש יותר) — לפי בקשה מפורשת למפה
 * תלת-ממדית. קובץ "use client" נפרד (נוגע ב-window/document), נטען דרך
 * next/dynamic עם ssr:false מתוך page.tsx, באותו עיקרון בדיוק כמו הגרסה
 * הקודמת.
 */

export interface MapPoint3D {
  id: string;
  lat: number;
  lon: number;
  label: string;
  sublabel?: string;
  color: string;
  isSelected?: boolean;
  order?: number;
  /** מוצג כסמן, אבל לא משתתף בקו-המסלול ולא בהתמקדות-אוטומטית — משמש
   * ל"מיקום שנבחר" בלחיצה חופשית על המפה, כדי לא לגרור פתאום את המצלמה
   * או לחבר קו-מסלול אליו. */
  excludeFromRoute?: boolean;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function DesignPreviewMapLibre({
  points,
  routeColor = "#8a5adf",
  pitch,
  onSelect,
  onMapClick,
  fitSignal,
  initialCenter,
}: {
  points: MapPoint3D[];
  routeColor?: string;
  pitch: number;
  onSelect?: (id: string) => void;
  /** נלחץ במפה עצמה (לא על סמן) — משמש ל"בחירת מיקום על המפה" כשאין
   * עדיין נקודות/מסלול, כדי שהמפה תישאר שימושית גם ריקה. */
  onMapClick?: (lat: number, lon: number) => void;
  /** משתנה בכל פעם שרוצים "להתמקד מחדש" על כל הנקודות (למשל מעבר בין
   * "כל הטיול" ליום ספציפי) — לא רק כשמשתנה מספר הנקודות. */
  fitSignal: number;
  /** נקודת-פתיחה כשאין עדיין נקודות אמיתיות (למשל מיקום המשתמש בפועל) —
   * לא משפיעה יותר אחרי שיש נקודות (fitToPoints משתלט). */
  initialCenter?: { lat: number; lon: number; zoom?: number };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const onSelectRef = useRef(onSelect);
  const onMapClickRef = useRef(onMapClick);
  const loadedRef = useRef(false);
  onSelectRef.current = onSelect;
  onMapClickRef.current = onMapClick;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const first = points[0];
    const start = first ? { lat: first.lat, lon: first.lon, zoom: 10 } : initialCenter ?? { lat: 32.08, lon: 34.78, zoom: 8 };
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [start.lon, start.lat],
      zoom: start.zoom ?? 10,
      pitch,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-left");
    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    map.on("click", (e) => onMapClickRef.current?.(e.lngLat.lat, e.lngLat.lng));
    mapRef.current = map;
    map.on("load", () => {
      map.addSource("dp-route", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} } });
      map.addLayer({ id: "dp-route-glow", type: "line", source: "dp-route", paint: { "line-color": routeColor, "line-width": 9, "line-opacity": 0.16 }, layout: { "line-cap": "round", "line-join": "round" } });
      map.addLayer({ id: "dp-route-core", type: "line", source: "dp-route", paint: { "line-color": routeColor, "line-width": 3, "line-opacity": 0.9, "line-dasharray": [1, 1.6] }, layout: { "line-cap": "round", "line-join": "round" } });
      loadedRef.current = true;
      syncRoute();
      syncMarkers();
      fitToPoints(true);
    });
    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function syncRoute() {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const src = map.getSource("dp-route") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    const routePoints = points.filter((p) => !p.excludeFromRoute);
    src.setData({ type: "Feature", geometry: { type: "LineString", coordinates: routePoints.map((p) => [p.lon, p.lat]) }, properties: {} });
    if (map.getLayer("dp-route-glow")) {
      map.setPaintProperty("dp-route-glow", "line-color", routeColor);
      map.setPaintProperty("dp-route-core", "line-color", routeColor);
    }
  }

  function syncMarkers() {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    for (const m of markersRef.current) m.remove();
    markersRef.current = points.map((p) => {
      const el = document.createElement("div");
      el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;transform-origin:bottom center;";
      const dashed = p.excludeFromRoute ? "border-style:dashed;" : "";
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;padding:${p.isSelected ? "8px 13px" : "6px 11px"};border-radius:999px;background:${p.isSelected ? p.color : "#0e1930"};border:2px solid ${p.isSelected ? "#fff" : p.color};${dashed}box-shadow:0 4px 12px rgba(0,0,0,0.45);white-space:nowrap;">
          ${p.order != null ? `<span style="width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,0.28);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;flex-shrink:0;">${p.order}</span>` : ""}
          <span style="font-size:13px;font-weight:800;color:#fff;">${escapeHtml(p.label)}</span>
          ${p.sublabel ? `<span style="font-size:10.5px;font-weight:700;color:${p.isSelected ? "rgba(255,255,255,0.85)" : p.color};">· ${escapeHtml(p.sublabel)}</span>` : ""}
        </div>
      `;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current?.(p.id);
      });
      return new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([p.lon, p.lat]).addTo(map);
    });
  }

  function fitToPoints(instant = false) {
    const map = mapRef.current;
    const fitSet = points.filter((p) => !p.excludeFromRoute);
    if (!map || fitSet.length === 0) return;
    if (fitSet.length === 1) {
      map.easeTo({ center: [fitSet[0]!.lon, fitSet[0]!.lat], zoom: 12, duration: instant ? 0 : 800 });
      return;
    }
    const bounds = fitSet.reduce((b, p) => b.extend([p.lon, p.lat] as [number, number]), new maplibregl.LngLatBounds([fitSet[0]!.lon, fitSet[0]!.lat], [fitSet[0]!.lon, fitSet[0]!.lat]));
    map.fitBounds(bounds, { padding: 70, duration: instant ? 0 : 800, maxZoom: 14 });
  }

  const pointsKey = points.map((p) => `${p.id}:${p.lat}:${p.lon}:${p.isSelected}:${p.order}:${p.excludeFromRoute}`).join("|");
  useEffect(() => {
    syncRoute();
    syncMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey, routeColor]);

  useEffect(() => {
    fitToPoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitSignal]);

  useEffect(() => {
    mapRef.current?.easeTo({ pitch, duration: 500 });
  }, [pitch]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
