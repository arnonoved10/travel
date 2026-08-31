import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ChecklistItem } from "@travel-app/shared-types";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getChecklistItemRepository, getTripGeographyRepository, getTripPlaceRepository, getTripRepository, getWeatherProvider } from "@travel-app/data-layer";
import { suggestPackingItemsForWeather } from "@/lib/packing-weather-suggestions";
import { suggestPackingItemsForTripType } from "@/lib/packing-trip-type-suggestions";
import { suggestDocumentChecksForCountries } from "@/lib/document-check-suggestions";
import { ChecklistItemForm } from "./checklist-item-form";
import { ChecklistItemRow } from "./checklist-item-row";
import { ChecklistSuggestionsPanel } from "./checklist-suggestions-panel";

export const dynamic = "force-dynamic";

function groupByCategory(items: ChecklistItem[]): Map<string, ChecklistItem[]> {
  const map = new Map<string, ChecklistItem[]>();
  for (const item of items) {
    const key = item.category ?? "אחר";
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

function ProgressLabel({ items }: { items: ChecklistItem[] }) {
  const done = items.filter((i) => i.isDone).length;
  return (
    <span style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
      {done}/{items.length}
      {items.length > 0 ? ` (${Math.round((done / items.length) * 100)}%)` : ""}
    </span>
  );
}

export default async function TripPackingPage({ params }: { params: Promise<{ tripId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { tripId } = await params;
  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId: user.id, tripId });
  if (!trip) notFound();

  const checklistItemRepository = await getChecklistItemRepository();
  const [packingItems, beforeTripItems] = await Promise.all([
    checklistItemRepository.listForTrip({ tripId, listType: "packing" }),
    checklistItemRepository.listForTrip({ tripId, listType: "before_trip" }),
  ]);

  const packingByCategory = groupByCategory(packingItems);

  // הצעות-אריזה לפי מזג-אוויר: אותו דפוס "מיקום ראשון עם קואורדינטות" כמו
  // ב-/today — אין ממציאים מיקום, אם אין מקום מקושר עם lat/lng פשוט אין הצעות.
  const tripPlaceRepository = await getTripPlaceRepository();
  const tripPlaces = await tripPlaceRepository.listForTrip({ userId: user.id, tripId });
  const weatherPlace = tripPlaces.find((tp) => tp.place.lat !== null && tp.place.lng !== null)?.place;

  let weatherSuggestions: ReturnType<typeof suggestPackingItemsForWeather> = [];
  if (weatherPlace?.lat !== undefined && weatherPlace?.lat !== null && weatherPlace?.lng !== undefined && weatherPlace?.lng !== null) {
    try {
      const tripLengthDays =
        Math.round((new Date(`${trip.endDate}T00:00:00Z`).getTime() - new Date(`${trip.startDate}T00:00:00Z`).getTime()) / 86_400_000) + 1;
      const weatherProvider = getWeatherProvider();
      const dailyForecast = await weatherProvider.getDailyForecast(
        { lat: weatherPlace.lat, lng: weatherPlace.lng },
        { days: Math.min(Math.max(tripLengthDays, 1), 16) },
      );
      weatherSuggestions = suggestPackingItemsForWeather(dailyForecast);
    } catch {
      weatherSuggestions = [];
    }
  }
  const existingPackingNames = new Set(packingItems.map((item) => item.name.trim().toLowerCase()));
  const newWeatherSuggestions = weatherSuggestions.filter((s) => !existingPackingNames.has(s.name.trim().toLowerCase()));

  const tripTypeSuggestions = suggestPackingItemsForTripType(trip.tripType);
  const newTripTypeSuggestions = tripTypeSuggestions.filter((s) => !existingPackingNames.has(s.name.trim().toLowerCase()));

  const tripGeographyRepository = await getTripGeographyRepository();
  const tripCountries = await tripGeographyRepository.listCountries({ tripId });
  const documentCheckSuggestions = suggestDocumentChecksForCountries(tripCountries.map((c) => c.countryName));
  const existingBeforeTripNames = new Set(beforeTripItems.map((item) => item.name.trim().toLowerCase()));
  const newDocumentCheckSuggestions = documentCheckSuggestions.filter((s) => !existingBeforeTripNames.has(s.name.trim().toLowerCase()));

  const sectionStyle = {
    padding: "1rem",
    borderRadius: "10px",
    border: "1px solid var(--color-border)",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <Link href={`/trips/${tripId}`} style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          ← {trip.name}
        </Link>
        <h1 style={{ marginTop: "0.25rem", marginBottom: 0 }}>רשימת אריזה וצ&apos;קליסט לפני הטיול</h1>
      </div>

      <section style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.125rem", margin: 0 }}>🧳 רשימת אריזה</h2>
          <ProgressLabel items={packingItems} />
        </div>

        {packingItems.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", margin: 0 }}>אין עדיין פריטים ברשימת האריזה.</p>
        ) : (
          Array.from(packingByCategory.entries()).map(([category, items]) => (
            <div key={category}>
              <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.25rem" }}>{category}</div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {items.map((item) => (
                  <ChecklistItemRow key={item.id} tripId={tripId} item={item} />
                ))}
              </ul>
            </div>
          ))
        )}

        <ChecklistSuggestionsPanel
          tripId={tripId}
          listType="packing"
          title="🌦️ הצעות לפי מזג האוויר הצפוי בטיול"
          suggestions={newWeatherSuggestions}
        />

        <ChecklistSuggestionsPanel
          tripId={tripId}
          listType="packing"
          title="🎒 הצעות לפי סוג הטיול"
          suggestions={newTripTypeSuggestions}
        />

        <ChecklistItemForm tripId={tripId} listType="packing" showCategory />
      </section>

      <section style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.125rem", margin: 0 }}>✅ לפני הטיול</h2>
          <ProgressLabel items={beforeTripItems} />
        </div>

        {beforeTripItems.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", margin: 0 }}>אין עדיין משימות ברשימה.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {beforeTripItems.map((item) => (
              <ChecklistItemRow key={item.id} tripId={tripId} item={item} />
            ))}
          </ul>
        )}

        <ChecklistSuggestionsPanel
          tripId={tripId}
          listType="before_trip"
          title="🛂 בדיקות לפני נסיעה"
          suggestions={newDocumentCheckSuggestions}
        />

        <ChecklistItemForm tripId={tripId} listType="before_trip" showCategory={false} />
      </section>
    </div>
  );
}
