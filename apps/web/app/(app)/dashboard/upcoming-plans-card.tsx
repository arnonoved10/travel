import Link from "next/link";
import type { LifecycleStatus, PlannedActivity, Trip } from "@travel-app/shared-types";
import { LIFECYCLE_STATUS_LABELS } from "@/lib/lifecycle-status-labels";
import { DashboardCard } from "./dashboard-card";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/StatusBadge";

const STATUS_TONE: Record<LifecycleStatus, StatusBadgeTone> = {
  want_to_book: "neutral",
  need_to_book: "warning",
  planned: "info",
  booked: "success",
  partially_paid: "info",
  paid: "success",
  done: "success",
  not_done: "danger",
  postponed: "warning",
  cancelled: "danger",
};

export function UpcomingPlansCard({ trip, activities }: { trip: Trip; activities: PlannedActivity[] }) {
  const now = new Date().toISOString();
  const upcoming = activities
    .filter((a) => a.plannedAt !== null && a.plannedAt >= now && a.status !== "cancelled" && a.status !== "done")
    .sort((a, b) => (a.plannedAt ?? "").localeCompare(b.plannedAt ?? ""))
    .slice(0, 5);

  return (
    <DashboardCard
      title="תכניות קרובות"
      action={
        <Link href={`/trips/${trip.id}#planning`} style={{ font: "var(--text-caption)", color: "var(--color-primary)", fontWeight: 700 }}>
          כל התכנון ←
        </Link>
      }
    >
      {upcoming.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", font: "var(--text-caption)", margin: 0 }}>
          אין תכניות עתידיות עם תאריך קרוב.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {upcoming.map((a) => (
            <li key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
              <span style={{ font: "var(--text-body)", minWidth: 0 }}>
                <span style={{ fontWeight: 600 }}>{a.name}</span>
                {a.plannedAt ? (
                  <span style={{ color: "var(--color-text-muted)", font: "var(--text-caption)" }}>
                    {" "}
                    · {new Date(a.plannedAt).toLocaleString("he-IL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                ) : null}
              </span>
              <StatusBadge label={LIFECYCLE_STATUS_LABELS[a.status]} tone={STATUS_TONE[a.status]} />
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
