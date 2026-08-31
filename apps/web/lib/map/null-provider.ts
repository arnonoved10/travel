import type { MapProvider, MapProviderInitOptions, MapMarkerSpec, MapStyleId } from "./types";

/**
 * Safe no-op MapProvider returned when no Mapbox token is configured, so consumers
 * never need to null-check `getMapProvider()`. Deliberately does nothing in `init()` —
 * it never touches Mapbox GL or the network. Consuming UI is expected to check
 * `isMapProviderConfigured()` up front and render a "not connected" panel instead
 * of calling `init()` at all (see the Demo Map page).
 */
export class UnconfiguredMapProvider implements MapProvider {
  readonly name = "unconfigured";
  readonly capabilities = {
    supports3d: false,
    supportsSatellite: false,
    supportsStyleSwitch: false,
    supportedStyles: [] as MapStyleId[],
    supportsClustering: false,
  };

  init(_container: HTMLElement, _options: MapProviderInitOptions): void {}
  destroy(): void {}
  setStyle(_style: MapStyleId): void {}
  setTheme(_theme: "dark" | "light"): void {}
  setPitch(_pitch: number): void {}
  flyTo(_center: [number, number]): void {}
  fitBounds(_bounds: [[number, number], [number, number]]): void {}
  setMarkers(_markers: MapMarkerSpec[]): void {}
  setUserLocation(_coords: { lat: number; lng: number } | null): void {}
  setPendingMarker(_coords: { lat: number; lng: number } | null, _label?: string): void {}
  enableClustering(_enabled: boolean): void {}
  fullscreen(_enabled: boolean): void {}
  resize(): void {}
  on(): () => void {
    return () => {};
  }
}
