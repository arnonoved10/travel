"use client";

import { useActionState, useEffect, useState } from "react";
import { createHotelStayAction, type BookingFormState } from "./actions";
import { inputStyle, submitButtonStyle } from "./form-styles";
import { CurrencySelect } from "@/components/currency-select";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { LocationPickerMap } from "@/components/location-picker-map";

const initialState: BookingFormState = {};

/** "YYYY-MM-DD" + N לילות → תאריך-יציאה. חשבון-תאריכים מקומי (לא UTC), כמו
 * DatePicker/toDateStr — נמנע מהחלקה של יום כשהאזור שלילי ל-UTC. */
function addNights(dateStr: string, nights: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  date.setDate(date.getDate() + nights);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** בכוונה מינימלי: שם+תאריך+לילות בלבד למעלה — הכל השאר (סוג חדר/קומה/מחיר/
 * אישור וכו') מקופל ב"פרטים נוספים", כי רובו ממילא מתמלא-מראש מהחיפוש
 * (כתובת/טלפון/אתר) או שהוא באמת אופציונלי. בקשת משתמש: "אני רק בוחר תאריך
 * ושם המלון וכמה לילות סגרתי שם, ואתה ממלא את הכל — למה אתה מבקש כל כך הרבה
 * פרטים". תאריך-היציאה מחושב מהלילות, לא נשאל בנפרד. */
export function HotelStayForm({
  tripId,
  plannedActivityId = null,
  defaultValues,
  preferredCurrencyCodes,
  onSuccess,
}: {
  tripId: string;
  plannedActivityId?: string | null;
  defaultValues?: { hotelName?: string; agreedPrice?: number; agreedCurrencyCode?: string; checkInDate?: string };
  preferredCurrencyCodes?: string[];
  onSuccess?: (createdId: string) => void;
}) {
  const action = createHotelStayAction.bind(null, tripId, plannedActivityId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state !== initialState && !state.formError && !state.fieldErrors && state.createdId) onSuccess?.(state.createdId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  const [hotelName, setHotelName] = useState(defaultValues?.hotelName ?? "");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [checkInDate, setCheckInDate] = useState(defaultValues?.checkInDate ?? "");
  // מחרוזת, לא מספר — לא לכפות מינימום-1 על כל הקשה (בקשת משתמש: "אופציה גם
  // לרשום את מספר הלילות, ולא רק להעלות בחיצים"). ה-input type="number" הקיים
  // כבר תמך בהקלדה טכנית, אבל onChange שמחשב Math.max(1, Number(v)||1) בכל
  // הקשה היה מאפס לשדה ריק בחזרה ל-1 מיד כשמנסים למחוק כדי להקליד מספר חדש —
  // מרגיש כאילו אי אפשר להקליד, רק לדפדף בחיצים. הבהרה-למינימום-1 קורית רק
  // בחישוב checkOutDate למטה, לא על הערך המוצג עצמו.
  const [nightsInput, setNightsInput] = useState("1");
  const nights = Math.max(1, Number(nightsInput) || 1);
  const checkOutDate = checkInDate ? addNights(checkInDate, nights) : "";

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <input type="hidden" name="hotelName" value={hotelName} required />
      <input type="hidden" name="address" value={address} />
      <input type="hidden" name="lat" value={location?.lat ?? ""} />
      <input type="hidden" name="lng" value={location?.lng ?? ""} />
      <input type="hidden" name="checkOutDate" value={checkOutDate} required />
      <LocationPickerMap
        value={location}
        onPick={(lat, lng) => setLocation({ lat, lng })}
        nameValue={hotelName}
        onNameChange={setHotelName}
        onAddressChange={setAddress}
        onDetailsChange={(r) => {
          if (r.phone) setPhone(r.phone);
          if (r.website) setWebsite(r.website);
        }}
        searchPlaceholder="שם המלון — הקלד כדי לחפש"
      />
      {address ? <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>כתובת: {address}</p> : null}
      {state?.fieldErrors?.hotelName?.map((m) => (
        <ErrorText key={m}>{m}</ErrorText>
      ))}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <DatePicker name="checkInDate" required value={checkInDate} onChange={setCheckInDate} style={{ minWidth: "140px", flex: "1 1 140px" }} placeholder="תאריך צ'ק-אין" />
        <input
          type="number"
          min="1"
          value={nightsInput}
          onChange={(e) => setNightsInput(e.target.value)}
          onBlur={() => setNightsInput(String(nights))}
          style={{ ...inputStyle, width: "5.5rem" }}
          title="מספר לילות"
        />
        <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>לילות</span>
        {checkOutDate ? (
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>← יציאה ב-{checkOutDate}</span>
        ) : null}
      </div>
      {state?.fieldErrors?.checkOutDate?.map((m) => (
        <ErrorText key={m}>{m}</ErrorText>
      ))}
      {state?.formError ? <ErrorText>{state.formError}</ErrorText> : null}

      <details>
        <summary style={{ cursor: "pointer", fontSize: "0.8125rem", color: "var(--color-primary)" }}>פרטים נוספים (אופציונלי — ממולאים כשאפשר)</summary>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input name="checkInTime" type="time" style={{ ...inputStyle, minWidth: "100px" }} title="שעת צ'ק-אין" />
            <input name="checkOutTime" type="time" style={{ ...inputStyle, minWidth: "100px" }} title="שעת צ'ק-אאוט" />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input name="roomType" placeholder="סוג חדר" style={inputStyle} />
            <input
              name="agreedPrice"
              type="number"
              min="0"
              placeholder="מחיר כולל"
              defaultValue={defaultValues?.agreedPrice}
              style={inputStyle}
            />
            <CurrencySelect
              name="agreedCurrencyCode"
              defaultValue={defaultValues?.agreedCurrencyCode}
              preferredCurrencyCodes={preferredCurrencyCodes}
              style={{ ...inputStyle, flex: "1 1 140px" }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input name="floor" placeholder="קומה" style={inputStyle} />
            <input name="view" placeholder="נוף" style={inputStyle} />
            <input name="bedType" placeholder="סוג מיטה" style={inputStyle} />
            <input name="guestsCount" type="number" min="1" placeholder="מס' אורחים" style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input name="breakfastHours" placeholder="שעות ארוחת בוקר" style={inputStyle} />
            <input name="breakfastLocation" placeholder="מיקום ארוחת בוקר" style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input name="breakfastPrice" type="number" min="0" placeholder="מחיר ארוחת בוקר" style={inputStyle} />
            <Select
              name="breakfastPriceUnit"
              defaultValue=""
              style={inputStyle}
              placeholder="יחידת תמחור"
              options={[
                { value: "per_person", label: "לאדם" },
                { value: "per_room", label: "לחדר" },
                { value: "per_day", label: "ליום" },
                { value: "per_stay", label: "לכל השהות" },
              ]}
            />
          </div>
          <div style={{ display: "flex", gap: "1rem", fontSize: "0.8125rem", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <input name="earlyCheckIn" type="checkbox" /> צ&apos;ק-אין מוקדם
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <input name="lateCheckOut" type="checkbox" /> צ&apos;ק-אאוט מאוחר
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <input name="smoking" type="checkbox" /> חדר מעשנים
            </label>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input name="confirmationNumber" placeholder="מספר אישור" style={inputStyle} />
            <input name="externalBookingId" placeholder="מספר הזמנה חיצוני" style={inputStyle} />
          </div>
          <input name="cancellationPolicy" placeholder="מדיניות ביטול" style={inputStyle} />
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input name="phone" placeholder="טלפון" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
            <input name="whatsapp" placeholder="WhatsApp" style={inputStyle} />
            <input name="email" type="email" placeholder="אימייל" style={inputStyle} />
            <input name="website" placeholder="אתר" value={website} onChange={(e) => setWebsite(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </details>

      <button type="submit" disabled={isPending} className="ui-btn-primary" style={submitButtonStyle(isPending)}>
        {isPending ? "שומר..." : "הוסף מלון"}
      </button>
    </form>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>{children}</span>;
}
