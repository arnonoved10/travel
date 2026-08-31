import type { MapProvider } from "./types";
import { isMapProviderConfigured } from "./config";
import { UnconfiguredMapProvider } from "./null-provider";
import { MapboxMapProvider } from "./mapbox-provider";

/**
 * Client-only factory — must be called inside a "use client" component's effect, never
 * at module scope, since the token needs to exist at runtime in the browser bundle.
 */
export function getMapProvider(): MapProvider {
  if (!isMapProviderConfigured()) {
    return new UnconfiguredMapProvider();
  }
  return new MapboxMapProvider();
}
