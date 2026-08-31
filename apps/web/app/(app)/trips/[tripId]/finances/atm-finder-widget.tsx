"use client";

import { useState, useTransition } from "react";
import { haversineDistanceKm } from "@/lib/haversine-distance";
import { PermissionDeniedState } from "@/components/blocked-state";
import { findAtmsNearMeAction } from "./actions";
import { WalletTopUpForm } from "./wallet-top-up-form";
import type { AtmCandidate } from "@travel-app/data-layer";

type GeoState = { kind: "idle" } | { kind: "loading" } | { kind: "unsupported" } | { kind: "denied" } | { kind: "error" } | { kind: "ready"; lat: number; lng: number };

const mutedStyle: React.CSSProperties = { color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 };

/** מוצג ליד סיכום הארנקים — כספומט קרוב, לפי המיקום החי שלי (לא מיקום הארנק, שאין לו כתובת).
 * אחרי שנמצא כספומט, מציג את טופס טעינת-הארנק הקיים (לא טופס חדש) — כדי שמשיכה
 * בפועל תירשם בו-במקום, בלי לצאת מהוידג'ט הזה ולחפש את הטופס למטה. */
export function AtmFinderWidget({ tripId, preferredCurrencyCodes }: { tripId: string; preferredCurrencyCodes?: string[] }) {
  const [geo, setGeo] = useState<GeoState>({ kind: "idle" });
  const [results, setResults] = useState<AtmCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFind() {
    setError(null);
    setResults(null);
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
        startTransition(async () => {
          const response = await findAtmsNearMeAction(lat, lng, 2);
          if (!response.ok) {
            setError(response.error);
            return;
          }
          setResults(response.results);
        });
      },
      (err) => setGeo({ kind: err.code === err.PERMISSION_DENIED ? "denied" : "error" }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }

  const myLocation = geo.kind === "ready" ? { lat: geo.lat, lng: geo.lng } : null;
  const sorted = results && myLocation ? [...results].sort((a, b) => haversineDistanceKm(myLocation.lat, myLocation.lng, a.lat, a.lng) - haversineDistanceKm(myLocation.lat, myLocation.lng, b.lat, b.lng)) : results;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <button
        type="button"
        onClick={handleFind}
        disabled={isPending || geo.kind === "loading"}
        style={{
          alignSelf: "flex-start",
          padding: "0.5rem 0.875rem",
          borderRadius: "var(--radius-full)",
          border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
          background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
          color: "var(--color-primary)",
          fontWeight: 600,
          cursor: isPending || geo.kind === "loading" ? "default" : "pointer",
          fontSize: "0.8125rem",
        }}
      >
        {geo.kind === "loading" ? "מאתר מיקום…" : isPending ? "מחפש…" : "🏧 מצא כספומט קרוב"}
      </button>

      {geo.kind === "unsupported" ? <PermissionDeniedState message="הדפדפן הזה לא תומך באיתור מיקום." /> : null}
      {geo.kind === "denied" ? <PermissionDeniedState message="לא ניתנה הרשאת מיקום." onRetry={handleFind} showInstructions /> : null}
      {geo.kind === "error" ? <PermissionDeniedState message="לא הצלחנו לאתר את המיקום שלך כרגע." onRetry={handleFind} /> : null}
      {error ? <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{error}</span> : null}

      {sorted ? (
        sorted.length === 0 ? (
          <p style={mutedStyle}>לא נמצא כספומט ברדיוס 2 ק&quot;מ.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {sorted.map((atm) => {
              const distanceKm = myLocation ? haversineDistanceKm(myLocation.lat, myLocation.lng, atm.lat, atm.lng) : null;
              return (
                <li key={atm.externalId} style={mutedStyle}>
                  {atm.name}
                  {distanceKm !== null ? ` · ${(distanceKm * 1000).toFixed(0)} מ'` : ""}
                  {atm.address ? ` · ${atm.address}` : ""}
                </li>
              );
            })}
          </ul>
        )
      ) : null}

      {results ? (
        <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <p style={mutedStyle}>משכת כסף? הוסיפו אותו לארנק:</p>
          <WalletTopUpForm tripId={tripId} preferredCurrencyCodes={preferredCurrencyCodes} />
        </div>
      ) : null}
    </div>
  );
}
