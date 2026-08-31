import Link from "next/link";
import { Check, Airplane } from "@phosphor-icons/react/ssr";
import type { HotelStay, Trip } from "@travel-app/shared-types";
import { countryFlagEmoji } from "@/lib/country-flags";
import { getDestinationPhotos } from "@/lib/destination-photos";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressRing } from "@/components/ui/ProgressRing";

type StopStatus = "completed" | "current" | "next" | "future";

interface RouteStop {
  hotelId: string;
  city: string;
  country: string | null;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  status: StopStatus;
}

const STATUS_LABEL: Record<StopStatus, string> = { completed: "בוצע", current: "נוכחי", next: "הבא", future: "עתידי" };
const STATUS_COLOR: Record<StopStatus, string> = {
  completed: "var(--color-success)",
  current: "var(--color-accent-purple)",
  next: "var(--color-accent-blue)",
  future: "var(--color-text-muted)",
};

/** best-effort, לא מקטע-שלפני-אחרון (זה נכשל על כתובות אמיתיות — נבדק מול
 * נתונים בפועל: "293, Pattaya, 16 Nongprue..., Amphoe Bang Lamung, Chang Wat
 * Chon Buri 20150, תאילנד" נתן "Chang Wat Chon Buri 20150" בתור עיר, ו-"הירקון
 * 205, תל אביב-יפו, 6340506, ישראל" נתן "6340506" — שניהם קודי-מיקוד/מחוז, לא
 * עיר). כתובות מפורמטות (גוגל) הן בד"כ [רחוב, עיר, ..., מדינה] — מקטע-1 (לא
 * אחרון-שני) הוא העיר בכל המקרים שנבדקו. כתובת דו-מקטעית ("עיר, מדינה") היא
 * היוצא-מהכלל היחיד — שם מקטע-0 הוא העיר. בלי כתובת — נופל לשם המלון, לא
 * ל"עיר לא ידועה" מומצא. */
function deriveCityCountry(address: string | null, hotelName: string): { city: string; country: string | null } {
  if (!address) return { city: hotelName, country: null };
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { city: hotelName, country: null };
  if (parts.length === 1) return { city: parts[0]!, country: null };
  if (parts.length === 2) return { city: parts[0]!, country: parts[1]! };
  return { city: parts[1]!, country: parts[parts.length - 1]! };
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const [y1, m1, d1] = checkIn.split("-").map(Number);
  const [y2, m2, d2] = checkOut.split("-").map(Number);
  const a = Date.UTC(y1!, m1! - 1, d1!);
  const b = Date.UTC(y2!, m2! - 1, d2!);
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/** "30 באפריל" — יום+חודש בעברית, בדיוק כמו formatNightLabel ב-no-hotel-nights.tsx
 * (אותו pattern, בלי weekday כאן כי יש כבר תג-תאריך מספרי נפרד מתחת). */
function formatHumanDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("he-IL", { day: "numeric", month: "long" });
}

/** "30.04" — תג-תאריך קומפקטי, נגזר ישירות מ-ISO בלי Intl (בלי תלות ב-timezone). */
function formatShortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
}

/** ציר-המסלול נגזר במלואו ממלונות אמיתיים שכבר קיימים (checkInDate/checkOutDate/
 * address) — בלי ישות "יעד" חדשה ובלי migration, לפי הנחיית "אל תבצע שינויים
 * גדולים במסד-הנתונים שאינם הכרחיים למסך הראשי". כל מלון = תחנה אחת בציר, לפי
 * סדר ההגעה. אם אין מלונות בכלל — מצב-ריק כן, לא ציר מומצא.
 *
 * תחנות מוצגות כ"פינים" על-גבי קו מקווקו (לפי המוקאפ) — לא תמונת-רקע אמיתית
 * של היעד (אין לנו כזו בלי לזייף/לנחש, ר' עקרון "בלי נתוני-דמה"); הרקע כאן
 * הוא גרדיאנט אווירתי דקורטיבי בלבד, לא טענה על מקום ספציפי. */
