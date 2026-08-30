"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ScreenShell, ScreenHeader, Card, PlusIcon, ChevronIcon, COLOR, SPACE, RADIUS, ThermometerIcon } from "../../../design-system";
import { activitiesForDate, cityForDate, ALL_TRIP_DATES, type TripActivity } from "../../../trip-content";
import { getDemoWeatherAction, type DemoWeatherResult } from "../../../actions";

const CATEGORY_LABEL: Record<TripActivity["category"], string> = { אתר: "אתר היסטורי", אוכל: "קולינרי", קניות: "שופינג", טיול: "סיור עירוני", עוד: "פעילות" };

function DailyPlanContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const [date, setDate] = useState(search.get("day") || ALL_TRIP_DATES[0]!);
  const [activities, setActivities] = useState<TripActivity[]>([]);
  const [weather, setWeather] = useState<DemoWeatherResult | null>(null);

  useEffect(() => {
    setActivities(activitiesForDate(date));
  }, [date]);

  useEffect(() => {
    getDemoWeatherAction().then(setWeather).catch(() => setWeather(null));
  }, []);

  const city = cityForDate(date);
  const monthLabel = new Date(date).toLocaleDateString("he-IL", { month: "long", year: "numeric" });
  const dayLabel = new Date(date).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });
  const idx = ALL_TRIP_DATES.indexOf(date);
  const strip = ALL_TRIP_DATES.slice(Math.max(0, idx - 1), Math.max(0, idx - 1) + 4);

  return (
    <ScreenShell>
      <ScreenHeader title="התוכנית היומית" subtitle={monthLabel} />

      <div style={{ display: "flex", gap: SPACE.sm, justifyContent: "space-between" }}>
        {strip.map((d) => {
          const active = d === date;
          const dd = new Date(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDate(d)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "10px 4px", borderRadius: `${RADIUS.card}px`, background: active ? COLOR.primary : COLOR.card, border: `1px solid ${active ? COLOR.primary : COLOR.border}`, cursor: "pointer" }}
            >
              <span style={{ fontSize: "10px", color: active ? "#fff" : COLOR.textSecondary }}>{dd.toLocaleDateString("he-IL", { weekday: "short" })}</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: active ? "#fff" : COLOR.textPrimary }}>{dd.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div>
        <div style={{ fontSize: "15px", fontWeight: 700, color: COLOR.textPrimary }}>{dayLabel}</div>
        {city ? <div style={{ fontSize: "12px", color: COLOR.textSecondary, marginTop: "2px" }}>{city}</div> : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm, position: "relative" }}>
        {activities.length === 0 ? (
          <Card style={{ textAlign: "center", color: COLOR.textSecondary, fontSize: "12.5px" }}>אין פעילויות מתוכננות ליום זה</Card>
        ) : (
          activities.map((a) => (
            <Card key={a.id} onClick={() => router.push(`/activities/${a.id}`)} style={{ display: "flex", alignItems: "center", gap: SPACE.md, padding: "12px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: COLOR.primaryLight, minWidth: "40px" }}>{a.time}</div>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: COLOR.cardElevated, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>{CATEGORY_LABEL[a.category]}</div>
              </div>
              <ChevronIcon />
            </Card>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() => router.push(`/trips/${params.id}/plan/add?day=${date}`)}
        aria-label="הוספת פעילות"
        style={{ alignSelf: "center", width: "44px", height: "44px", borderRadius: "50%", background: COLOR.primary, border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <PlusIcon />
      </button>

      {weather ? (
        <Card style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
          <ThermometerIcon size={20} />
          <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>{weather.temperatureC != null ? `${Math.round(weather.temperatureC)}°` : "—"}</div>
          <div style={{ fontSize: "12px", color: COLOR.textSecondary }}>{weather.condition ?? "מזג אוויר"}</div>
        </Card>
      ) : null}
    </ScreenShell>
  );
}

export default function DailyPlanScreen() {
  return (
    <Suspense fallback={null}>
      <DailyPlanContent />
    </Suspense>
  );
}
