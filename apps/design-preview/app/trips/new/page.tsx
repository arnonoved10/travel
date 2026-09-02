"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ScreenShell, ScreenHeader, Card, Field, PrimaryButton, IconPill, inputStyle, COLOR, SPACE, PinIcon } from "../../design-system";
import { CountryPickerButton } from "../../pickers";
import { COUNTRIES } from "../../country-currency-data";
import { saveCustomTrip } from "../../trips-data";
import { ToastBar } from "../../toast-bar";
import type { ToastState } from "../../toast-bar";

const STYLES = [
  { key: "adventure", label: "הרפתקאות" },
  { key: "culture", label: "תרבות" },
  { key: "relax", label: "מנוחה" },
  { key: "vacation", label: "חופשה" },
] as const;

function NewTripForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [countryCode, setCountryCode] = useState<string | null>(params.get("country"));
  const [startDate, setStartDate] = useState(params.get("start") ?? "");
  const [endDate, setEndDate] = useState(params.get("end") ?? "");
  const [style, setStyle] = useState<(typeof STYLES)[number]["key"]>("vacation");
  const [budgetMin, setBudgetMin] = useState(6000);
  const [budgetMax, setBudgetMax] = useState(10000);
  const [countryName, setCountryName] = useState<string>(() => COUNTRIES.find((c) => c.code === params.get("country"))?.nameHe ?? "");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const nights = startDate && endDate ? Math.max(0, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)) : 0;

  function handleSubmit() {
    if (!countryCode) return setError("יש לבחור יעד");
    if (!startDate || !endDate) return setError("יש להזין תאריכי התחלה וסיום");
    if (endDate < startDate) return setError("תאריך הסיום חייב להיות אחרי תאריך ההתחלה");
    setError(null);
    const trip = saveCustomTrip({ name: countryName || countryCode, countryCode, startDate, endDate, nights: nights + 1, travelers: 2 });
    setToast({ message: "הטיול נוצר בהצלחה" });
    setTimeout(() => router.push(`/trips/${trip.id}`), 500);
  }

  return (
    <ScreenShell>
      <ScreenHeader title="טיול חדש" />

      <Field label="בחר יעד">
        <CountryPickerButton
          selectedCode={countryCode}
          onSelect={(c) => {
            setCountryCode(c.code);
            setCountryName(c.nameHe);
          }}
          placeholder="לחצו לבחירת יעד"
        />
      </Field>

      <Card style={{ display: "flex", flexDirection: "column", gap: SPACE.md }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary }}>תאריכי הטיול</div>
        <Field label="תאריך התחלה">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="תאריך סיום">
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
        </Field>
        {nights > 0 ? <div style={{ fontSize: "12px", color: COLOR.textSecondary }}>משך הטיול: {nights} לילות / {nights + 1} ימים</div> : null}
      </Card>

      <div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>סגנון הטיול</div>
        <div style={{ display: "flex", gap: SPACE.sm }}>
          {STYLES.map((s) => (
            <IconPill key={s.key} label={s.label} icon={<PinIcon color={style === s.key ? COLOR.primaryLight : COLOR.textSecondary} />} active={style === s.key} onClick={() => setStyle(s.key)} />
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>
          תקציב משוער לאדם: ₪{budgetMin.toLocaleString()} - ₪{budgetMax.toLocaleString()}
        </div>
        <input type="range" min={1000} max={20000} step={500} value={budgetMin} onChange={(e) => setBudgetMin(Math.min(Number(e.target.value), budgetMax - 500))} style={{ width: "100%" }} />
        <input type="range" min={1000} max={20000} step={500} value={budgetMax} onChange={(e) => setBudgetMax(Math.max(Number(e.target.value), budgetMin + 500))} style={{ width: "100%" }} />
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
