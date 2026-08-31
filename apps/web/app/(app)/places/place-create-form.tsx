"use client";

import { useActionState, useEffect, useState } from "react";
import type { OpeningHours } from "@travel-app/shared-types";
import { PLACE_CATEGORY_LABELS } from "@/lib/place-labels";
import { LocationPickerMap } from "@/components/location-picker-map";
import { Select } from "@/components/ui/Select";
import { useGeolocation } from "@/lib/use-geolocation";
import { createPlaceAction, type PlaceFormState } from "./actions";
import { OpeningHoursEditor, CLOSED_ALL } from "./opening-hours-editor";

const initialState: PlaceFormState = {};

/** חיפוש-מקום (Google Places) ממלא-מראש כל מה שנמצא — שם/כתובת/עיר/מדינה/
 * אתר/טלפון/שעות/קטגוריה — כדי שלא יהיה צריך להקליד ידנית פרטים שכבר קיימים
 * באינטרנט. הכל נשאר ניתן-לעריכה, זו רק ברירת-מחדל, לא נעילה.
 * tripId/redirectOnSuccess/onSuccess: כשמגיע מהוספה-מהירה (quick-add-panel-
 * content.tsx) — tripId מקשר את המקום ל"רוצה לבקר" בטיול, redirectOnSuccess
 * false משאיר את הפאנל פתוח. ב-/places/new הרגיל נשארת ההתנהגות המקורית. */
export function PlaceCreateForm({
  defaultValues,
  tripId = null,
  redirectOnSuccess = true,
  onSuccess,
}: {
  defaultValues?: { name?: string; city?: string; country?: string; address?: string; officialWebsite?: string };
  tripId?: string | null;
  redirectOnSuccess?: boolean;
  onSuccess?: (createdId: string) => void;
} = {}) {
  const action = createPlaceAction.bind(null, tripId, redirectOnSuccess);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [geo, requestGeo] = useGeolocation();
  const [location, setLocation] = useState<{ lat: string; lng: string }>({ lat: "", lng: "" });
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [address, setAddress] = useState(defaultValues?.address ?? "");
  const [city, setCity] = useState(defaultValues?.city ?? "");
  const [country, setCountry] = useState(defaultValues?.country ?? "");
  const [website, setWebsite] = useState(defaultValues?.officialWebsite ?? "");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [openingHours, setOpeningHours] = useState<OpeningHours>(CLOSED_ALL);
  const pickedLocation =
    location.lat !== "" && location.lng !== "" && Number.isFinite(Number(location.lat)) && Number.isFinite(Number(location.lng))
      ? { lat: Number(location.lat), lng: Number(location.lng) }
      : null;

  useEffect(() => {
    if (state !== initialState && !state.fieldErrors && state.createdId) onSuccess?.(state.createdId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // "מיקום שבו אני נמצא" (בקשת משתמש) — ממלא lat/lng ישירות מ-GPS, בלי חיפוש.
  // רק הקואורדינטות; שם/כתובת/קטגוריה עדיין נדרשים ידנית, אין reverse-geocoding כאן.
  useEffect(() => {
    if (geo.kind !== "ready") return;
    queueMicrotask(() => setLocation({ lat: String(geo.lat), lng: String(geo.lng) }));
  }, [geo]);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "420px" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>מיקום — חפש כדי למלא הכל אוטומטית</span>
        <input type="hidden" name="lat" value={location.lat} />
        <input type="hidden" name="lng" value={location.lng} />
        <LocationPickerMap
          value={pickedLocation}
          onPick={(lat, lng) => setLocation({ lat: String(lat), lng: String(lng) })}
          nameValue={name}
          onNameChange={setName}
          onAddressChange={setAddress}
          onDetailsChange={(r) => {
            if (r.country) setCountry(r.country);
            if (r.city) setCity(r.city);
            if (r.website) setWebsite(r.website);
            if (r.phone) setPhone(r.phone);
            if (r.openingHours) setOpeningHours(r.openingHours);
            if (r.category) setCategory(r.category);
          }}
          searchPlaceholder="חפש מקום או עסק…"
        />
        {geo.kind !== "unsupported" ? (
          <button
            type="button"
            onClick={requestGeo}
            disabled={geo.kind === "loading"}
            style={{
              alignSelf: "flex-start",
              padding: "0.375rem 0.75rem",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text-muted)",
              cursor: geo.kind === "loading" ? "default" : "pointer",
              fontSize: "0.75rem",
            }}
          >
            {geo.kind === "loading" ? "מאתר…" : geo.kind === "denied" ? "אין הרשאת מיקום" : "📍 המיקום שבו אני נמצא עכשיו"}
          </button>
        ) : null}
        {pickedLocation ? (
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            קואורדינטות: {pickedLocation.lat.toFixed(5)}, {pickedLocation.lng.toFixed(5)}
          </span>
        ) : null}
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>שם המקום</span>
        <input name="name" required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        {state?.fieldErrors?.name?.map((message) => (
          <span key={message} style={errorStyle}>
            {message}
          </span>
        ))}
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>קטגוריה</span>
        <Select
          name="category"
          required
          value={category}
          onChange={setCategory}
          placeholder="בחר קטגוריה"
          options={Object.entries(PLACE_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </label>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
          <span>עיר</span>
          <input name="city" value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
          <span>מדינה</span>
          <input name="country" value={country} onChange={(e) => setCountry(e.target.value)} style={inputStyle} />
        </label>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>כתובת</span>
        <input name="address" placeholder="לדוגמה: 123 Sukhumvit Rd, Bangkok" value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
      </label>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: "160px" }}>
          <span>אתר אינטרנט</span>
          <input name="officialWebsite" type="url" placeholder="https://..." value={website} onChange={(e) => setWebsite(e.target.value)} style={inputStyle} />
          {state?.fieldErrors?.officialWebsite?.map((message) => (
            <span key={message} style={errorStyle}>
              {message}
            </span>
          ))}
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: "160px" }}>
          <span>טלפון</span>
          <input name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
        </label>
      </div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: "160px" }}>
          <span>WhatsApp</span>
          <input name="whatsapp" type="tel" style={inputStyle} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: "160px" }}>
          <span>אימייל</span>
          <input name="email" type="email" style={inputStyle} />
          {state?.fieldErrors?.email?.map((message) => (
            <span key={message} style={errorStyle}>
              {message}
            </span>
          ))}
        </label>
      </div>

      <OpeningHoursEditor value={openingHours} onChange={setOpeningHours} />

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>הערות</span>
        <textarea name="generalNotes" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
      </label>

      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: "0.75rem 1.25rem",
          borderRadius: "var(--radius-full)",
          border: "none",
          background: isPending ? "var(--color-secondary)" : "var(--gradient-brand)",
          color: isPending ? "var(--color-text-muted)" : "#fff",
          fontWeight: 700,
          cursor: isPending ? "default" : "pointer",
          boxShadow: isPending ? "none" : "var(--glow-brand)",
          transition: "all var(--duration-base) var(--ease-out)",
        }}
      >
        {isPending ? "שומר..." : "הוסף מקום"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.625rem 0.875rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text-primary)",
};

const errorStyle: React.CSSProperties = { color: "var(--color-danger)", fontSize: "0.8125rem" };
