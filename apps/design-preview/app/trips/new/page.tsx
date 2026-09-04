"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ScreenShell, ScreenHeader, Card, Field, PrimaryButton, SecondaryButton, IconPill, TrashIcon, inputStyle, COLOR, SPACE, PinIcon } from "../../design-system";
import { CountryPickerButton } from "../../pickers";
import { COUNTRIES } from "../../country-currency-data";
import { saveCustomTrip } from "../../trips-data";
import { addStop } from "../../trip-content";
import { ToastBar } from "../../toast-bar";
import type { ToastState } from "../../toast-bar";

const STYLES = [
  { key: "adventure", label: "הרפתקאות" },
  { key: "culture", label: "תרבות" },
  { key: "relax", label: "מנוחה" },
  { key: "vacation", label: "חופשה" },
] as const;

interface DestinationDraft {
  key: number;
  countryCode: string | null;
  countryName: string;
  city: string;
  startDate: string;
  endDate: string;
}

let draftKeySeq = 0;
function emptyDestination(countryCode: string | null, countryName: string, startDate: string, endDate: string): DestinationDraft {
  draftKeySeq += 1;
  return { key: draftKeySeq, countryCode, countryName, city: "", startDate, endDate };
}

function NewTripForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialCountryCode = params.get("country");
  const initialCountryName = COUNTRIES.find((c) => c.code === initialCountryCode)?.nameHe ?? "";
  const [destinations, setDestinations] = useState<DestinationDraft[]>([
    emptyDestination(initialCountryCode, initialCountryName, params.get("start") ?? "", params.get("end") ?? ""),
  ]);
  const [adults, setAdults] = useState("");
  const [children, setChildren] = useState("");
  const [style, setStyle] = useState<(typeof STYLES)[number]["key"]>("vacation");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  function updateDestination(key: number, patch: Partial<DestinationDraft>) {
    setDestinations((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }
  function addDestination() {
    setDestinations((prev) => [...prev, emptyDestination(null, "", "", "")]);
  }
  function removeDestination(key: number) {
    setDestinations((prev) => (prev.length > 1 ? prev.filter((d) => d.key !== key) : prev));
  }

  function handleSubmit() {
    if (destinations.some((d) => !d.countryCode)) return setError("יש לבחור יעד לכל שורה");
    if (destinations.some((d) => !d.startDate || !d.endDate)) return setError("יש להזין תאריכי התחלה וסיום לכל יעד");
    if (destinations.some((d) => d.endDate < d.startDate)) return setError("תאריך הסיום חייב להיות אחרי תאריך ההתחלה");
    const adultsNum = Number(adults);
    if (!adults || adultsNum < 1) return setError("יש להזין לפחות מבוגר אחד");
    const childrenNum = children ? Number(children) : 0;
    setError(null);

    const startDate = destinations.reduce((min, d) => (d.startDate < min ? d.startDate : min), destinations[0]!.startDate);
    const endDate = destinations.reduce((max, d) => (d.endDate > max ? d.endDate : max), destinations[0]!.endDate);
    const nights = Math.max(0, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000));
    const first = destinations[0]!;

    const trip = saveCustomTrip({
      name: first.countryName || first.countryCode!,
      countryCode: first.countryCode!,
      startDate,
      endDate,
      nights,
      adults: adultsNum,
      children: childrenNum,
    });
    // תחנה נוצרת אוטומטית רק כשבאמת יש כמה יעדים — טיול ביעד יחיד (המקרה
    // הנפוץ) נשאר בלי אף תחנה, כמו קודם: תחנה יחידה שמכסה את כל טווח
    // הטיול הייתה "מסתירה" תחנות מדויקות-יותר שנוספות אחר-כך דרך /route
    // לאותם תאריכים (cityForDate בוחרת את התחנה הראשונה שמכסה תאריך נתון).
    if (destinations.length > 1) {
      for (const d of destinations) {
        addStop(trip.id, { city: d.city.trim() || d.countryName, countryCode: d.countryCode!, startDate: d.startDate, endDate: d.endDate, transportToNext: "" });
      }
    }
    setToast({ message: "הטיול נוצר בהצלחה" });
    setTimeout(() => router.push(`/trips/${trip.id}`), 500);
  }

  return (
    <ScreenShell>
      <ScreenHeader title="טיול חדש" />

      <div style={{ display: "flex", flexDirection: "column", gap: SPACE.md }}>
        {destinations.map((d, idx) => (
          <Card key={d.key} style={{ display: "flex", flexDirection: "column", gap: SPACE.md }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>יעד {idx + 1}</div>
              {destinations.length > 1 ? (
                <button
                  type="button"
                  aria-label="הסרת יעד"
                  onClick={() => removeDestination(d.key)}
                  style={{ width: "32px", height: "32px", borderRadius: "50%", background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <TrashIcon size={16} />
                </button>
              ) : null}
            </div>
            <Field label="בחר יעד">
              <CountryPickerButton
                selectedCode={d.countryCode}
                onSelect={(c) => updateDestination(d.key, { countryCode: c.code, countryName: c.nameHe })}
                placeholder="לחצו לבחירת יעד"
              />
            </Field>
            <Field label="עיר (לא חובה)">
              <input value={d.city} onChange={(e) => updateDestination(d.key, { city: e.target.value })} style={inputStyle} placeholder={d.countryName || "שם העיר"} />
            </Field>
            <Field label="תאריך התחלה">
              <input type="date" value={d.startDate} onChange={(e) => updateDestination(d.key, { startDate: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="תאריך סיום">
              <input type="date" value={d.endDate} onChange={(e) => updateDestination(d.key, { endDate: e.target.value })} style={inputStyle} />
            </Field>
          </Card>
        ))}
        <SecondaryButton onClick={addDestination}>+ הוספת יעד</SecondaryButton>
      </div>

      <Card style={{ display: "flex", flexDirection: "column", gap: SPACE.md }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>נוסעים</div>
        <Field label="מבוגרים">
          <input type="number" min={1} value={adults} onChange={(e) => setAdults(e.target.value)} style={inputStyle} placeholder="לדוגמה: 2" />
        </Field>
        <Field label="ילדים">
          <input type="number" min={0} value={children} onChange={(e) => setChildren(e.target.value)} style={inputStyle} placeholder="לדוגמה: 0" />
        </Field>
      </Card>

      <div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>סגנון הטיול</div>
        <div style={{ display: "flex", gap: SPACE.sm }}>
          {STYLES.map((s) => (
            <IconPill key={s.key} label={s.label} icon={<PinIcon color={style === s.key ? COLOR.primaryLight : COLOR.textSecondary} />} active={style === s.key} onClick={() => setStyle(s.key)} />
          ))}
        </div>
      </div>

      {error ? <div style={{ color: COLOR.danger, fontSize: "12.5px" }}>{error}</div> : null}
      <PrimaryButton onClick={handleSubmit}>יצירת טיול</PrimaryButton>
      <ToastBar toast={toast} />
    </ScreenShell>
  );
}

export default function NewTripScreen() {
  return (
    <Suspense fallback={null}>
      <NewTripForm />
    </Suspense>
  );
}