export function TripRouteCard({
  trip,
  hotelStays,
  today,
  dayDates,
  hideProgressBar = false,
}: {
  trip: Trip;
  hotelStays: HotelStay[];
  today: string;
  dayDates: string[];
  /** במובייל, מספר-היום/האחוז/הימים-שנותרו כבר מוצגים בכרטיס-הטיול המרכזי
   * שבראש העמוד (ר' mobile-trip-hero-card.tsx) — כאן התפקיד הוא רק תחנות-
   * המסלול, בלי לשכפל את אותו מידע פעמיים באותו מסך. */
  hideProgressBar?: boolean;
}) {
  const stops: RouteStop[] = [...hotelStays]
    .sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))
    .map((h) => {
      const { city, country } = deriveCityCountry(h.address, h.hotelName);
      const status: StopStatus = h.checkOutDate <= today ? "completed" : h.checkInDate <= today && today < h.checkOutDate ? "current" : "future";
      return { hotelId: h.id, city, country, checkInDate: h.checkInDate, checkOutDate: h.checkOutDate, nights: nightsBetween(h.checkInDate, h.checkOutDate), status };
    });
  const firstFutureIndex = stops.findIndex((s) => s.status === "future");
  if (firstFutureIndex !== -1) stops[firstFutureIndex]!.status = "next";
  const currentIndex = stops.findIndex((s) => s.status === "current");

  const totalDays = dayDates.length;
  const todayIndex = dayDates.indexOf(today);
  const beforeTrip = totalDays > 0 && today < dayDates[0]!;
  const afterTrip = totalDays > 0 && today > dayDates[totalDays - 1]!;
  const dayNumber = todayIndex >= 0 ? todayIndex + 1 : afterTrip ? totalDays : 0;
  const elapsedDays = beforeTrip ? 0 : afterTrip ? totalDays : dayNumber;
  const remainingDays = totalDays - elapsedDays;
  const percent = totalDays > 0 ? Math.round((elapsedDays / totalDays) * 100) : 0;

  const stopCount = stops.length;
  // תמונת-רקע אמיתית של היעד — אותו מנגנון בדיוק כמו trip-hero-card.tsx
  // (Trip.coverImageUrl אם קיים, אחרת תצלום-אמיתי-מתויג לפי מילות-מפתח
  // בשם/הערות הטיול, Wikimedia Commons עם קרדיט). בלי תמונה מזוהה — נופל
  // לגרדיאנט אווירתי דקורטיבי, לא מנחשים/מזייפים יעד.
  const destinationPhotos = getDestinationPhotos(trip);
  const heroPhotoUrl = trip.coverImageUrl ?? destinationPhotos?.hero ?? null;

  return (
    // GlassCard ישירות, לא DashboardCard — הכרטיס הזה מכיל קישורים אמיתיים
    // משלו (כל תחנה), אז אין לו href-משלו ואסור ש-DashboardCard יסמן אותו
    // "לחיץ" (interactive, קורסר-יד על כל הכרטיס) בלי שיש שם קישור אמיתי —
    // בדיוק ה"false affordance" שה-docstring של DashboardCard מזהיר מפניו.
    <GlassCard
      variant="hero"
      style={{
        padding: "var(--space-5) var(--space-5) var(--space-4)",
        minHeight: "14.5rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "var(--space-4)",
        backgroundImage: heroPhotoUrl
          ? `linear-gradient(180deg, rgba(6,8,16,0.55) 0%, rgba(6,8,16,0.72) 55%, rgba(6,8,16,0.92) 100%), url(${heroPhotoUrl})`
          : [
              "radial-gradient(130% 160% at 106% -18%, color-mix(in srgb, var(--color-accent-blue) 30%, transparent), transparent 52%)",
              "radial-gradient(120% 150% at -10% 118%, color-mix(in srgb, var(--color-accent-purple) 34%, transparent), transparent 55%)",
              "linear-gradient(165deg, #0c2b3a 0%, #0a1f3a 42%, #150c33 100%)",
            ].join(", "),
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textShadow: heroPhotoUrl ? "0 1px 6px rgba(0,0,0,0.6)" : "none" }}>
        <h2 style={{ font: "var(--text-h2)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span aria-hidden>🧭</span> המסלול שלי
        </h2>
        <span style={{ font: "var(--text-caption)", color: "var(--color-text-secondary)", fontWeight: 700 }}>{trip.name}</span>
      </div>

      {stops.length === 0 ? (
        <p style={{ margin: 0, color: "var(--color-text-secondary)", font: "var(--text-body)" }}>
          עדיין אין מלונות רשומים בטיול הזה — ברגע שתוסיף מלון, המסלול יופיע כאן לפי סדר ההגעה.
        </p>
      ) : (
        <div style={{ position: "relative", overflowX: "auto", overflowY: "hidden", padding: "0.5rem 0 0.25rem" }}>
          <div style={{ position: "relative", display: "flex", minWidth: `${stopCount * 128}px` }}>
            {/* קו-החיבור המקווקו בין הפינים — מתחת לפינים (zIndex 0), בשני
                גוונים: ירוק לקטע שכבר "נסעת בו" (עד לתחנה הנוכחית), אפור-מנוקד
                למה שנותר. ממורכז בגובה מרכז-הפין (top: 1.125rem = חצי מגובה
                ה-2.25rem של הפין). */}
            <div aria-hidden style={{ position: "absolute", top: "1.125rem", insetInlineStart: `${(100 / stopCount) * 0.5}%`, insetInlineEnd: `${(100 / stopCount) * 0.5}%`, height: 0, borderTop: "2px dashed var(--color-border)", zIndex: 0 }} />
            {currentIndex > 0 ? (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: "1.125rem",
                  insetInlineStart: `${(100 / stopCount) * 0.5}%`,
                  width: `${(100 / stopCount) * currentIndex}%`,
                  height: 0,
                  borderTop: "2px dashed var(--color-success)",
                  zIndex: 0,
                }}
              />
            ) : null}
            {currentIndex > 0 ? (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: "1.125rem",
                  insetInlineStart: `${(100 / stopCount) * (currentIndex - 0.5)}%`,
                  transform: "translate(-50%, -50%) rotate(90deg)",
                  color: "var(--color-success)",
                  background: "var(--color-bg-elevated)",
                  borderRadius: "50%",
                  width: "1.25rem",
                  height: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1,
                }}
              >
                <Airplane size={13} weight="fill" aria-hidden />
              </div>
            ) : null}

            {stops.map((stop) => {
              const isCurrent = stop.status === "current";
              const isCompleted = stop.status === "completed";
              const pinSize = isCurrent ? "2.25rem" : "1.75rem";
              return (
                <Link
                  key={stop.hotelId}
                  href={`/trips/${trip.id}/days/${stop.checkInDate}`}
                  className="ui-card-interactive"
                  style={{
                    position: "relative",
                    zIndex: 1,
                    flex: "1 1 0",
                    minWidth: "112px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.375rem",
                    textDecoration: "none",
                    color: "var(--color-text-primary)",
                    padding: "0 0.375rem",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: pinSize,
                      height: pinSize,
                      marginTop: isCurrent ? 0 : "0.25rem",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isCurrent || isCompleted ? STATUS_COLOR[stop.status] : "var(--color-bg-elevated)",
                      border: isCurrent || isCompleted ? "none" : `2px solid ${STATUS_COLOR[stop.status]}`,
                      color: "#fff",
                      boxShadow: isCurrent ? "0 0 0 5px color-mix(in srgb, var(--color-accent-purple) 28%, transparent), var(--glow-brand)" : "none",
                    }}
                  >
                    {isCompleted ? <Check size={13} weight="bold" /> : null}
                  </span>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      padding: "0.1875rem 0.625rem",
                      borderRadius: "var(--radius-full)",
                      color: STATUS_COLOR[stop.status],
                      background: `color-mix(in srgb, ${STATUS_COLOR[stop.status]} 18%, var(--color-bg-elevated))`,
                    }}
                  >
                    {STATUS_LABEL[stop.status]}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3125rem", fontWeight: 800, fontSize: "1rem", textAlign: "center" }}>
                    {countryFlagEmoji(stop.country) ? <span aria-hidden style={{ fontSize: "1.0625rem" }}>{countryFlagEmoji(stop.country)}</span> : null}
                    {stop.city}
                  </span>
                  <span style={{ font: "var(--text-caption)", color: "var(--color-text-secondary)" }}>{formatHumanDate(stop.checkInDate)}</span>
                  <span
                    style={{
                      font: "var(--text-caption)",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      color: "var(--color-text-secondary)",
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "0.0625rem 0.4375rem",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatShortDate(stop.checkInDate)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {totalDays > 0 && !hideProgressBar ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-4)",
            padding: "0.875rem 1.125rem",
            borderRadius: "var(--radius-lg)",
            background: "rgba(8,10,20,0.55)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid var(--color-border)",
          }}
        >
          <ProgressRing percent={percent} size={52} strokeWidth={5} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ font: "var(--text-h3)" }}>{beforeTrip ? "טרם התחיל" : `יום ${dayNumber} מתוך ${totalDays}`}</span>
              <span
                style={{
                  font: "var(--text-caption)",
                  color: "var(--color-accent-purple)",
                  fontWeight: 800,
                  padding: "0.1875rem 0.625rem",
                  borderRadius: "var(--radius-full)",
                  background: "color-mix(in srgb, var(--color-accent-purple) 16%, transparent)",
                }}
              >
                {beforeTrip ? `מתחיל ב-${trip.startDate}` : `נותרו ${remainingDays} ימים`}
              </span>
            </div>
            <div style={{ height: "10px", borderRadius: "var(--radius-full)", background: "var(--color-surface-elevated)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${percent}%`, borderRadius: "var(--radius-full)", background: "var(--gradient-brand)", transition: "width var(--duration-slow) var(--ease-out)" }} />
            </div>
          </div>
        </div>
      ) : null}

      {!trip.coverImageUrl && destinationPhotos ? (
        <div style={{ position: "absolute", bottom: "0.5rem", insetInlineStart: "1.25rem", font: "var(--text-caption)", fontSize: "0.6875rem", opacity: 0.6, color: "#fff" }}>
          {destinationPhotos.credit}
        </div>
      ) : null}
    </GlassCard>
  );
}
