"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScreenShell, ScreenHeader, PillTabs, Field, PrimaryButton, inputStyle, COLOR, SPACE } from "../../design-system";
import { createBooking, syncHotelExpense, CATEGORY_LABEL, FLIGHT_STATUS_LABEL, type BookingCategory, type FlightStatus } from "../../bookings-data";
import { today, defaultCurrencyPriority, type PaymentMethod } from "../../wallet-data";
import { CurrencyPickerButton } from "../../pickers";
import { useWalletStore } from "../../wallet-store";

const CATEGORY_TABS: { key: BookingCategory; label: string }[] = (Object.keys(CATEGORY_LABEL) as BookingCategory[]).map((key) => ({ key, label: CATEGORY_LABEL[key] }));
const FLIGHT_STATUS_TABS: { key: FlightStatus; label: string }[] = (Object.keys(FLIGHT_STATUS_LABEL) as FlightStatus[]).map((key) => ({ key, label: FLIGHT_STATUS_LABEL[key] }));

function isBookingCategory(value: string | null): value is BookingCategory {
  return !!value && Object.prototype.hasOwnProperty.call(CATEGORY_LABEL, value);
}

/** יצירת הזמנה חדשה (מלון/טיסה/תחבורה/רכב/אטרקציה) — לפני כן לא הייתה שום
 * דרך ליצור הזמנה במסך הזה, רק לערוך/לבטל/למחוק הזמנות-דמו קבועות. תומך
 * במילוי-מראש דרך ה-URL (?category=hotel&date=2026-01-01) — לשימוש מכרטיס
 * "מלונות" בדף הבית, שמפנה ישירות ליום ספציפי שטרם הוזמן. */
function NewBookingForm() {
  const router = useRouter();
  const store = useWalletStore();
  const params = useSearchParams();
  const prefillCategory = params.get("category");
  const prefillDate = params.get("date");
  const [category, setCategory] = useState<BookingCategory>(isBookingCategory(prefillCategory) ? prefillCategory : "hotel");
  const [title, setTitle] = useState("");
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [checkIn, setCheckIn] = useState(prefillDate || today());
  const [checkOut, setCheckOut] = useState("");
  const [address, setAddress] = useState("");
  const [guests, setGuests] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [phone, setPhone] = useState("");
  // שדות חדשים לטיימר-אמיתי בדף הבית (לא ספירה-לאחור ברמת-יום בלבד):
  // שעת-איסוף להסעה; מספר-טיסה/שעת-המראה/סטטוס לטיסה. הסטטוס מוזן ידנית
  // (לא חיבור-חי — ר' תיעוד ב-bookings-data.ts).
  const [pickupTime, setPickupTime] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [departTime, setDepartTime] = useState("");
  const [flightStatus, setFlightStatus] = useState<FlightStatus>("on_time");
  // מחיר-מלון אמיתי (סכום+מטבע+אמצעי-תשלום) — category "hotel" בלבד, נכנס
  // אוטומטית כהוצאה אמיתית בארנק (ר' syncHotelExpense) לפי בקשה מפורשת:
  // "לא משנה אם ארשום את זה בהוצאה או במלון, זה יכנס כהוצאה".
  const [hotelAmount, setHotelAmount] = useState("");
  const [hotelCurrency, setHotelCurrency] = useState("usd");
  const [hotelMethod, setHotelMethod] = useState<PaymentMethod>("cash");
  const [error, setError] = useState<string | null>(null);
  // store.localCurrency נטען אסינכרונית מ-localStorage (ר' useWalletStore) —
  // ה-useState למעלה לא יכול "לחכות" לו (רץ פעם אחת בלבד ב-mount), אז
  // מעדכנים ברגע שה-store באמת hydrated, לפני שהמשתמש מספיק לגעת בבחירה.
  useEffect(() => {
    if (store.hydrated) setHotelCurrency(store.localCurrency.currencyCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.hydrated]);

  function handleSave() {
    if (!title.trim()) return setError("יש להזין שם להזמנה");
    if (!checkIn) return setError("יש לבחור תאריך");
    setError(null);
    const booking = createBooking({
      category,
      title: title.trim(),
      confirmationNumber: confirmationNumber.trim() || "—",
      status: "confirmed",
      checkIn,
      checkOut: checkOut || undefined,
      address: address.trim() || undefined,
      guests: guests ? Number(guests) : undefined,
      totalPrice: category !== "hotel" && totalPrice.trim() ? totalPrice.trim() : undefined,
      phone: phone.trim() || undefined,
      pickupTime: category === "transport" && pickupTime ? pickupTime : undefined,
      flightNumber: category === "flight" && flightNumber.trim() ? flightNumber.trim() : undefined,
      departTime: category === "flight" && departTime ? departTime : undefined,
      flightStatus: category === "flight" ? flightStatus : undefined,
      hotelPriceAmount: category === "hotel" && Number(hotelAmount) > 0 ? Number(hotelAmount) : undefined,
      hotelPriceCurrency: category === "hotel" && Number(hotelAmount) > 0 ? hotelCurrency : undefined,
      hotelPriceMethod: category === "hotel" && Number(hotelAmount) > 0 ? hotelMethod : undefined,
    });
    if (category === "hotel") syncHotelExpense(booking, store.expenses, store.saveExpense, store.deleteExpense);
    router.push(`/bookings/${booking.id}`);
  }

  return (
    <ScreenShell>
      <ScreenHeader title="הזמנה חדשה" />

      <Field label="סוג ההזמנה">
        <PillTabs options={CATEGORY_TABS} value={category} onChange={setCategory} />
      </Field>

      <Field label="שם ההזמנה">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={category === "hotel" ? "לדוגמה: מלון LK בנגקוק" : category === "car" ? "לדוגמה: השכרת רכב - Sixt" : "שם ההזמנה"} style={inputStyle} />
      </Field>

      <Field label="מספר אישור (לא חובה)">
        <input value={confirmationNumber} onChange={(e) => setConfirmationNumber(e.target.value)} style={inputStyle} />
      </Field>

      <div style={{ display: "flex", gap: SPACE.sm }}>
        <div style={{ flex: 1 }}>
          <Field label="תאריך הגעה">
            <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="תאריך עזיבה (לא חובה)">
            <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} style={inputStyle} />
          </Field>
        </div>
      </div>

      {category === "transport" ? (
        <Field label="שעת איסוף (לא חובה)">
          <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} style={inputStyle} />
        </Field>
      ) : null}

      {category === "flight" ? (
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

      <Field label="כתובת (לא חובה)">
        <input value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
      </Field>

      <Field label="מספר אורחים (לא חובה)">
        <input type="number" min={1} value={guests} onChange={(e) => setGuests(e.target.value)} style={inputStyle} />
      </Field>

      {category === "hotel" ? (
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

      {error ? <div style={{ color: COLOR.danger, fontSize: "12.5px" }}>{error}</div> : null}
      <PrimaryButton onClick={handleSave}>שמירת ההזמנה</PrimaryButton>
    </ScreenShell>
  );
}

export default function NewBookingScreen() {
  return (
    <Suspense fallback={null}>
      <NewBookingForm />
    </Suspense>
  );
}
