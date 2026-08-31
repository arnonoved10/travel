/** Usable both server- and client-side (plain env read) — lets a server component decide
 * up front whether to even ship the Mapbox client bundle to the browser. */
export function isMapProviderConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
}

export function getMapboxToken(): string | null {
  return process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null;
}
