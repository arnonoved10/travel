"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, Card, DangerButton, PrimaryButton, PinIcon, CalendarIcon, ClockIcon, COLOR, SPACE } from "../../design-system";
import { findActivity, deleteActivity, type TripActivity } from "../../trip-content";
import { activeTrip, currentScopeTripId } from "../../trips-data";

const CATEGORY_LABEL: Record<TripActivity["category"], string> = { אתר: "אתר היסטורי", אוכל: "קולינרי", קניות: "שופינג", טיול: "סיור עירוני", עוד: "פעילות" };

export default function ActivityDetailsScreen() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [result, setResult] = useState<{ activity: TripActivity; date: string } | null | undefined>(undefined);
  const [tripId, setTripId] = useState<string | null>(null);
  const [scopedTripId] = useState(() => currentScopeTripId());

  useEffect(() => {
    setResult(findActivity(scopedTripId, params.id));
    setTripId(activeTrip()?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (result === undefined) return null;
  if (result === null) {
    return (
      <ScreenShell>
        <ScreenHeader title="פרטי פעילות" />
        <Card style={{ textAlign: "center", color: COLOR.textSecondary }}>הפעילות לא נמצאה</Card>
      </ScreenShell>
    );
  }
  const { activity, date } = result;

  return (
    <ScreenShell>
      <ScreenHeader title="פרטי פעילות" />
      <div style={{ height: "150px", borderRadius: "16px", background: `linear-gradient(160deg, ${COLOR.primary}44, ${COLOR.cardElevated})`, border: `1px solid ${COLOR.border}` }} />

      <div>
        <div style={{ fontSize: "17px", fontWeight: 700, color: COLOR.textPrimary }}>{activity.title}</div>
        <div style={{ fontSize: "12px", color: COLOR.textSecondary, marginTop: "2px" }}>{CATEGORY_LABEL[activity.category]}</div>
      </div>

      <Card style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
        <CalendarIcon />
        <span style={{ fontSize: "13px", color: COLOR.textPrimary }}>{new Date(date).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}</span>
      </Card>

      <div style={{ display: "flex", gap: SPACE.sm }}>
        <Card style={{ flex: 1, display: "flex", alignItems: "center", gap: SPACE.sm }}>
          <ClockIcon />
          <div>
            <div style={{ fontSize: "10.5px", color: COLOR.textSecondary }}>שעת התחלה</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>{activity.time}</div>
          </div>
        </Card>
        <Card style={{ flex: 1, display: "flex", alignItems: "center", gap: SPACE.sm }}>
          <ClockIcon />
          <div>
            <div style={{ fontSize: "10.5px", color: COLOR.textSecondary }}>משך זמן</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>{activity.durationLabel}</div>
          </div>
        </Card>
      </div>

      {activity.location ? (
        <Card style={{ display: "flex", alignItems: "flex-start", gap: SPACE.sm }}>
          <PinIcon />
          <span style={{ fontSize: "12.5px", color: COLOR.textPrimary }}>{activity.location}</span>
        </Card>
      ) : null}

      {activity.notes ? (
        <Card>
          <div style={{ fontSize: "11.5px", color: COLOR.textSecondary, marginBottom: "4px" }}>הערות</div>
          <div style={{ fontSize: "12.5px", color: COLOR.textPrimary }}>{activity.notes}</div>
        </Card>
      ) : null}

      <div style={{ display: "flex", gap: SPACE.sm }}>
        <DangerButton
          onClick={() => {
            if (confirm(`למחוק את הפעילות "${activity.title}"?`)) {
              deleteActivity(scopedTripId, activity.id);
              router.back();
            }
          }}
        >
          מחק פעילות
        </DangerButton>
        <PrimaryButton onClick={() => tripId && router.push(`/trips/${tripId}/plan/add?day=${date}&id=${activity.id}`)} disabled={!tripId}>
          ערוך פעילות
        </PrimaryButton>
      </div>
    </ScreenShell>
  );
}
