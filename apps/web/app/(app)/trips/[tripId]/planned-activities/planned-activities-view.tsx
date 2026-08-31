"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Document, LifecycleStatus, Place, PlannedActivity } from "@travel-app/shared-types";
import { LIFECYCLE_STATUS_LABELS, LIFECYCLE_STATUS_ORDER } from "@/lib/lifecycle-status-labels";
import { PersonalRatingSelect } from "@/components/personal-rating-select";
import { PlannedActivityStatusSelect } from "./planned-activity-status-select";
import { DeletePlannedActivityButton } from "./delete-planned-activity-button";
import { setPlannedActivityPersonalRatingAction, updatePlannedActivityStatusAction } from "./actions";
import { EntityDocumentSection } from "../documents/entity-document-section";
import { LiveTimer } from "@/components/live-timer";
import { PlannedActivitiesMap, type MapActivityCandidate } from "./planned-activities-map";

export function PlannedActivitiesView({
  tripId,
  activities,
  documentsByPlannedActivityId,
  placesById,
}: {
  tripId: string;
  activities: PlannedActivity[];
  documentsByPlannedActivityId: Record<string, Document[]>;
  placesById: Record<string, Place>;
}) {
  const [view, setView] = useState<"list" | "kanban" | "map">("list");
  const [localActivities, setLocalActivities] = useState(activities);
  // מתאם מצב מקומי מול ה-prop שמגיע מהשרת (למשל אחרי revalidatePath ביצירה/מחיקה)
  // בלי useEffect — עדכון state בזמן render, ה-pattern הרשמי של React ל"adjusting
  // state when a prop changes" (ראה react.dev/learn/you-might-not-need-an-effect).
  const [prevActivities, setPrevActivities] = useState(activities);
  if (activities !== prevActivities) {
    setPrevActivities(activities);
    setLocalActivities(activities);
  }

  const mapCandidates = useMemo<MapActivityCandidate[]>(() => {
    return localActivities
      .map((activity) => {
        const place = activity.placeId ? placesById[activity.placeId] : undefined;
        if (!place || place.lat === null || place.lng === null) return null;
        return { id: activity.id, name: activity.name, category: place.category, lat: place.lat, lng: place.lng };
      })
      .filter((entry): entry is MapActivityCandidate => entry !== null);
  }, [localActivities, placesById]);

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <ToggleButton active={view === "list"} onClick={() => setView("list")}>
          רשימה
        </ToggleButton>
        <ToggleButton active={view === "kanban"} onClick={() => setView("kanban")}>
          קנבן
        </ToggleButton>
        <ToggleButton active={view === "map"} onClick={() => setView("map")}>
          מפה
        </ToggleButton>
      </div>

      {view === "list" ? (
        <ListView tripId={tripId} activities={localActivities} documentsByPlannedActivityId={documentsByPlannedActivityId} />
      ) : view === "map" ? (
        <PlannedActivitiesMap tripId={tripId} candidates={mapCandidates} />
      ) : (
        <KanbanView
          tripId={tripId}
          activities={localActivities}
          onMove={(id, status) => {
            setLocalActivities((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
            void updatePlannedActivityStatusAction(tripId, id, status);
          }}
        />
      )}
    </div>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "0.375rem 0.75rem",
        borderRadius: "var(--radius-full)",
        border: "1px solid var(--color-border)",
        background: active ? "var(--gradient-brand)" : "var(--color-surface)",
        color: active ? "#fff" : "var(--color-text-primary)",
        fontWeight: 600,
        cursor: "pointer",
        fontSize: "0.8125rem",
        boxShadow: active ? "var(--glow-brand)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function activitySubtitle(activity: PlannedActivity): string {
  const parts: string[] = [];
  if (activity.activityType) parts.push(activity.activityType);
  parts.push(activity.plannedAt ? new Date(activity.plannedAt).toLocaleString("he-IL") : "בלי תאריך קבוע");
  if (activity.estimatedDurationMinutes) parts.push(`${activity.estimatedDurationMinutes} דק'`);
  if (activity.estimatedPrice) parts.push(`~${activity.estimatedPrice} ${activity.estimatedCurrencyCode ?? ""}`);
  return parts.join(" · ");
}

function ConvertOrLinkedBadge({ tripId, activity }: { tripId: string; activity: PlannedActivity }) {
  if (activity.bookingId) {
    return <span style={{ fontSize: "0.75rem", color: "var(--color-primary)" }}>✅ מקושר להזמנה</span>;
  }
  return (
    <Link
      href={`/trips/${tripId}/planned-activities/${activity.id}/convert`}
      style={{
        fontSize: "0.75rem",
        color: "var(--color-primary)",
        border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
        background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
        fontWeight: 600,
        borderRadius: "var(--radius-full)",
        padding: "0.25rem 0.5rem",
        textDecoration: "none",
      }}
    >
      המר להזמנה
    </Link>
  );
}

function ListView({
  tripId,
  activities,
  documentsByPlannedActivityId,
}: {
  tripId: string;
  activities: PlannedActivity[];
  documentsByPlannedActivityId: Record<string, Document[]>;
}) {
  return (
    <ul style={listStyle}>
      {activities.map((activity) => (
        <li key={activity.id} style={{ ...itemStyle, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{activity.name}</div>
              <div style={mutedStyle}>{activitySubtitle(activity)}</div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <PlannedActivityStatusSelect tripId={tripId} plannedActivityId={activity.id} status={activity.status} />
              <PersonalRatingSelect
                value={activity.personalRating}
                onRate={(personalRating) => setPlannedActivityPersonalRatingAction(tripId, activity.id, personalRating)}
              />
              <ConvertOrLinkedBadge tripId={tripId} activity={activity} />
              <DeletePlannedActivityButton tripId={tripId} plannedActivityId={activity.id} />
            </div>
          </div>
          {activity.plannedAt ? (
            <LiveTimer label={activity.name} eventAt={activity.plannedAt} timezone={activity.plannedTimezone ?? "UTC"} />
          ) : null}
          <EntityDocumentSection
            tripId={tripId}
            entityType="planned_activity"
            entityId={activity.id}
            documents={documentsByPlannedActivityId[activity.id] ?? []}
          />
        </li>
      ))}
      {activities.length === 0 ? <p style={mutedStyle}>עוד לא הוספת תכניות לטיול הזה.</p> : null}
    </ul>
  );
}

function KanbanView({
  tripId,
  activities,
  onMove,
}: {
  tripId: string;
  activities: PlannedActivity[];
  onMove: (plannedActivityId: string, status: LifecycleStatus) => void;
}) {
  const [dragOverColumn, setDragOverColumn] = useState<LifecycleStatus | null>(null);

  return (
    <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
      {LIFECYCLE_STATUS_ORDER.map((status) => {
        const columnActivities = activities.filter((a) => a.status === status);
        return (
          <div
            key={status}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverColumn(status);
            }}
            onDragLeave={() => setDragOverColumn((current) => (current === status ? null : current))}
            onDrop={(event) => {
              event.preventDefault();
              const plannedActivityId = event.dataTransfer.getData("text/plain");
              if (plannedActivityId) onMove(plannedActivityId, status);
              setDragOverColumn(null);
            }}
            style={{
              minWidth: "220px",
              flexShrink: 0,
              borderRadius: "10px",
              border: `1px solid ${dragOverColumn === status ? "var(--color-primary)" : "var(--color-border)"}`,
              background: "var(--color-bg)",
              padding: "0.5rem",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              {LIFECYCLE_STATUS_LABELS[status]} ({columnActivities.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minHeight: "3rem" }}>
              {columnActivities.map((activity) => (
                <div
                  key={activity.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", activity.id);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    cursor: "grab",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "0.8125rem" }}>{activity.name}</div>
                  <div style={{ ...mutedStyle, marginTop: "0.125rem" }}>{activitySubtitle(activity)}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.375rem" }}>
                    <ConvertOrLinkedBadge tripId={tripId} activity={activity} />
                    <DeletePlannedActivityButton tripId={tripId} plannedActivityId={activity.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const mutedStyle: React.CSSProperties = { color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 };
const listStyle: React.CSSProperties = { listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.375rem", margin: 0 };
const itemStyle: React.CSSProperties = { padding: "0.5rem", borderRadius: "var(--radius-md)", background: "var(--color-surface-elevated)" };
