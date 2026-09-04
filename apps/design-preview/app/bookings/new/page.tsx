"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScreenShell, ScreenHeader, PillTabs, Field, PrimaryButton, inputStyle, COLOR, SPACE } from "../../design-system";
import { createBooking, CATEGORY_LABEL, FLIGHT_STATUS_LABEL, type BookingCategory, type FlightStatus } from "../../bookings-data";
import { today } from "../../wallet-data";

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
  const [error, setError] = useState<string | null>(null);

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
      totalPrice: totalPrice.trim() || undefined,
      phone: phone.trim() || undefined,
      pickupTime: category === "transport" && pickupTime ? pickupTime : undefined,
      flightNumber: category === "flight" && flightNumber.trim() ? flightNumber.trim() : undefined,
      departTime: category === "flight" && departTime ? departTime : undefined,
      flightStatus: category === "flight" ? flightStatus : undefined,
    });
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

      <Field label="סכום כולל (לא חובה)">
        <input value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} placeholder="לדוגמה: ₪1,850" style={inputStyle} />
      </Field>

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
