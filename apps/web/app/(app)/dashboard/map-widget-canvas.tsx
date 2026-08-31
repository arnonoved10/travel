"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { getMapProvider } from "@/lib/map/get-map-provider";
import type { MapProvider, MapMarkerSpec } from "@/lib/map/types";

/** Compact, read-only preview — no style switcher/nearby/geolocation (those live on the
 * full Demo Map). Just proves the same MapProvider renders real markers inside a small
 * dashboard card, with a CTA out to the full experience. */
export function MapWidgetCanvas({ markers, center, zoom }: { markers: MapMarkerSpec[]; center: [number, number]; zoom: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const providerRef = useRef<MapProvider | null>(null);
  const { resolvedMode } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const provider = getMapProvider();
    providerRef.current = provider;
    provider.init(container, { center, zoom, pitch: 45, theme: resolvedMode });
    provider.setMarkers(markers);
    const unsubLoad = provider.on("load", () => setReady(true));

    return () => {
      unsubLoad();
      provider.destroy();
      providerRef.current = null;
    };
    // Mount-only, same reasoning as demo-map-canvas.tsx — this is a static preview,
    // not an interactive session that needs to react to marker-list churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready) providerRef.current?.setTheme(resolvedMode);
  }, [resolvedMode, ready]);

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
            fontSize: "0.8125rem",
          }}
        >
          טוען מפה…
        </div>
      ) : null}
    </div>
  );
}
