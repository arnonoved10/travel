"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, PillTabs, Field, PrimaryButton, inputStyle, COLOR, SPACE } from "../../design-system";
import { createBooking, CATEGORY_LABEL, type BookingCategory } from "../../bookings-data";
import { today } from "../../wallet-data";

const CATEGORY_TABS: { key: BookingCategory; label: string }[] = (Object.keys(CATEGORY_LABEL) as BookingCategory[]).map((key) => ({ key, label: CATEGORY_LABEL[key] }));

/** יצירת הזמנה חדשה (מלון/טיסה/תחבורה/רכב/אטרקציה) — לפני כן לא הייתה שום
 * דרך ליצור הזמנה במסך הזה, רק לערוך/לבטל/למחוק הזמנות-דמו קבועות. */
export default function NewBookingScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<BookingCategory>("hotel");
  const [title, setTitle] = useState("");
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState("");
  const [address, setAddress] = useState("");
  const [guests, setGuests] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [phone, setPhone] = useState("");
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
