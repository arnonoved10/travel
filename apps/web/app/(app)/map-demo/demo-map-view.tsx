"use client";

import dynamic from "next/dynamic";
import type { Place } from "@travel-app/shared-types";

// Mapbox GL, like Leaflet in app/(app)/map, touches window/document directly and can't
// render server-side — ssr:false is only allowed inside a "use client" file, so the
// dynamic import has to live here (mirrors app/(app)/map/map-view.tsx).
const DemoMapCanvas = dynamic(() => import("./demo-map-canvas").then((m) => m.DemoMapCanvas), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
      טוען מפה…
    </div>
  ),
});

export function DemoMapView({ places, center, zoom }: { places: Place[]; center: [number, number]; zoom: number }) {
  return <DemoMapCanvas places={places} center={center} zoom={zoom} />;
}
