import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPlaceRepository, getTripRepository } from "@travel-app/data-layer";
import type { PlaceCategory } from "@travel-app/shared-types";
import { PLACE_CATEGORY_LABELS } from "@/lib/place-labels";
import { NavigateButtons } from "@/components/navigate-buttons";
import { MapPageInteractive } from "./map-page-interactive";

export const dynamic = "force-dynamic";

const DEFAULT_CENTER: [number, number] = [20, 0];

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tripId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { category, tripId } = await searchParams;

  // מצב-טיול: מגיע מקישור "חפש והוסף מקום חדש במפה" בעמוד הטיול (מקומות
  // בטיול). מאמת בעלות לפני שמעבירים הלאה — tripId חבוי בטופס אחר-כך.
  const trip = tripId ? await (await getTripRepository()).getById({ userId: user.id, tripId }) : null;

  const placeRepository = await getPlaceRepository();
  const allPlaces = await placeRepository.list({ userId: user.id });
  const places = category ? allPlaces.filter((p) => p.category === category) : allPlaces;

  const categoriesInUse = Array.from(new Set(allPlaces.map((p) => p.category)));

  const plotted = places.filter((p) => p.lat !== null && p.lng !== null);
  const unplotted = places.filter((p) => p.lat === null || p.lng === null);

  const center: [number, number] =
    plotted.length > 0
      ? [
          plotted.reduce((sum, p) => sum + (p.lat ?? 0), 0) / plotted.length,
          plotted.reduce((sum, p) => sum + (p.lng ?? 0), 0) / plotted.length,
        ]
      : DEFAULT_CENTER;
  const zoom = plotted.length === 0 ? 2 : plotted.length === 1 ? 12 : 5;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ marginTop: 0, marginBottom: 0 }}>מפה</h1>
        <Link
          href="/places/new"
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius-full)",
            background: "var(--gradient-brand)",
            boxShadow: "var(--glow-brand)",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          + מקום חדש
        </Link>
      </div>

      {categoriesInUse.length > 0 ? (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <CategoryChip href="/map" label={`הכל (${allPlaces.length})`} active={!category} />
          {categoriesInUse.map((cat) => (
            <CategoryChip
              key={cat}
              href={`/map?category=${cat}`}
              label={PLACE_CATEGORY_LABELS[cat as PlaceCategory]}
              active={category === cat}
            />
          ))}
        </div>
      ) : null}

      {plotted.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>
          אין עדיין מקומות עם קואורדינטות (lat/lng) להצגה על המפה. אפשר להוסיף אותן ביצירת מקום חדש.
        </p>
      ) : null}

      <MapPageInteractive places={plotted} center={center} zoom={zoom} tripId={trip?.id} tripName={trip?.name} />

      {unplotted.length > 0 ? (
        <section>
          <h2 style={{ fontSize: "1rem" }}>מקומות בלי קואורדינטות ({unplotted.length})</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
            לא ניתן להציג אותם על המפה, אבל אם יש להם כתובת עדיין אפשר לנווט אליהם.
          </p>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {unplotted.map((place) => (
              <li
                key={place.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-surface)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{place.name}</div>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                    {PLACE_CATEGORY_LABELS[place.category]}
                    {place.address ? ` · ${place.address}` : ""}
                  </div>
                </div>
                <NavigateButtons lat={place.lat} lng={place.lng} address={place.address} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function CategoryChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        padding: "0.375rem 0.75rem",
        borderRadius: "999px",
        border: "1px solid var(--color-border)",
        background: active ? "var(--color-primary)" : "transparent",
        color: active ? "white" : "var(--color-text)",
        textDecoration: "none",
        fontSize: "0.8125rem",
      }}
    >
      {label}
    </Link>
  );
}
