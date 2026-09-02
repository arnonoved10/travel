"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, Card, ElevatedCard, Badge, PrimaryButton, DangerButton, Money, COLOR, SPACE, ShareIcon, SuitcaseIcon, CalendarIcon, ProfileIcon } from "../../design-system";
import { FlagIcon } from "../../country-currency-data";
import { findAnyTrip, updateTrip, deleteCustomTrip, type DemoTrip } from "../../trips-data";
import { loadStops } from "../../trip-content";
import { DateRangePicker } from "../../date-range-picker";

export default function TripOverviewScreen() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [trip, setTrip] = useState<DemoTrip | null | undefined>(undefined);
  const [cityCount, setCityCount] = useState(0);
  const [editingDates, setEditingDates] = useState(false);

  useEffect(() => {
    setTrip(findAnyTrip(params.id));
    setCityCount(new Set(loadStops().map((s) => s.city)).size);
  }, [params.id]);

  if (trip === undefined) return null;
  if (trip === null) {
    return (
      <ScreenShell>
        <ScreenHeader title="הטיול" />
        <Card style={{ textAlign: "center", color: COLOR.textSecondary }}>הטיול לא נמצא</Card>
      </ScreenShell>
    );
  }

  const isJapan = trip.id === "japan-2025";

  async function handleShareTrip() {
    if (!trip) return;
    const shareData = { title: trip.name, text: `הטיול שלי ל${trip.name}: ${fmt(trip.startDate)} - ${fmt(trip.endDate)}`, url: typeof window !== "undefined" ? window.location.href : undefined };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // המשתמש ביטל את השיתוף
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url ?? ""}`);
      alert("פרטי הטיול הועתקו");
    }
  }

  return (
    <ScreenShell>
      <ScreenHeader
        title="סקירת הטיול"
        action={
          <button
            type="button"
            aria-label="שיתוף"
            onClick={() => void handleShareTrip()}
            style={{ width: "40px", height: "40px", borderRadius: "50%", background: COLOR.card, border: `1px solid ${COLOR.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <ShareIcon />
          </button>
        }
      />

      <div style={{ position: "relative", height: "150px", borderRadius: "16px", overflow: "hidden", background: `linear-gradient(160deg, ${COLOR.primary}55, ${COLOR.cardElevated})`, border: `1px solid ${COLOR.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FlagIcon countryCode={trip.countryCode} size={56} />
        <span style={{ position: "absolute", top: SPACE.md, insetInlineStart: SPACE.md }}>
          <Badge tone={trip.status === "active" ? "success" : "primary"}>{trip.status === "active" ? "מאושר" : "מתוכנן"}</Badge>
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
        <FlagIcon countryCode={trip.countryCode} size={22} />
        <span style={{ fontSize: "16px", fontWeight: 700, color: COLOR.textPrimary }}>{trip.name}</span>
        <span style={{ fontSize: "12px", color: COLOR.textSecondary }}>
          {fmt(trip.startDate)} - {fmt(trip.endDate)}
        </span>
        <button
          type="button"
          onClick={() => setEditingDates(true)}
          style={{ marginInlineStart: "auto", padding: "5px 10px", borderRadius: "999px", background: `${COLOR.primary}22`, border: `1px solid ${COLOR.primary}55`, color: COLOR.primaryLight, fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
        >
          עריכת תאריכים
        </button>
      </div>

      <div style={{ display: "flex", gap: SPACE.sm }}>
        <StatChip icon={<CalendarIcon size={16} />} label={`${trip.nights} לילות`} />
        <StatChip icon={<CalendarIcon size={16} />} label={`${trip.nights + 1} ימים`} />
        <StatChip icon={<ProfileIcon />} label={`${trip.travelers}`} />
      </div>

      <Card>
        <div style={{ fontSize: "14px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.md }}>סיכום הטיול</div>
        <SummaryRow label="יעדים" value={isJapan ? "טוקיו, קיוטו, אוסקה" : trip.name} badge={isJapan ? String(cityCount) : undefined} />
        <SummaryRow label="פעילויות" value="" badge={isJapan ? "12" : "0"} />
        <SummaryRow label="תחבורה" value={isJapan ? "JR Pass כלול" : "טרם הוגדר"} />
        <SummaryRow label="תקציב" value="עלות כוללת" badge={<Money text="₪ 8,740" />} last />
      </Card>

      <div style={{ display: "flex", gap: SPACE.sm }}>
        <DangerButton
          onClick={() => {
            if (confirm(`למחוק את הטיול "${trip.name}"?`)) {
              deleteCustomTrip(trip.id);
              router.push("/trips");
            }
          }}
        >
          מחק טיול
        </DangerButton>
        <PrimaryButton onClick={() => router.push(`/trips/${trip.id}/plan`)}>צפה בתוכנית</PrimaryButton>
      </div>

      {editingDates ? (
        <DateRangePicker
          title="עריכת תאריכי הטיול"
          initialStartDate={trip.startDate}
          initialEndDate={trip.endDate}
          onClose={() => setEditingDates(false)}
          onConfirm={(startDate, endDate) => {
            const updated = updateTrip(trip.id, { startDate, endDate });
            if (updated) setTrip(updated);
            setEditingDates(false);
          }}
        />
      ) : null}
    </ScreenShell>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
}

function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "12px", background: COLOR.card, border: `1px solid ${COLOR.border}`, flex: 1, justifyContent: "center" }}>
      {icon}
      <span style={{ fontSize: "12px", fontWeight: 700, color: COLOR.textPrimary }}>{label}</span>
    </div>
  );
}

function SummaryRow({ label, value, badge, last }: { label: string; value: string; badge?: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: last ? "none" : `1px solid ${COLOR.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
        <SuitcaseIcon size={16} />
        <span style={{ fontSize: "12.5px", color: COLOR.textSecondary }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
        {value ? <span style={{ fontSize: "12.5px", color: COLOR.textPrimary, fontWeight: 600 }}>{value}</span> : null}
        {badge ? typeof badge === "string" ? <Badge tone="primary">{badge}</Badge> : badge : null}
      </div>
    </div>
  );
}
