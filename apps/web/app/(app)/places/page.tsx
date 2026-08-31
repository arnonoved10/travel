import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getDocumentRepository, getFinanceRepository, getPlaceRepository, getTripPlaceRepository, getTripRepository } from "@travel-app/data-layer";
import type { Place, PlaceCategory } from "@travel-app/shared-types";
import { PLACE_CATEGORY_LABELS } from "@/lib/place-labels";
import { NavigateButtons } from "@/components/navigate-buttons";
import { OpenNowBadge } from "@/components/open-now-badge";
import { computePlaceStats, type PlaceStats } from "@/lib/place-stats";
import { formatMoney } from "@/lib/currency-format";
import { PersonalRatingSelect } from "@/components/personal-rating-select";
import { DeletePlaceButton } from "./delete-place-button";
import { ToggleFavoriteButton } from "./toggle-favorite-button";
import { ToggleDontReturnButton } from "./toggle-dont-return-button";
import { PlacePhotoGallery } from "./place-photo-gallery";
import { setPlacePersonalRatingAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; favorite?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { category, favorite } = await searchParams;
  const placeRepository = await getPlaceRepository();
  const allPlaces = await placeRepository.list({ userId: user.id });
  const favoriteOnly = favorite === "1";
  const places = allPlaces
    .filter((p) => !category || p.category === category)
    .filter((p) => !favoriteOnly || p.isFavorite);
  const favoritesCount = allPlaces.filter((p) => p.isFavorite).length;

  const categoriesInUse = Array.from(new Set(allPlaces.map((p) => p.category)));

  // "כמה פעמים הייתי / כמה הוצאתי" חוצה-טיולים — Place גלובלי, אז חייבים
  // לסרוק את כל הטיולים של המשתמש (כמו global-search.ts/trash), לא רק אחד.
  const [tripRepository, tripPlaceRepository, financeRepository] = await Promise.all([
    getTripRepository(),
    getTripPlaceRepository(),
    getFinanceRepository(),
  ]);
  const trips = await tripRepository.list({ userId: user.id });
  const tripIds = trips.map((trip) => trip.id);
  // שאילתה מקובצת אחת לכל אוסף במקום N (אחת לכל טיול) — ר' listForTrips/listExpensesForTrips.
  const [allTripPlaces, allExpenses] = await Promise.all([
    tripPlaceRepository.listForTrips({ userId: user.id, tripIds }),
    financeRepository.listExpensesForTrips({ tripIds }),
  ]);
  const placeStats = computePlaceStats({ tripPlaces: allTripPlaces, expenses: allExpenses });

  const documentRepository = await getDocumentRepository();
  // שאילתה מקובצת אחת במקום N (אחת לכל מקום) — ר' listForEntities.
  const placePhotos = await documentRepository.listForEntities({ entityType: "place", entityIds: places.map((p) => p.id) });
  const photosByPlaceId = new Map<string, typeof placePhotos>();
  for (const photo of placePhotos) {
    const list = photosByPlaceId.get(photo.entityId) ?? [];
    list.push(photo);
    photosByPlaceId.set(photo.entityId, list);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 style={{ marginTop: 0 }}>ספריית המקומות שלי</h1>
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

      <p style={{ color: "var(--color-text-muted)" }}>
        מקום שנשמר כאן זמין לכל טיול עתידי — לא רק לטיול שבו נוסף בפעם הראשונה.
      </p>

      {categoriesInUse.length > 0 ? (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <CategoryChip href={favoriteOnly ? "/places?favorite=1" : "/places"} label={`הכל (${allPlaces.length})`} active={!category} />
          {categoriesInUse.map((cat) => (
            <CategoryChip
              key={cat}
              href={`/places?category=${cat}${favoriteOnly ? "&favorite=1" : ""}`}
              label={PLACE_CATEGORY_LABELS[cat as PlaceCategory]}
              active={category === cat}
            />
          ))}
          <CategoryChip
            href={favoriteOnly ? `/places${category ? `?category=${category}` : ""}` : `/places?favorite=1${category ? `&category=${category}` : ""}`}
            label={`★ מועדפים (${favoritesCount})`}
            active={favoriteOnly}
          />
        </div>
      ) : null}

      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {places.map((place) => (
          <li
            key={place.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem",
              padding: "1rem",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              background: "var(--color-surface)",
            }}
          >
            <div style={{ minWidth: 0, flex: "1 1 220px" }}>
              <div style={{ fontWeight: 600 }}>
                {place.isFavorite ? "★ " : ""}
                {place.dontReturn ? "🚫 " : ""}
                {place.name}
              </div>
              <div style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                {PLACE_CATEGORY_LABELS[place.category]}
                {place.city ? ` · ${place.city}` : ""}
                {place.address ? ` · ${place.address}` : ""}
              </div>
              <PlaceStatsLine stats={placeStats.get(place.id)} />
              <PlaceContactLine place={place} />
              <OpenNowBadge openingHours={place.openingHours} />
              <PlacePhotoGallery placeId={place.id} documents={photosByPlaceId.get(place.id) ?? []} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <ToggleFavoriteButton placeId={place.id} isFavorite={place.isFavorite} />
              <ToggleDontReturnButton placeId={place.id} dontReturn={place.dontReturn} />
              <PersonalRatingSelect value={place.personalRating} onRate={setPlacePersonalRatingAction.bind(null, place.id)} />
              <NavigateButtons lat={place.lat} lng={place.lng} address={place.address} />
              <DeletePlaceButton placeId={place.id} />
            </div>
          </li>
        ))}
        {places.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>{favoriteOnly ? "אין עדיין מקומות מועדפים." : "אין מקומות בקטגוריה הזו."}</p>
        ) : null}
      </ul>
    </div>
  );
}

function PlaceStatsLine({ stats }: { stats: PlaceStats | undefined }) {
  if (!stats || (stats.visitCount === 0 && stats.spentByCurrency.size === 0)) return null;
  const parts: string[] = [];
  if (stats.visitCount > 0) parts.push(`ביקרתי ${stats.visitCount} פעמים`);
  if (stats.spentByCurrency.size > 0) {
    parts.push(`הוצאתי ${Array.from(stats.spentByCurrency.entries()).map(([c, a]) => formatMoney(a, c)).join(" · ")}`);
  }
  return <div style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", marginTop: "0.125rem" }}>{parts.join(" · ")}</div>;
}

function PlaceContactLine({ place }: { place: Place }) {
  const parts: React.ReactNode[] = [];
  if (place.phone) parts.push(<span key="phone">☎ {place.phone}</span>);
  if (place.whatsapp) parts.push(<span key="whatsapp">💬 {place.whatsapp}</span>);
  if (place.email) parts.push(<span key="email">✉ {place.email}</span>);
  if (place.officialWebsite) {
    parts.push(
      <a key="website" href={place.officialWebsite} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)" }}>
        🔗 אתר
      </a>,
    );
  }
  if (parts.length === 0) return null;
  return (
    <div style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", marginTop: "0.125rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {parts}
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
