"use client";

import { useState, useTransition } from "react";
import type { PlaceCategory, PoiCandidate } from "@travel-app/shared-types";
import { PLACE_CATEGORY_LABELS } from "@/lib/place-labels";
import { haversineDistanceKm } from "@/lib/haversine-distance";
import { PermissionDeniedState } from "@/components/blocked-state";
import { Select } from "@/components/ui/Select";
import { discoverNearbyPlacesAction, addDiscoveredPlaceAction } from "./actions";

type GeoState = { kind: "idle" } | { kind: "loading" } | { kind: "unsupported" } | { kind: "denied" } | { kind: "error" } | { kind: "ready"; lat: number; lng: number };

const DEFAULT_CATEGORIES: PlaceCategory[] = ["river", "viewpoint", "restaurant", "entertainment", "market", "mall"];
const RADIUS_OPTIONS_KM = [1, 2, 5, 10, 20];

const mutedStyle: React.CSSProperties = { color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 };

export function DiscoverPlaces({ tripId }: { tripId: string }) {
  const [geo, setGeo] = useState<GeoState>({ kind: "idle" });
  const [categories, setCategories] = useState<Set<PlaceCategory>>(new Set(DEFAULT_CATEGORIES));
  const [radiusKm, setRadiusKm] = useState(5);
  const [results, setResults] = useState<PoiCandidate[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [isSearching, startSearch] = useTransition();

  function toggleCategory(category: PlaceCategory) {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function handleSearch() {
    setSearchError(null);
    setResults(null);

    if (categories.size === 0) {
      setSearchError("בחר לפחות קטגוריה אחת.");
      return;
    }

    if (!("geolocation" in navigator)) {
      setGeo({ kind: "unsupported" });
      return;
    }

    setGeo({ kind: "loading" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGeo({ kind: "ready", lat, lng });
        startSearch(async () => {
          const result = await discoverNearbyPlacesAction(lat, lng, radiusKm, Array.from(categories));
          if (!result.ok) {
            setSearchError(result.error);
            return;
          }
          setResults(result.results);
        });
      },
      (error) => setGeo({ kind: error.code === error.PERMISSION_DENIED ? "denied" : "error" }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }

  function handleAdd(candidate: PoiCandidate) {
    startSearch(async () => {
      const result = await addDiscoveredPlaceAction(tripId, candidate);
      if (result.ok) {
        setAddedIds((prev) => new Set(prev).add(candidate.externalId));
      } else {
        setSearchError(result.error);
      }
    });
  }

  const myLocation = geo.kind === "ready" ? { lat: geo.lat, lng: geo.lng } : null;
  const sortedResults =
    results && myLocation
      ? [...results].sort((a, b) => haversineDistanceKm(myLocation.lat, myLocation.lng, a.lat, a.lng) - haversineDistanceKm(myLocation.lat, myLocation.lng, b.lat, b.lng))
      : results;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
        {Object.entries(PLACE_CATEGORY_LABELS).map(([value, label]) => {
          const category = value as PlaceCategory;
          const active = categories.has(category);
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggleCategory(category)}
              style={{
                padding: "0.25rem 0.625rem",
                borderRadius: "999px",
                border: active ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                background: active ? "var(--color-primary)" : "transparent",
                color: active ? "white" : "var(--color-text)",
                cursor: "pointer",
                fontSize: "0.75rem",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem" }}>
          רדיוס
          <Select
            value={String(radiusKm)}
            onChange={(v) => setRadiusKm(Number(v))}
            style={{ padding: "0.25rem 0.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-elevated)", color: "var(--color-text-primary)" }}
            options={RADIUS_OPTIONS_KM.map((km) => ({ value: String(km), label: `${km} ק"מ` }))}
          />
        </label>
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching || geo.kind === "loading"}
          style={{
            padding: "0.5rem 0.875rem",
            borderRadius: "var(--radius-full)",
            border: "none",
            background: isSearching || geo.kind === "loading" ? "var(--color-secondary)" : "var(--gradient-brand)",
            color: isSearching || geo.kind === "loading" ? "var(--color-text-muted)" : "#fff",
            fontWeight: 700,
            cursor: isSearching || geo.kind === "loading" ? "default" : "pointer",
            fontSize: "0.8125rem",
            boxShadow: isSearching || geo.kind === "loading" ? "none" : "var(--glow-brand)",
          }}
        >
          {geo.kind === "loading" ? "מאתר מיקום…" : isSearching ? "מחפש…" : "🔎 חפש מקומות"}
        </button>
      </div>

      {geo.kind === "unsupported" ? <PermissionDeniedState message="הדפדפן הזה לא תומך באיתור מיקום — אי אפשר לחפש מקומות בקרבתך." /> : null}
      {geo.kind === "denied" ? (
        <PermissionDeniedState message="לא ניתנה הרשאת מיקום — אי אפשר לחפש מקומות בקרבתך." onRetry={handleSearch} showInstructions />
      ) : null}
      {geo.kind === "error" ? <PermissionDeniedState message="לא הצלחנו לאתר את המיקום שלך כרגע." onRetry={handleSearch} /> : null}
      {searchError ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{searchError}</span> : null}

      {sortedResults ? (
        sortedResults.length === 0 ? (
          <p style={mutedStyle}>לא נמצאו מקומות בקטגוריות שנבחרו ברדיוס הזה.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {sortedResults.map((candidate) => {
              const distanceKm = myLocation ? haversineDistanceKm(myLocation.lat, myLocation.lng, candidate.lat, candidate.lng) : null;
              const added = addedIds.has(candidate.externalId);
              return (
                <li
                  key={candidate.externalId}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", padding: "0.5rem 0.625rem", borderRadius: "var(--radius-md)", background: "var(--color-surface-elevated)" }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{candidate.name}</div>
                    <div style={mutedStyle}>
                      {PLACE_CATEGORY_LABELS[candidate.category]}
                      {distanceKm !== null ? ` · ${distanceKm.toFixed(1)} ק"מ` : ""}
                      {candidate.address ? ` · ${candidate.address}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={added || isSearching}
                    onClick={() => handleAdd(candidate)}
                    style={{
                      padding: "0.25rem 0.625rem",
                      borderRadius: "var(--radius-full)",
                      border: added
                        ? "1px solid color-mix(in srgb, var(--color-success, #1f9d78) 30%, transparent)"
                        : "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
                      background: added
                        ? "color-mix(in srgb, var(--color-success, #1f9d78) 14%, transparent)"
                        : "color-mix(in srgb, var(--color-primary) 14%, transparent)",
                      color: added ? "var(--color-success, #1f9d78)" : "var(--color-primary)",
                      fontWeight: 600,
                      cursor: added ? "default" : "pointer",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {added ? "✓ נוסף" : "➕ הוסף לספרייה"}
                  </button>
                </li>
              );
            })}
          </ul>
        )
      ) : null}
    </div>
  );
}
