"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScreenShell, ScreenHeader, Field, PrimaryButton, IconPill, inputStyle, textareaStyle, COLOR, SPACE, PinIcon, SuitcaseIcon, DocumentIcon } from "../../../../design-system";
import { saveActivity, findActivity, loadStops, type TripActivity } from "../../../../trip-content";
import { nextId, today } from "../../../../wallet-data";
import { geocodeQueryAction } from "../../../../actions";

const CATEGORIES: { key: TripActivity["category"]; label: string }[] = [
  { key: "עוד", label: "עוד" },
  { key: "טיול", label: "טיול" },
  { key: "קניות", label: "קניות" },
  { key: "אוכל", label: "אוכל" },
  { key: "אתר", label: "אתר" },
];

function AddActivityForm() {
  const router = useRouter();
  const search = useSearchParams();
  const editId = search.get("id");
  const date = search.get("day") || today();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TripActivity["category"]>("אתר");
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState("שעה");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [existingLatLon, setExistingLatLon] = useState<{ lat?: number; lon?: number }>({});

  // עריכה (לא רק הוספה): אם הגענו עם ?id=, טוענים את הפעילות הקיימת
  // ושומרים תחת אותו id — לפני התיקון הזה "עריכת פעילות" יצרה בטעות
  // פעילות כפולה חדשה במקום לעדכן את הקיימת. נמצא ונתפס בבדיקה.
  useEffect(() => {
    if (!editId) return;
    const found = findActivity(editId);
    if (!found) return;
    setTitle(found.activity.title);
    setCategory(found.activity.category);
    setTime(found.activity.time);
    setDuration(found.activity.durationLabel);
    setLocation(found.activity.location);
    setNotes(found.activity.notes);
    setExistingLatLon({ lat: found.activity.lat, lon: found.activity.lon });
  }, [editId]);

  async function handleSave() {
    if (!title.trim() || saving) return setError(title.trim() ? null : "יש להזין שם פעילות");
    setError(null);
    setSaving(true);
    // מאתרים קואורדינטות אמיתיות למיקום (על בסיס העיר של התחנה שהיום הזה
    // שייך אליה, כדי לא לבלבל בין מקומות באותו שם) — רק אם הוזן מיקום
    // ואין עדיין אחד שמור, כדי לא לשלוח קריאה מיותרת בכל שמירה.
    let lat = existingLatLon.lat;
    let lon = existingLatLon.lon;
    if (location.trim() && (lat == null || lon == null)) {
      const stop = loadStops().find((s) => date >= s.startDate && date <= s.endDate);
      const geo = await geocodeQueryAction(stop ? `${location.trim()}, ${stop.city}` : location.trim(), stop?.countryCode);
      lat = geo?.lat;
      lon = geo?.lon;
    }
    saveActivity(date, { id: editId ?? nextId("act"), time, durationLabel: duration, title: title.trim(), category, location, notes, lat, lon });
    router.back();
  }

  return (
    <ScreenShell>
      <ScreenHeader title={editId ? "עריכת פעילות" : "הוספת פעילות"} />
      <Field label="שם הפעילות">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="הכנס שם פעילות" style={inputStyle} />
      </Field>
      <div>
        <div style={{ fontSize: "12.5px", fontWeight: 600, color: COLOR.textSecondary, marginBottom: SPACE.sm }}>קטגוריה</div>
        <div style={{ display: "flex", gap: SPACE.sm, overflowX: "auto" }}>
          {CATEGORIES.map((c) => (
            <IconPill key={c.key} label={c.label} icon={<SuitcaseIcon color={category === c.key ? COLOR.primaryLight : COLOR.textSecondary} />} active={category === c.key} onClick={() => setCategory(c.key)} />
          ))}
        </div>
      </div>
      <Field label="תאריך">
        <input type="date" value={date} readOnly style={inputStyle} />
      </Field>
      <div style={{ display: "flex", gap: SPACE.sm }}>
        <Field label="שעת התחלה">
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="משך זמן">
          <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="שעה" style={inputStyle} />
        </Field>
      </div>
      <Field label="מיקום">
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="הכנס מיקום או בחר מהמפה" style={inputStyle} />
      </Field>
      <Field label="הערות">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="הערות (אופציונלי)" style={textareaStyle} />
      </Field>
      {error ? <div style={{ color: COLOR.danger, fontSize: "12.5px" }}>{error}</div> : null}
      <PrimaryButton onClick={handleSave} disabled={saving}>{saving ? "מאתר מיקום..." : editId ? "עדכן פעילות" : "שמור פעילות"}</PrimaryButton>
    </ScreenShell>
  );
}

export default function AddActivityScreen() {
  return (
    <Suspense fallback={null}>
      <AddActivityForm />
    </Suspense>
  );
}
