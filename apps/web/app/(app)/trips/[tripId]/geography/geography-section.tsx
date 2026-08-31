"use client";

import { useActionState, useState } from "react";
import type { TripCity, TripCountry } from "@travel-app/shared-types";
import type { PlaceSearchResult } from "@/lib/geocoding/google-place-search";
import { usePlaceSearch } from "@/lib/geocoding/use-place-search";
import { addTripCountryAction, addTripCityAction, deleteTripCountryAction, deleteTripCityAction, type GeographyFormState } from "./actions";
import { inputStyle } from "../bookings/form-styles";
import { Select } from "@/components/ui/Select";
import { countryFlagEmoji } from "@/lib/country-flags";

const initialState: GeographyFormState = {};

/** חיפוש-מקום (Google Places, אותו מנוע כמו /map) שממלא-מראש מדינה+עיר — לא
 * שולח את הטפסים אוטומטית, רק חוסך הקלדה-ידנית של שם-מדינה/עיר מדויק. */
function DestinationSearchBox({ onPick }: { onPick: (result: PlaceSearchResult) => void }) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { results, loading, error } = usePlaceSearch(query);

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        placeholder="🔍 חפש יעד — ממלא מדינה+עיר למטה"
        style={{ ...inputStyle, width: "100%", maxWidth: "320px" }}
      />
      {showResults && query.trim().length >= 1 ? (
        <ul
          style={{
            position: "absolute",
            insetInlineStart: 0,
            zIndex: 50,
            margin: "0.25rem 0 0",
            padding: "0.25rem",
            listStyle: "none",
            maxHeight: "12rem",
            overflowY: "auto",
            minWidth: "260px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-elevated)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {loading ? (
            <li style={{ padding: "0.375rem 0.5rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>מחפש…</li>
          ) : error ? (
            <li style={{ padding: "0.375rem 0.5rem", fontSize: "0.75rem", color: "var(--color-danger)" }}>{error}</li>
          ) : results.length === 0 ? (
            <li style={{ padding: "0.375rem 0.5rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>לא נמצאו תוצאות.</li>
          ) : (
            results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(r);
                    setQuery(r.placeName);
                    setShowResults(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "0.375rem 0.5rem",
                    border: "none",
                    background: "transparent",
                    color: "var(--color-text-primary)",
                    fontSize: "0.75rem",
                    textAlign: "start",
                    cursor: "pointer",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  {r.placeName}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

function Pill({ label, onDelete }: { label: string; onDelete: () => void }) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.125rem 0.5rem",
        borderRadius: "999px",
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
      }}
    >
      <span>{label}</span>
      <form action={onDelete}>
        <button type="submit" style={{ border: "none", background: "none", color: "var(--color-danger)", cursor: "pointer", padding: 0 }}>
          ✕
        </button>
      </form>
    </li>
  );
}

export function GeographySection({ tripId, countries, cities }: { tripId: string; countries: TripCountry[]; cities: TripCity[] }) {
  const countryAction = addTripCountryAction.bind(null, tripId);
  const [countryState, countryFormAction, isCountryPending] = useActionState(countryAction, initialState);
  const cityAction = addTripCityAction.bind(null, tripId);
  const [cityState, cityFormAction, isCityPending] = useActionState(cityAction, initialState);
  const [countryQuery, setCountryQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");

  // אחרי הוספה מוצלחת (לא שגיאה) — מנקים את השדה, כמו ש-input לא-מבוקר היה
  // מתנקה טבעית. עדכון state בזמן render, לא useEffect — אותו דפוס כמו
  // map-page-interactive.tsx.
  const [lastCountryState, setLastCountryState] = useState(countryState);
  if (countryState !== lastCountryState) {
    setLastCountryState(countryState);
    if (!countryState.formError) setCountryQuery("");
  }
  const [lastCityState, setLastCityState] = useState(cityState);
  if (cityState !== lastCityState) {
    setLastCityState(cityState);
    if (!cityState.formError) setCityQuery("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <DestinationSearchBox
        onPick={(result) => {
          setCountryQuery(result.country ?? "");
          setCityQuery(result.city ?? "");
        }}
      />

      <div>
        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>מדינות</div>
        {countries.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 0.375rem 0", display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
            {countries.map((c) => (
              <Pill
                key={c.id}
                label={`${countryFlagEmoji(c.countryName) ? `${countryFlagEmoji(c.countryName)} ` : ""}${c.countryName}`}
                onDelete={() => deleteTripCountryAction(tripId, c.id)}
              />
            ))}
          </ul>
        ) : (
          <p style={{ margin: "0 0 0.375rem 0", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>עוד לא נוספו מדינות.</p>
        )}
        <form action={countryFormAction} style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          <input
            name="countryName"
            value={countryQuery}
            onChange={(e) => setCountryQuery(e.target.value)}
            placeholder="שם מדינה"
            required
            style={{ ...inputStyle, padding: "0.25rem 0.5rem", maxWidth: "160px" }}
          />
          <button
            type="submit"
            disabled={isCountryPending}
            style={{
              padding: "0.25rem 0.625rem",
              borderRadius: "var(--radius-full)",
              border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
              background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
              color: "var(--color-primary)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.75rem",
            }}
          >
            {isCountryPending ? "מוסיף..." : "+ מדינה"}
          </button>
        </form>
        {countryState?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.75rem" }}>{countryState.formError}</span> : null}
      </div>

      <div>
        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>ערים</div>
        {cities.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 0.375rem 0", display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
            {cities.map((c) => (
              <Pill
                key={c.id}
                label={(() => {
                  const countryName = c.countryId ? (countries.find((co) => co.id === c.countryId)?.countryName ?? "") : "";
                  const flag = countryFlagEmoji(countryName);
                  return `${flag ? `${flag} ` : ""}${c.cityName}${countryName ? ` (${countryName})` : ""}`;
                })()}
                onDelete={() => deleteTripCityAction(tripId, c.id)}
              />
            ))}
          </ul>
        ) : (
          <p style={{ margin: "0 0 0.375rem 0", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>עוד לא נוספו ערים.</p>
        )}
        <form action={cityFormAction} style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          <input
            name="cityName"
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            placeholder="שם עיר"
            required
            style={{ ...inputStyle, padding: "0.25rem 0.5rem", maxWidth: "160px" }}
          />
          {countries.length > 0 ? (
            <Select
              name="countryId"
              style={{ ...inputStyle, padding: "0.25rem 0.5rem" }}
              defaultValue=""
              placeholder="מדינה (אופציונלי)"
              options={countries.map((c) => ({ value: c.id, label: c.countryName }))}
            />
          ) : null}
          <button
            type="submit"
            disabled={isCityPending}
            style={{
              padding: "0.25rem 0.625rem",
              borderRadius: "var(--radius-full)",
              border: "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
              background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
              color: "var(--color-primary)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.75rem",
            }}
          >
            {isCityPending ? "מוסיף..." : "+ עיר"}
          </button>
        </form>
        {cityState?.formError ? <span style={{ color: "var(--color-danger)", fontSize: "0.75rem" }}>{cityState.formError}</span> : null}
      </div>
    </div>
  );
}
