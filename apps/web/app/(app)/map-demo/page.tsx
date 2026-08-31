import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPlaceRepository } from "@travel-app/data-layer";
import { isMapProviderConfigured } from "@/lib/map/config";
import { TokenMissingPanel } from "./token-missing-panel";
import { DemoMapView } from "./demo-map-view";

export const dynamic = "force-dynamic";

const DEFAULT_CENTER: [number, number] = [13.7563, 100.5018]; // Bangkok — matches the seeded demo places

export default async function MapDemoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const configured = isMapProviderConfigured();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%" }}>
      <div>
        <div
          style={{
            display: "inline-block",
            fontSize: "0.6875rem",
            fontWeight: 700,
            color: "#ffcc66",
            background: "#3b2a00",
            border: "1px solid #7a5a00",
            borderRadius: "999px",
            padding: "0.125rem 0.625rem",
            marginBottom: "0.375rem",
          }}
        >
          מסך הדגמה — לא בניווט הראשי עדיין
        </div>
        <h1 style={{ margin: 0, fontSize: "1.375rem" }}>Demo Map — מפה תלת-ממדית</h1>
        <p style={{ margin: "0.25rem 0 0", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          מוכיח את שכבת ה-MapProvider (Mapbox GL JS, Standard style) לפני שילוב מלא במסך /map הקיים.
        </p>
      </div>

      {!configured ? (
        <TokenMissingPanel />
      ) : (
        <DemoMapContent userId={user.id} />
      )}
    </div>
  );
}

async function DemoMapContent({ userId }: { userId: string }) {
  const placeRepository = await getPlaceRepository();
  const allPlaces = await placeRepository.list({ userId });
  const plotted = allPlaces.filter((p) => p.lat !== null && p.lng !== null);

  const center: [number, number] =
    plotted.length > 0
      ? [
          plotted.reduce((sum, p) => sum + (p.lat ?? 0), 0) / plotted.length,
          plotted.reduce((sum, p) => sum + (p.lng ?? 0), 0) / plotted.length,
        ]
      : DEFAULT_CENTER;

  return (
    <div style={{ flex: 1, minHeight: "480px", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--color-border)" }}>
      <DemoMapView places={plotted} center={center} zoom={plotted.length > 0 ? 13 : 11} />
    </div>
  );
}
