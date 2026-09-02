"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, Card, Badge, DangerButton, SecondaryButton, Money, CheckIcon, COLOR, SPACE } from "../../design-system";
import { findBooking, updateBooking, type Booking } from "../../bookings-data";

export default function BookingDetailsScreen() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);

  useEffect(() => {
    setBooking(findBooking(params.id));
  }, [params.id]);

  if (booking === undefined) return null;
  if (booking === null) {
    return (
      <ScreenShell>
        <ScreenHeader title="פרטי הזמנה" />
        <Card style={{ textAlign: "center", color: COLOR.textSecondary }}>ההזמנה לא נמצאה</Card>
      </ScreenShell>
    );
  }

  function handleCancel() {
    if (!booking || booking.status === "cancelled") return;
    if (!confirm(`לבטל את ההזמנה "${booking.title}"?`)) return;
    const updated = updateBooking(booking.id, { status: "cancelled" });
    if (updated) setBooking(updated);
  }

  function handleViewConfirmation() {
    if (!booking) return;
    alert(`אישור הזמנה\n\n${booking.title}\nמספר אישור: ${booking.confirmationNumber}\nתאריך: ${fmt(booking.checkIn)}${booking.checkOut ? ` – ${fmt(booking.checkOut)}` : ""}`);
  }

  return (
    <ScreenShell>
      <ScreenHeader title="פרטי הזמנה" />

      {booking.status === "cancelled" ? (
        <div style={{ background: `${COLOR.danger}1A`, border: `1px solid ${COLOR.danger}55`, borderRadius: "16px", padding: SPACE.lg, textAlign: "center" }}>
          <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.danger }}>ההזמנה בוטלה</div>
        </div>
      ) : booking.status === "confirmed" ? (
        <div style={{ background: `${COLOR.success}1A`, border: `1px solid ${COLOR.success}55`, borderRadius: "16px", padding: SPACE.lg, display: "flex", alignItems: "center", gap: SPACE.sm }}>
          <CheckIcon />
          <div>
            <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.success }}>ההזמנה אושרה</div>
            <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>מספר הזמנה: {booking.confirmationNumber}</div>
          </div>
        </div>
      ) : null}

      <Card>
        <div style={{ fontSize: "15px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>{booking.title}</div>
        {booking.address ? <div style={{ fontSize: "12px", color: COLOR.textSecondary, marginBottom: SPACE.sm }}>{booking.address}</div> : null}
        <Row label="תאריך הגעה" value={fmt(booking.checkIn)} />
        {booking.checkOut ? <Row label="תאריך עזיבה" value={fmt(booking.checkOut)} /> : null}
        {booking.guests ? <Row label="אורחים" value={String(booking.guests)} /> : null}
        {booking.totalPrice ? <Row label="סכום כולל" value={<Money text={booking.totalPrice} />} badge="שולם במלואו" last /> : null}
      </Card>

      {booking.status !== "cancelled" ? (
        <div style={{ display: "flex", gap: SPACE.sm }}>
          <DangerButton onClick={handleCancel}>ביטול הזמנה</DangerButton>
          <SecondaryButton onClick={handleViewConfirmation}>צפייה באישור ההזמנה</SecondaryButton>
        </div>
      ) : (
        <SecondaryButton onClick={() => router.push("/bookings")}>חזרה להזמנות שלי</SecondaryButton>
      )}
    </ScreenShell>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Row({ label, value, badge, last }: { label: string; value: React.ReactNode; badge?: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: last ? "none" : `1px solid ${COLOR.border}` }}>
      <span style={{ fontSize: "12.5px", color: COLOR.textSecondary }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: SPACE.sm, fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>
        {value}
        {badge ? <Badge tone="success">{badge}</Badge> : null}
      </span>
    </div>
  );
}
