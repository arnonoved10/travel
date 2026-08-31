"use client";

import { useState } from "react";
import Link from "next/link";
import { Buildings, Airplane, Car, Receipt, MapPin, ArrowsLeftRight, Wallet } from "@phosphor-icons/react";
import type { DocumentEntityType } from "@travel-app/shared-types";
import { DatePicker } from "@/components/ui/DatePicker";
import { HotelStayForm } from "@/app/(app)/trips/[tripId]/bookings/hotel-stay-form";
import { FlightForm } from "@/app/(app)/trips/[tripId]/bookings/flight-form";
import { TransportBookingForm } from "@/app/(app)/trips/[tripId]/bookings/transport-booking-form";
import { ExpenseCreateForm } from "@/app/(app)/trips/[tripId]/finances/expense-create-form";
import { CurrencyExchangeForm } from "@/app/(app)/trips/[tripId]/finances/currency-exchange-form";
import { WalletTopUpForm } from "@/app/(app)/trips/[tripId]/finances/wallet-top-up-form";
import { PlaceCreateForm } from "@/app/(app)/places/place-create-form";
import { EntityDocumentSection } from "@/app/(app)/trips/[tripId]/documents/entity-document-section";

type QuickAddType = "hotel" | "flight" | "transport" | "expense" | "place" | "exchange" | "topup";

const TYPE_OPTIONS: { key: QuickAddType; label: string; icon: typeof Buildings }[] = [
  { key: "hotel", label: "מלון", icon: Buildings },
  { key: "flight", label: "טיסה", icon: Airplane },
  { key: "transport", label: "הסעה", icon: Car },
  { key: "expense", label: "הוצאה (מסעדה, עיסוי, טיפ...)", icon: Receipt },
  { key: "place", label: "מקום (רוצה לבקר — בית קפה, תצפית...)", icon: MapPin },
  { key: "exchange", label: "המרת מטבע", icon: ArrowsLeftRight },
  { key: "topup", label: "הטענת ארנק (כספומט / מזומן שהבאתי)", icon: Wallet },
];

