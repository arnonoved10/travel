import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPlaceRecommendationRepository, getTripGeographyRepository, getTripRepository } from "@travel-app/data-layer";
import { isPlacesRecommendationsConfigured } from "@/lib/recommendations/config";
import { BlockedIntegrationState } from "@/components/blocked-state";
import { GenerateRecommendationsButton } from "./generate-recommendations-button";

export const dynamic = "force-dynamic";

interface Scope {
  label: string;
  countryName: string | null;
}

export default async function TripRecommendationsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { tripId } = await params;
  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId: user.id, tripId });
  if (!trip) notFound();

  const configured = isPlacesRecommendationsConfigured();

  const tripGeographyRepository = await getTripGeographyRepository();
  const [tripCountries, tripCities] = await Promise.all([
    tripGeographyRepository.listCountries({ tripId }),
    tripGeographyRepository.listCities({ tripId }),
  ]);
  const countryNameById = new Map(tripCountries.map((c) => [c.id, c.countryName]));

  // סקופ = יעד שממנו נשלפות המלצות: ערים אם יש, אחרת מדינות. אף פעם לא שתיהן
  // יחד — כדי לא לשלוח שאילתות כפולות לאותו אזור בפועל.
  const scopes: Scope[] =
    tripCities.length > 0
      ? tripCities.map((c) => ({ label: c.cityName, countryName: c.countryId ? (countryNameById.get(c.countryId) ?? null) : null }))
      : tripCountries.map((c) => ({ label: c.countryName, countryName: null }));

  const placeRecommendationRepository = await getPlaceRecommendationRepository();
  const allRecommendations = configured ? await placeRecommendationRepository.listForTrip({ tripId }) : [];
  const recommendationsByScope = new Map<string, typeof allRecommendations>();
  for (const rec of allRecommendations) {
    const list = recommendationsByScope.get(rec.scopeLabel) ?? [];
    list.push(rec);
    recommendationsByScope.set(rec.scopeLabel, list);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
          <Link href={`/trips/${tripId}`}>{trip.name}</Link>
        </p>
        <h1 style={{ marginTop: 0, marginBottom: "0.25rem" }}>המלצות מקומות</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          חיפוש אמיתי דרך Google Places לכל יעד בטיול — לא הצעות מומצאות. אפשר להוסיף כל תוצאה לרשימת המקומות שלך בלחיצה אחת.
        </p>
      </div>

      {!configured ? (
        <BlockedIntegrationState
          title="המלצות מקומות עדיין לא מחוברות"
          description="המסך הזה שולף המלצות אמיתיות מ-Google Places (לא טקסט שנוצר על-ידי AI) — כדי שהוא יעבוד צריך GOOGLE_PLACES_API_KEY אמיתי בקובץ apps/web/.env.local."
          steps={[
            <>
              פתח חשבון ב-
              <a href="https://console.cloud.google.com/google/maps-apis/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                {" "}
                Google Cloud Console
              </a>{" "}
              והפעל את &quot;Places API (New)&quot;
            </>,
            "צור API Key והגבל אותו ל-Places API בלבד",
            "הדבק אותו בתור ערך GOOGLE_PLACES_API_KEY ב-apps/web/.env.local והפעל מחדש את שרת הפיתוח",
          ]}
          footnote="Google Places מחייב לפי שימוש בפועל — יש מכסה חינמית חודשית, ראה mapsplatform.google.com/pricing."
        />
      ) : scopes.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>הוסף מדינות/ערים לטיול (בסעיף &quot;גאוגרפיה&quot; בעמוד הטיול) כדי לקבל המלצות ליעדים שלך.</p>
      ) : (
        scopes.map((scope) => {
          const recs = recommendationsByScope.get(scope.label) ?? [];
          return (
            <section
              key={scope.label}
              style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-surface)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <h2 style={{ fontSize: "1.0625rem", margin: 0 }}>
                  {scope.label}
                  {scope.countryName ? <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}> · {scope.countryName}</span> : null}
                </h2>
                <GenerateRecommendationsButton tripId={tripId} scopeLabel={scope.label} countryName={scope.countryName} hasExisting={recs.length > 0} />
              </div>

              {recs.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", margin: 0 }}>עדיין אין המלצות ליעד הזה.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem" }}>
                  {recs.map((rec) => (
                    <div
                      key={rec.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.375rem",
                        padding: "0.75rem",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-surface-elevated)",
                      }}
                    >
                      {rec.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rec.photoUrl}
                          alt={rec.name}
                          style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "var(--radius-sm)" }}
                        />
                      ) : null}
                      <div style={{ fontWeight: 600 }}>{rec.name}</div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                        {rec.category ?? ""}
                        {rec.rating !== null ? ` · ⭐ ${rec.rating}${rec.userRatingsTotal !== null ? ` (${rec.userRatingsTotal})` : ""}` : ""}
                      </div>
                      {rec.address ? <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{rec.address}</div> : null}
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                        <a href={rec.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8125rem", color: "var(--color-primary)" }}>
                          📍 ניווט
                        </a>
                        <Link
                          href={`/places/new?name=${encodeURIComponent(rec.name)}${rec.address ? `&address=${encodeURIComponent(rec.address)}` : ""}${scope.countryName ? `&country=${encodeURIComponent(scope.countryName)}` : ""}&city=${encodeURIComponent(scope.label)}`}
                          style={{ fontSize: "0.8125rem", color: "var(--color-primary)" }}
                        >
                          ➕ הוסף לרשימת מקומות
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
