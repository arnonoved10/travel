"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, Card, Badge, DangerButton, PrimaryButton, SecondaryButton, Field, Money, CheckIcon, PillTabs, COLOR, SPACE, inputStyle } from "../../design-system";
import { findBooking, updateBooking, deleteBooking, syncHotelExpense, FLIGHT_STATUS_LABEL, type Booking, type FlightStatus } from "../../bookings-data";
import { formatMoney, defaultCurrencyPriority, type PaymentMethod } from "../../wallet-data";
import { CurrencyPickerButton } from "../../pickers";
import { useWalletStore } from "../../wallet-store";
import { ToastBar } from "../../toast-bar";

const DEPOSIT_CATEGORIES = new Set(["hotel", "car"]);

export default function BookingDetailsScreen() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const store = useWalletStore();
  const [booking, setBooking] = useState<Booking | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setBooking(findBooking(params.id));
  }, [params.id]);

  if (booking === undefined || !store.hydrated) return null;
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

  function handleDelete() {
    if (!booking) return;
    if (!confirm(`למחוק לצמיתות את ההזמנה "${booking.title}"? לא ניתן לבטל פעולה זו.`)) return;
    // מחיקת הזמנת-מלון מוחקת גם את ההוצאה שנוצרה אוטומטית ממחיר המלון שלה
    // (אם יש) — אחרת נשארת הוצאה "יתומה" בארנק בלי הזמנה מקושרת.
    const linkedExpense = store.expenses.find((e) => e.bookingId === booking.id);
    if (linkedExpense) store.deleteExpense(linkedExpense.id);
    deleteBooking(booking.id);
    router.push("/bookings");
  }

  function handleViewConfirmation() {
    if (!booking) return;
    alert(`אישור הזמנה\n\n${booking.title}\nמספר אישור: ${booking.confirmationNumber}\nתאריך: ${fmt(booking.checkIn)}${booking.checkOut ? ` – ${fmt(booking.checkOut)}` : ""}`);
  }

  function handleMarkDepositReturned(id: string, title: string) {
    if (!confirm(`לסמן את "${title}" כהוחזר? הסכום יחזור לארנק/יזוכה בכרטיס.`)) return;
    store.markDepositReturned(id);
  }

  const linkedDeposits = store.deposits.filter((d) => d.bookingId === booking.id);
  const canHaveDeposit = DEPOSIT_CATEGORIES.has(booking.category);

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
        {booking.category === "hotel" && booking.hotelPriceAmount != null ? (
          <Row label="מחיר המלון" value={<Money text={formatMoney(booking.hotelPriceAmount, booking.hotelPriceCurrency ?? "ILS")} />} badge="נוסף כהוצאה" last />
        ) : booking.totalPrice ? (
          <Row label="סכום כולל" value={<Money text={booking.totalPrice} />} badge="שולם במלואו" last />
        ) : null}
      </Card>

      {canHaveDeposit && booking.status !== "cancelled" ? (
        <div>
          <div style={{ fontSize: "13.5px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>פיקדון</div>
          {linkedDeposits.length === 0 ? (
            <SecondaryButton
              onClick={() =>
                router.push(`/wallet/deposit/new?bookingId=${booking.id}&title=${encodeURIComponent(`פיקדון - ${booking.title}`)}`)
              }
            >
              + הוספת פיקדון
            </SecondaryButton>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: SPACE.xs }}>
              {linkedDeposits.map((d) => (
                <Card key={d.id}>
                  <div onClick={() => router.push(`/wallet/deposit/new?edit=${d.id}`)} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>{d.title}</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: COLOR.textPrimary }}>
                        <Money text={formatMoney(d.amount, d.currency)} />
                      </span>
                    </div>
                    <div style={{ fontSize: "11px", color: COLOR.textSecondary, marginTop: "2px" }}>
                      {d.status === "pending" ? `ניתן ב-${d.dateGiven}` : `הוחזר ב-${d.returnedDate}`}
                    </div>
                  </div>
                  {d.status === "pending" ? (
                    <button
                      type="button"
                      onClick={() => handleMarkDepositReturned(d.id, d.title)}
                      style={{ width: "100%", marginTop: SPACE.sm, padding: "9px", borderRadius: "10px", background: `${COLOR.success}1A`, border: `1px solid ${COLOR.success}55`, color: COLOR.success, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                    >
                      ✓ סמן כהוחזר
                    </button>
                  ) : (
                    <Badge tone="success">✓ הוחזר</Badge>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: SPACE.sm }}>
        <SecondaryButton onClick={() => setEditing(true)}>עריכת הפרטים</SecondaryButton>
        {booking.status !== "cancelled" ? <SecondaryButton onClick={handleViewConfirmation}>צפייה באישור ההזמנה</SecondaryButton> : null}
      </div>

      {booking.status !== "cancelled" ? (
        <DangerButton onClick={handleCancel}>ביטול הזמנה</DangerButton>
      ) : (
        <SecondaryButton onClick={() => router.push("/bookings")}>חזרה להזמנות שלי</SecondaryButton>
      )}
      <button
        type="button"
        onClick={handleDelete}
        style={{ width: "100%", padding: "13px", borderRadius: "12px", background: "none", border: `1px solid ${COLOR.danger}55`, color: COLOR.danger, fontSize: "13.5px", fontWeight: 700, cursor: "pointer" }}
      >
        מחיקת ההזמנה לצמיתות
      </button>

      {editing ? (
        <EditBookingSheet
          booking={booking}
          onClose={() => setEditing(false)}
          onSave={(patch) => {
            const updated = updateBooking(booking.id, patch);
            if (updated) {
              setBooking(updated);
              if (updated.category === "hotel") syncHotelExpense(updated, store.expenses, store.saveExpense, store.deleteExpense);
            }
            setEditing(false);
          }}
        />
      ) : null}
      <ToastBar toast={store.toast} />
    </ScreenShell>
  );
}

const FLIGHT_STATUS_TABS: { key: FlightStatus; label: string }[] = (Object.keys(FLIGHT_STATUS_LABEL) as FlightStatus[]).map((key) => ({ key, label: FLIGHT_STATUS_LABEL[key] }));

function EditBookingSheet({ booking, onClose, onSave }: { booking: Booking; onClose: () => void; onSave: (patch: Partial<Omit<Booking, "id">>) => void }) {
  const store = useWalletStore();
  const [title, setTitle] = useState(booking.title);
  const [address, setAddress] = useState(booking.address ?? "");
  const [checkIn, setCheckIn] = useState(booking.checkIn.slice(0, 10));
  const [checkOut, setCheckOut] = useState(booking.checkOut?.slice(0, 10) ?? "");
  const [guests, setGuests] = useState(booking.guests ? String(booking.guests) : "");
  const [totalPrice, setTotalPrice] = useState(booking.totalPrice ?? "");
  const [phone, setPhone] = useState(booking.phone ?? "");
  // מחיר-מלון אמיתי (סכום+מטבע+אמצעי-תשלום), ניתן-לעריכה גם כאן — לא רק
  // ביצירה — לפי אותו עיקרון "תמיד עריכה, לא משהו קבוע".
  const [hotelAmount, setHotelAmount] = useState(booking.hotelPriceAmount != null ? String(booking.hotelPriceAmount) : "");
  const [hotelCurrency, setHotelCurrency] = useState(booking.hotelPriceCurrency ?? (store.hydrated ? store.localCurrency.currencyCode : "usd"));
  const [hotelMethod, setHotelMethod] = useState<PaymentMethod>(booking.hotelPriceMethod ?? "cash");
  // לפי העיקרון "תמיד עריכה, לא משהו קבוע" — גם השדות החדשים (שעת-איסוף/
  // מספר-טיסה/שעת-המראה/סטטוס) ניתנים לעריכה כאן, לא רק בעת יצירה.
  const [pickupTime, setPickupTime] = useState(booking.pickupTime ?? "");
  // הלוך-חזור באותה הזמנה — ניתן-לעריכה גם כאן, אותו עיקרון.
  const [isRoundTrip, setIsRoundTrip] = useState(booking.isRoundTrip ?? false);
  const [returnPickupTime, setReturnPickupTime] = useState(booking.returnPickupTime ?? "");
  const [flightNumber, setFlightNumber] = useState(booking.flightNumber ?? "");
  const [departTime, setDepartTime] = useState(booking.departTime ?? "");
  const [flightStatus, setFlightStatus] = useState<FlightStatus>(booking.flightStatus ?? "on_time");

  // אותה דרישה בדיוק כמו ביצירה חדשה: בלי checkOut, מלון לא נספר ככיסוי
  // אף לילה, והזמנה הלוך-חזור בלי תאריך-חזרה לא באמת "הלוך-חזור".
  const canSave =
    title.trim().length > 0 &&
    checkIn.length > 0 &&
    !(booking.category === "hotel" && !checkOut) &&
    !(booking.category === "transport" && isRoundTrip && !checkOut) &&
    !(checkOut && checkOut < checkIn);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: "480px", background: "#0e1930", borderTop: "1px solid rgba(120,150,200,0.2)", borderTopLeftRadius: "20px", borderTopRightRadius: "20px", padding: "16px", maxHeight: "85vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: SPACE.md }}>
        <div style={{ fontSize: "15px", fontWeight: 800, color: "#f4f6fb" }}>עריכת פרטי ההזמנה</div>
        <Field label="כותרת">
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="כתובת (לא חובה)">
          <input value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
        </Field>
        <div style={{ display: "flex", gap: SPACE.sm }}>
          <div style={{ flex: 1 }}>
            <Field label="תאריך הגעה">
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} style={inputStyle} />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label={booking.category === "hotel" ? "עד תאריך (מכסה את כל הלילות שביניהם)" : booking.category === "transport" && isRoundTrip ? "תאריך החזרה" : "תאריך עזיבה (לא חובה)"}>
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </div>
        <Field label="מספר אורחים (לא חובה)">
          <input type="number" min={1} value={guests} onChange={(e) => setGuests(e.target.value)} style={inputStyle} />
        </Field>
        {booking.category === "hotel" ? (
          <Field label="מחיר המלון (לא חובה) — נכנס אוטומטית כהוצאה">
            <div style={{ display: "flex", gap: SPACE.sm }}>
              <div style={{ width: "120px", flexShrink: 0 }}>
                <CurrencyPickerButton selectedCode={hotelCurrency} onSelect={setHotelCurrency} priorityCodes={defaultCurrencyPriority(store.hydrated ? store.localCurrency.currencyCode : undefined)} />
              </div>
              <input type="number" value={hotelAmount} onChange={(e) => setHotelAmount(e.target.value)} onFocus={(e) => e.target.select()} placeholder="סכום" style={{ ...inputStyle, flex: 1, textAlign: "left" }} />
            </div>
            <div style={{ display: "flex", gap: SPACE.sm, marginTop: SPACE.sm }}>
              <button
                type="button"
                onClick={() => setHotelMethod("cash")}
                style={{ flex: 1, padding: "8px", borderRadius: "10px", background: hotelMethod === "cash" ? `${COLOR.primary}22` : COLOR.cardElevated, border: `1px solid ${hotelMethod === "cash" ? COLOR.primary : COLOR.border}`, color: hotelMethod === "cash" ? COLOR.primaryLight : COLOR.textSecondary, fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
              >
                מזומן
              </button>
              <button
                type="button"
                onClick={() => setHotelMethod("credit")}
                style={{ flex: 1, padding: "8px", borderRadius: "10px", background: hotelMethod === "credit" ? `${COLOR.primary}22` : COLOR.cardElevated, border: `1px solid ${hotelMethod === "credit" ? COLOR.primary : COLOR.border}`, color: hotelMethod === "credit" ? COLOR.primaryLight : COLOR.textSecondary, fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
              >
                כרטיס אשראי
              </button>
            </div>
          </Field>
        ) : (
          <Field label="סכום כולל (לא חובה)">
            <input value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} placeholder="לדוגמה: ₪1,850" style={inputStyle} />
          </Field>
        )}
        <Field label="טלפון (לא חובה)">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
        </Field>

        {booking.category === "transport" ? (
          <>
            <Field label={isRoundTrip ? "שעת איסוף להלוך (לא חובה)" : "שעת איסוף (לא חובה)"}>
              <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} style={inputStyle} />
            </Field>
            <button
              type="button"
              onClick={() => setIsRoundTrip((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", borderRadius: "10px", background: isRoundTrip ? `${COLOR.primary}22` : COLOR.cardElevated, border: `1px solid ${isRoundTrip ? COLOR.primary : COLOR.border}`, color: isRoundTrip ? COLOR.primaryLight : COLOR.textSecondary, fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
            >
              <span aria-hidden style={{ width: "18px", height: "18px", borderRadius: "5px", border: `2px solid ${isRoundTrip ? COLOR.primary : COLOR.textSecondary}`, background: isRoundTrip ? COLOR.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#fff", flexShrink: 0 }}>
                {isRoundTrip ? "✓" : ""}
              </span>
              הזמנה הלוך-חזור (גם חזרה)
            </button>
            {isRoundTrip ? (
              <Field label="שעת איסוף לחזרה (לא חובה)">
                <input type="time" value={returnPickupTime} onChange={(e) => setReturnPickupTime(e.target.value)} style={inputStyle} />
              </Field>
            ) : null}
          </>
        ) : null}

        {booking.category === "flight" ? (
          <>
            <div style={{ display: "flex", gap: SPACE.sm }}>
              <div style={{ flex: 1 }}>
                <Field label="מספר טיסה (לא חובה)">
                  <input value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} placeholder="לדוגמה: LY 082" style={inputStyle} />
                </Field>
              </div>
              <div style={{ flex: 1 }}>
                <Field label="שעת המראה (לא חובה)">
                  <input type="time" value={departTime} onChange={(e) => setDepartTime(e.target.value)} style={inputStyle} />
                </Field>
              </div>
            </div>
            <Field label="סטטוס הטיסה">
              <PillTabs options={FLIGHT_STATUS_TABS} value={flightStatus} onChange={setFlightStatus} />
            </Field>
          </>
        ) : null}

        <PrimaryButton
          disabled={!canSave}
          onClick={() =>
            canSave &&
            onSave({
              title: title.trim(),
              address: address.trim() || undefined,
              checkIn,
              checkOut: checkOut || undefined,
              guests: guests ? Number(guests) : undefined,
              totalPrice: booking.category !== "hotel" && totalPrice.trim() ? totalPrice.trim() : undefined,
              phone: phone.trim() || undefined,
              pickupTime: booking.category === "transport" && pickupTime ? pickupTime : undefined,
              isRoundTrip: booking.category === "transport" && isRoundTrip ? true : undefined,
              returnPickupTime: booking.category === "transport" && isRoundTrip && returnPickupTime ? returnPickupTime : undefined,
              flightNumber: booking.category === "flight" && flightNumber.trim() ? flightNumber.trim() : undefined,
              departTime: booking.category === "flight" && departTime ? departTime : undefined,
              flightStatus: booking.category === "flight" ? flightStatus : undefined,
              hotelPriceAmount: booking.category === "hotel" && Number(hotelAmount) > 0 ? Number(hotelAmount) : undefined,
              hotelPriceCurrency: booking.category === "hotel" && Number(hotelAmount) > 0 ? hotelCurrency : undefined,
              hotelPriceMethod: booking.category === "hotel" && Number(hotelAmount) > 0 ? hotelMethod : undefined,
            })
          }
        >
          שמירה
        </PrimaryButton>
      </div>
    </div>
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
