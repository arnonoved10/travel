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
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function DesignPreviewMapLibre({
  points,
  routeColor = "#8a5adf",
  pitch,
  onSelect,
  fitSignal,
}: {
  points: MapPoint3D[];
  routeColor?: string;
  pitch: number;
  onSelect?: (id: string) => void;
  /** משתנה בכל פעם שרוצים "להתמקד מחדש" על כל הנקודות (למשל מעבר בין
   * "כל הטיול" ליום ספציפי) — לא רק כשמשתנה מספר הנקודות. */
  fitSignal: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const onSelectRef = useRef(onSelect);
  const loadedRef = useRef(false);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const first = points[0];
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: first ? [first.lon, first.lat] : [34.78, 32.08],
      zoom: first ? 10 : 3,
      pitch,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-left");
    map.addControl(new maplibregl.AttributionControl({ compact: true }));
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
    src.setData({ type: "Feature", geometry: { type: "LineString", coordinates: points.map((p) => [p.lon, p.lat]) }, properties: {} });
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
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;padding:${p.isSelected ? "8px 13px" : "6px 11px"};border-radius:999px;background:${p.isSelected ? p.color : "#0e1930"};border:2px solid ${p.isSelected ? "#fff" : p.color};box-shadow:0 4px 12px rgba(0,0,0,0.45);white-space:nowrap;">
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
    if (!map || points.length === 0) return;
    if (points.length === 1) {
      map.easeTo({ center: [points[0]!.lon, points[0]!.lat], zoom: 12, duration: instant ? 0 : 800 });
      return;
    }
    const bounds = points.reduce((b, p) => b.extend([p.lon, p.lat] as [number, number]), new maplibregl.LngLatBounds([points[0]!.lon, points[0]!.lat], [points[0]!.lon, points[0]!.lat]));
    map.fitBounds(bounds, { padding: 70, duration: instant ? 0 : 800, maxZoom: 14 });
  }

  const pointsKey = points.map((p) => `${p.id}:${p.lat}:${p.lon}:${p.isSelected}:${p.order}`).join("|");
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
