"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Place } from "@travel-app/shared-types";
import { useTheme } from "@/components/theme-provider";
import { getMapProvider } from "@/lib/map/get-map-provider";
import type { MapProvider, MapStyleId } from "@/lib/map/types";
import { haversineDistanceKm } from "@/lib/haversine-distance";
import { PlaceCard } from "./place-card";
import { NearbyPanel } from "./nearby-panel";
import { StyleSwitcher } from "./style-switcher";

export function DemoMapCanvas({
  places,
  center,
  zoom,
}: {
  places: Place[];
  center: [number, number];
  zoom: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const providerRef = useRef<MapProvider | null>(null);
  const { resolvedMode } = useTheme();

  const [ready, setReady] = useState(false);
  const [style, setStyleState] = useState<MapStyleId>("standard-3d");
  const [is3D, setIs3D] = useState(true);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "denied" | "error">("idle");
  const [nearbyActive, setNearbyActive] = useState(false);
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState(2);
  const [fullscreen, setFullscreen] = useState(false);
  const [clustering, setClustering] = useState(false);

  // Mount the map once. Theme/place updates below reach the already-mounted provider
  // through its imperative API rather than re-initializing.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const provider = getMapProvider();
    providerRef.current = provider;
    provider.init(container, { center, zoom, pitch: 55, theme: resolvedMode });

    const unsubLoad = provider.on("load", () => setReady(true));
    const unsubClick = provider.on("markerClick", (id) => setSelectedPlaceId(id));

    return () => {
      unsubLoad();
      unsubClick();
      provider.destroy();
      providerRef.current = null;
    };
    // Intentionally mount-only — center/zoom are only meaningful for the initial view;
    // later navigation happens via flyTo(), not by re-running init().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    providerRef.current?.setTheme(resolvedMode);
  }, [resolvedMode, ready]);

  const visiblePlaces = useMemo(() => {
    if (!nearbyActive || !userLocation) return places;
    return places.filter(
      (p) =>
        p.lat !== null &&
        p.lng !== null &&
        haversineDistanceKm(userLocation.lat, userLocation.lng, p.lat, p.lng) <= nearbyRadiusKm,
    );
  }, [places, nearbyActive, userLocation, nearbyRadiusKm]);

  useEffect(() => {
    if (!ready) return;
    providerRef.current?.setMarkers(
      visiblePlaces
        .filter((p) => p.lat !== null && p.lng !== null)
        .map((p) => ({
          id: p.id,
          lat: p.lat!,
          lng: p.lng!,
          category: p.category,
          selected: p.id === selectedPlaceId,
        })),
    );
  }, [ready, visiblePlaces, selectedPlaceId]);

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null;

  function handleStyleChange(next: MapStyleId) {
    setStyleState(next);
    providerRef.current?.setStyle(next);
  }

  function handleToggle3D() {
    const next = !is3D;
    setIs3D(next);
    providerRef.current?.setPitch(next ? 55 : 0);
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setGeoStatus("idle");
        providerRef.current?.setUserLocation(coords);
        providerRef.current?.flyTo([coords.lat, coords.lng], { zoom: 14 });
      },
      (err) => {
        setGeoStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  }

  function handleToggleFullscreen() {
    const next = !fullscreen;
    setFullscreen(next);
    providerRef.current?.fullscreen(next);
  }

  function handleToggleClustering() {
    const next = !clustering;
    setClustering(next);
    providerRef.current?.enableClustering(next);
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {!ready ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-muted)",
            fontSize: "0.875rem",
            background: "var(--color-bg)",
          }}
        >
          טוען מפה…
        </div>
      ) : null}

      <div style={{ position: "absolute", top: "0.75rem", insetInlineStart: "0.75rem", zIndex: 5, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <StyleSwitcher current={style} onChange={handleStyleChange} />
        <NearbyPanel
          active={nearbyActive}
          radiusKm={nearbyRadiusKm}
          onToggle={() => setNearbyActive((v) => !v)}
          onRadiusChange={setNearbyRadiusKm}
          hasUserLocation={userLocation !== null}
          matchCount={nearbyActive ? visiblePlaces.length : null}
        />
      </div>

      <div style={{ position: "absolute", top: "0.75rem", insetInlineEnd: "0.75rem", zIndex: 5, display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
        <MapButton onClick={handleToggle3D}>{is3D ? "2D" : "3D"}</MapButton>
        <MapButton onClick={handleLocateMe} loading={geoStatus === "loading"}>
          📍 המיקום שלי
        </MapButton>
        <MapButton onClick={handleToggleFullscreen}>{fullscreen ? "יציאה ממסך מלא" : "מסך מלא"}</MapButton>
        <MapButton onClick={handleToggleClustering}>{clustering ? "🔘 בטל קיבוץ סמנים" : "🔘 קבץ סמנים"}</MapButton>
        {geoStatus === "denied" ? (
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", maxWidth: "160px", textAlign: "end" }}>
            הרשאת מיקום נדחתה — אי אפשר להציג מיקום נוכחי.
          </div>
        ) : null}
        {geoStatus === "error" ? (
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", maxWidth: "160px", textAlign: "end" }}>
            לא הצלחנו לקבל מיקום כרגע.
          </div>
        ) : null}
      </div>

      {selectedPlace ? <PlaceCard place={selectedPlace} onClose={() => setSelectedPlaceId(null)} /> : null}
    </div>
  );
}

function MapButton({
  children,
  onClick,
  loading,
}: {
  children: ReactNode;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      style={{
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-solid)",
        color: "var(--color-text)",
        borderRadius: "var(--radius-md)",
        padding: "0.5rem 0.75rem",
        fontSize: "0.8125rem",
        cursor: loading ? "default" : "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        whiteSpace: "nowrap",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? "…" : children}
    </button>
  );
}
