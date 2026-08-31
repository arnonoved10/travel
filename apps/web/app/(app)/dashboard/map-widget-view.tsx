"use client";

import dynamic from "next/dynamic";
import type { MapMarkerSpec } from "@/lib/map/types";

// Same window/document constraint as demo-map-view.tsx / app/(app)/map/map-view.tsx —
// ssr:false must live in a "use client" file.
const MapWidgetCanvas = dynamic(() => import("./map-widget-canvas").then((m) => m.MapWidgetCanvas), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
      טוען מפה…
    </div>
  ),
});

export function MapWidgetView({ markers, center, zoom }: { markers: MapMarkerSpec[]; center: [number, number]; zoom: number }) {
  return <MapWidgetCanvas markers={markers} center={center} zoom={zoom} />;
}