// "exchange"/"topup" משתמשים ב-"other" — אין להם entityType ייעודי בסכימת-
// המסמכים (ר' documentEntityTypeSchema ב-shared-types/enums.ts), ולא הוספתי
// אחד רק כדי לאפשר "צרף קבלה" — "other" עם entityId ספציפי (מזהה-ההמרה/הארנק)
// כבר מבודד נכון בין רשומות שונות, בלי שינוי-סכימה.
const DOCUMENT_ENTITY_TYPE: Record<QuickAddType, DocumentEntityType> = {
  hotel: "hotel_stay",
  flight: "flight",
  transport: "transport_booking",
  expense: "expense",
  place: "place",
  exchange: "other",
  topup: "other",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** תוכן-ההוספה-המהירה (תאריך → סוג → טופס) — מנותק מ"היכן הוא מוצג", כדי
 * שיהיה גם בכפתור-ה-+ הצף (quick-add-fab.tsx) וגם בתוך כרטיס "פעולות מהירות"
 * בדשבורד (dashboard/quick-actions-row.tsx). בקשת משתמש: "אני צריך כפתור
 * בדשבורד" — כפתור-צף לבד לא מספיק בולט/ברור. גם "מקום" (בקשת משתמש: "מקום שאני רוצה
 * ללכת אליו... בית קפה או תצפית", וגם "מיקום שבו אני נמצא" — ר' PlaceCreateForm)
 * וגם צירוף-מסמך מיידי לכל דבר שנוסף (בקשת משתמש: "לבחור לאן לצרף" קבלה/מסמך —
 * כאן זה אוטומטי: מציע לצרף בדיוק למה שהרגע נוצר, בלי בחירה נוספת).
 *
 * initialDate: כשמוטמע במסך-יום ספציפי (days/[date]/page.tsx) — במקום מנגנון
 * נפרד לגמרי של קישורי-הוספה+טופס-מוטמע לאותו עמוד (שכפול-פונקציונליות עם
 * הפאנל הזה עצמו), אותו רכיב בדיוק מוטמע עם היום הנצפה כברירת-מחדל. */
export function QuickAddPanelContent({
  activeTripId,
  activeTripName,
  initialDate,
}: {
  activeTripId: string | null;
  activeTripName?: string | null;
  initialDate?: string;
}) {
  const [date, setDate] = useState(initialDate ?? todayIso());
  const [selectedType, setSelectedType] = useState<QuickAddType | null>(null);
  const [createdEntity, setCreatedEntity] = useState<{ type: QuickAddType; id: string } | null>(null);

  function handleSuccess(type: QuickAddType, id: string) {
    setSelectedType(null);
    setCreatedEntity({ type, id });
  }

  if (!activeTripId) {
    return (
      <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
        אין טיול פעיל כרגע — <Link href="/trips" style={{ color: "var(--color-primary)" }}>בחר או צור טיול</Link> קודם.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {activeTripName ? <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>מוסיף לטיול: {activeTripName}</div> : null}

      {/* בלי min — תאריך בעבר נתמך במפורש (בקשת משתמש: "רטרואקטיבית גם ימים שעברו"). */}
      <DatePicker
        value={date}
        onChange={(v) => {
          setDate(v);
          setSelectedType(null);
          setCreatedEntity(null);
        }}
        style={{ maxWidth: "100%" }}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => {
              setSelectedType((prev) => (prev === opt.key ? null : opt.key));
              setCreatedEntity(null);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "999px",
              border: selectedType === opt.key ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
              background: selectedType === opt.key ? "color-mix(in srgb, var(--color-primary) 16%, transparent)" : "var(--color-surface)",
              color: "var(--color-text)",
              cursor: "pointer",
              fontSize: "0.8125rem",
              fontWeight: 600,
            }}
          >
            <opt.icon size={16} weight="fill" aria-hidden />
            {opt.label}
          </button>
        ))}
      </div>

      {createdEntity ? (
        <div style={{ padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p style={{ margin: "0 0 0.375rem", fontSize: "0.8125rem", color: "var(--color-success)", fontWeight: 600 }}>
            ✓ נוסף! אפשר לצרף קבלה/מסמך/תמונה לזה עכשיו, להוסיף עוד משהו לאותו יום, או לסגור.
          </p>
          <EntityDocumentSection tripId={activeTripId} entityType={DOCUMENT_ENTITY_TYPE[createdEntity.type]} entityId={createdEntity.id} documents={[]} />
        </div>
      ) : null}

      {selectedType === "hotel" ? (
        <HotelStayForm key={date} tripId={activeTripId} defaultValues={{ checkInDate: date }} onSuccess={(id) => handleSuccess("hotel", id)} />
      ) : null}
      {selectedType === "flight" ? (
        <FlightForm key={date} tripId={activeTripId} defaultValues={{ departureAt: date }} onSuccess={(id) => handleSuccess("flight", id)} />
      ) : null}
      {selectedType === "transport" ? (
        <TransportBookingForm key={date} tripId={activeTripId} defaultValues={{ pickupAt: date }} onSuccess={(id) => handleSuccess("transport", id)} />
      ) : null}
      {selectedType === "expense" ? (
        <ExpenseCreateForm key={date} tripId={activeTripId} defaultDate={date} onSuccess={(id) => handleSuccess("expense", id)} />
      ) : null}
      {selectedType === "place" ? (
        <PlaceCreateForm key={date} tripId={activeTripId} redirectOnSuccess={false} onSuccess={(id) => handleSuccess("place", id)} />
      ) : null}
      {selectedType === "exchange" ? (
        <CurrencyExchangeForm key={date} tripId={activeTripId} onSuccess={(id) => handleSuccess("exchange", id)} />
      ) : null}
      {selectedType === "topup" ? (
        <WalletTopUpForm key={date} tripId={activeTripId} onSuccess={(id) => handleSuccess("topup", id)} />
      ) : null}
    </div>
  );
}
