"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LegacyCard as Card,
  LegacyScreenHeader as ScreenHeader,
  LegacyScreenShell as ScreenShell,
  LegacyStatusChip as StatusChip,
  LegacyBottomNav as BottomNav,
  LEGACY_COLOR as COLOR,
  LegacyPlusIcon,
  LegacyReorderIcon,
  LegacyMapPinIcon,
  LegacyNavigateIcon,
} from "./legacy-shared";
import { loadStops, addStop, updateStop, deleteStop, type TripStop, type StopStatus } from "../trip-content";
import { activeTrip } from "../trips-data";
import { StopEditSheet } from "./stop-edit-sheet";

/**
 * מסך מסלול (design-preview בלבד) — עודכן: היה "נתוני-דוגמה קבועים, לא
 * מחובר ל-DB" (STOPS קבוע בקוד, בלי שום עריכה אמיתית). עכשיו קורא
 * מ-trip-content.ts (אותו מקור-אמת שמשמש גם את מסך "שינוי סדר היעדים"
 * וגם את היומן) — הוספה/עריכה/מחיקה של תחנה נשמרות באמת, ומשתקפות בכל
 * המסכים האחרים. העיצוב החזותי (כרטיסים/סטטוס/מספור) נשאר בדיוק כפי
 * שאושר מול original_trip.png — רק מקור-הנתונים והפעולות הפכו לאמיתיים.
 */

const STATUS_TONE: Record<StopStatus, "success" | "purple" | "warning"> = {
  בוצע: "success",
  מאושר: "purple",
  "ממתין לאישור": "warning",
};

function ActionButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 12px",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.06)",
        border: `1px solid ${COLOR.cardBorder}`,
        color: COLOR.textPrimary,
        fontSize: "11.5px",
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function fmtRange(startDate: string, endDate: string): string {
  const s = new Date(startDate);
  const e = new Date(endDate);
  const fmt = (d: Date) => d.toLocaleDateString("he-IL", { day: "numeric", month: "long" });
  return `${fmt(s)} – ${fmt(e)}`;
}

export default function RoutePreviewScreen() {
  const router = useRouter();
  const [stops, setStops] = useState<TripStop[]>([]);
  const [editing, setEditing] = useState<{ mode: "add" | "edit"; stop: TripStop | null } | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);

  useEffect(() => {
    setStops(loadStops());
    setTripId(activeTrip()?.id ?? null);
  }, []);

  function handleSave(patch: Omit<TripStop, "id">) {
    if (editing?.mode === "edit" && editing.stop) {
      updateStop(editing.stop.id, patch);
    } else {
      addStop(patch);
    }
    setStops(loadStops());
    setEditing(null);
  }

  function handleDelete() {
    if (editing?.mode === "edit" && editing.stop) {
      if (!confirm(`למחוק את התחנה "${editing.stop.city}"?`)) return;
      deleteStop(editing.stop.id);
      setStops(loadStops());
    }
    setEditing(null);
  }

  return (
    <ScreenShell>
      <ScreenHeader title="מסלול הטיול" subtitle={`${stops.length} תחנות`} />

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <ActionButton label="הוסף תחנה" icon={<LegacyPlusIcon size={15} />} onClick={() => setEditing({ mode: "add", stop: null })} />
        <ActionButton label="שנה סדר תחנות" icon={<LegacyReorderIcon size={15} />} onClick={() => router.push("/route/reorder")} />
        <ActionButton label="מעבר למפה" icon={<LegacyMapPinIcon size={15} />} onClick={() => router.push("/map")} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {stops.map((stop, i) => (
          <div key={stop.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <Card>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                <Link href={tripId ? `/trips/${tripId}/plan?day=${stop.startDate}` : "/trips"} style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                  <span
                    aria-hidden
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      background: "rgba(138,90,223,0.18)",
                      border: `1px solid ${COLOR.purple}55`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: COLOR.purple,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: "14px", color: "#fff" }}>{stop.city}</div>
                    <div style={{ fontSize: "11px", color: COLOR.textMuted }}>{fmtRange(stop.startDate, stop.endDate)}</div>
                  </div>
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  {stop.status ? <StatusChip label={stop.status} tone={STATUS_TONE[stop.status]} /> : null}
                  <button
                    type="button"
                    aria-label={`עריכת ${stop.city}`}
                    onClick={() => setEditing({ mode: "edit", stop })}
                    style={{ width: "26px", height: "26px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLOR.cardBorder}`, color: COLOR.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}
                  >
                    ✎
                  </button>
                </div>
              </div>

              {stop.hotel ? <div style={{ fontSize: "12px", color: COLOR.textSecondary, marginBottom: "6px" }}>🏨 {stop.hotel}</div> : null}

              {(stop.attractions && stop.attractions.length > 0) || (stop.restaurants && stop.restaurants.length > 0) ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "11.5px", color: COLOR.textSecondary }}>
                  {(stop.attractions ?? []).map((a) => (
                    <div key={a}>· {a}</div>
                  ))}
                  {(stop.restaurants ?? []).map((r) => (
                    <div key={r}>· {r} (מסעדה)</div>
                  ))}
                </div>
              ) : null}
            </Card>

            {stop.transportToNext ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingInlineStart: "34px", fontSize: "11px", color: COLOR.textMuted }}>
                <span style={{ width: "1px", height: "14px", background: COLOR.cardBorder }} />
                {stop.transportToNext}
                <button
                  type="button"
                  onClick={() => router.push("/map")}
                  style={{
                    marginInlineStart: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 9px",
                    borderRadius: "999px",
                    background: "rgba(138,90,223,0.14)",
                    border: `1px solid ${COLOR.purple}40`,
                    color: COLOR.purple,
                    fontSize: "10.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ניווט
                  <LegacyNavigateIcon color={COLOR.purple} size={12} />
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {editing ? (
        <StopEditSheet
          initial={editing.stop}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={editing.mode === "edit" ? handleDelete : undefined}
        />
      ) : null}

      <BottomNav active="route" />
    </ScreenShell>
  );
}
