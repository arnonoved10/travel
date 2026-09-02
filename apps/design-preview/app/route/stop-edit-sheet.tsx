"use client";

import { useEffect, useRef, useState } from "react";
import { CountryPickerButton } from "../pickers";
import { DateRangePicker } from "../date-range-picker";
import type { TripStop, StopStatus } from "../trip-content";
import { geocodeQueryAction, nearbyPlacesAction, type NearbyPlace } from "../actions";

/**
 * עריכת/הוספת תחנה במסלול הטיול — קודם לא הייתה שום דרך אמיתית לערוך,
 * להוסיף או למחוק תחנה (כפתור "הוסף תחנה" לא עשה כלום, ואין היה עריכה
 * בכלל). רכיב עצמאי (לא נוגע ב-legacy-shared.tsx/design-system.tsx).
 *
 * עודכן: קואורדינטות אמיתיות מתעדכנות באופן ריאקטיבי (לא רק בשמירה) —
 * כמה שניות אחרי שהוקלדו עיר+מדינה, מאותר מיקום אמיתי ברקע, ומיד אחר-כך
 * נשלפים מקומות אמיתיים סביבו (בתי קפה/מסעדות/ברים/תצפיות/אטרקציות) דרך
 * Overpass — לפי בקשה מפורשת: "ברגע שאני כותב יעד תוכל להמליץ לי על
 * מקומות". גם prefill (למשל מלחיצה על המפה) מדלג על האיתור הראשוני.
 */

const STATUSES: StopStatus[] = ["מאושר", "ממתין לאישור", "בוצע"];

const COLORS = {
  sheetBg: "#0e1930",
  border: "rgba(120,150,200,0.2)",
  text: "#f4f6fb",
  textMuted: "#9aa3bd",
  primary: "#8a5adf",
  danger: "#ef6f61",
  success: "#43d6aa",
};

const CATEGORY_LABEL: Record<NearbyPlace["category"], string> = {
  cafe: "בתי קפה",
  restaurant: "מסעדות",
  bar: "ברים",
  viewpoint: "תצפיות",
  attraction: "אטרקציות",
};
const CATEGORY_FILTERS: (NearbyPlace["category"] | "all")[] = ["all", "cafe", "restaurant", "bar", "viewpoint", "attraction"];

export function StopEditSheet({
  initial,
  prefill,
  onClose,
  onSave,
  onDelete,
}: {
  initial: TripStop | null;
  /** מילוי-מראש של עיר/מדינה/קואורדינטות כשמגיעים מלחיצה על המפה — לא
   * "עריכה" (initial עדיין null, הכותרת נשארת "הוספת תחנה"). */
  prefill?: { city: string; countryCode: string; lat?: number; lon?: number };
  onClose: () => void;
  onSave: (stop: Omit<TripStop, "id">) => void;
  onDelete?: () => void;
}) {
  const [city, setCity] = useState(initial?.city ?? prefill?.city ?? "");
  const [countryCode, setCountryCode] = useState<string | null>(initial?.countryCode ?? prefill?.countryCode ?? null);
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [hotel, setHotel] = useState(initial?.hotel ?? "");
  const [transportToNext, setTransportToNext] = useState(initial?.transportToNext ?? "");
  const [status, setStatus] = useState<StopStatus>(initial?.status ?? "מאושר");
  const [attractionsText, setAttractionsText] = useState((initial?.attractions ?? []).join("\n"));
  const [restaurantsText, setRestaurantsText] = useState((initial?.restaurants ?? []).join("\n"));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const [lat, setLat] = useState<number | undefined>(initial?.lat ?? prefill?.lat);
  const [lon, setLon] = useState<number | undefined>(initial?.lon ?? prefill?.lon);
  const [locating, setLocating] = useState(false);
  const resolvedForRef = useRef<string | null>(lat != null && lon != null ? `${city.trim()}|${countryCode}` : null);

  // איתור-מיקום ריאקטיבי: כמה שניות אחרי שהמשתמש הפסיק להקליד עיר (או
  // בחר מדינה), ואם עדיין לא אותרו קואורדינטות בדיוק לצירוף הזה.
  useEffect(() => {
    const key = `${city.trim()}|${countryCode}`;
    if (!city.trim() || !countryCode || resolvedForRef.current === key) return;
    const timer = setTimeout(async () => {
      setLocating(true);
      const geo = await geocodeQueryAction(city.trim(), countryCode);
      resolvedForRef.current = key;
      setLat(geo?.lat);
      setLon(geo?.lon);
      setLocating(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [city, countryCode]);

  // מקומות אמיתיים מומלצים סביב הקואורדינטות שאותרו — נטענים פעם אחת לכל
  // מיקום (לא בכל הקלדה), נכשלים בשקט לרשימה ריקה אם Overpass לא זמין.
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<(typeof CATEGORY_FILTERS)[number]>("all");
  const placesForRef = useRef<string | null>(null);

  useEffect(() => {
    if (lat == null || lon == null) return;
    const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    if (placesForRef.current === key) return;
    placesForRef.current = key;
    setPlacesLoading(true);
    nearbyPlacesAction(lat, lon)
      .then(setPlaces)
      .finally(() => setPlacesLoading(false));
  }, [lat, lon]);

  const selectedPlaceNames = new Set([...attractionsText.split("\n"), ...restaurantsText.split("\n")].map((s) => s.trim()).filter(Boolean));

  function togglePlace(place: NearbyPlace) {
    const isRestaurant = place.category === "restaurant";
    const [text, setText] = isRestaurant ? [restaurantsText, setRestaurantsText] : [attractionsText, setAttractionsText];
    const lines = text.split("\n").map((s) => s.trim()).filter(Boolean);
    if (lines.includes(place.name)) {
      setText(lines.filter((l) => l !== place.name).join("\n"));
    } else {
      setText([...lines, place.name].join("\n"));
    }
  }

  const canSave = city.trim().length > 0 && !!countryCode && !!startDate && !!endDate;

  async function handleSave() {
    if (!canSave || !countryCode || saving) return;
    setSaving(true);
    // רשת-ביטחון: אם המשתמש שמר לפני שאיתור-הרקע הספיק לרוץ (למשל הקליד
    // ולחץ שמירה תוך פחות משנייה), מנסים איתור סופי אחד כאן.
    let finalLat = lat;
    let finalLon = lon;
    if (finalLat == null || finalLon == null) {
      const geo = await geocodeQueryAction(city.trim(), countryCode);
      finalLat = geo?.lat;
      finalLon = geo?.lon;
    }
    onSave({
      city: city.trim(),
      countryCode,
      startDate,
      endDate,
      transportToNext: transportToNext.trim(),
      status,
      hotel: hotel.trim() || undefined,
      attractions: attractionsText.split("\n").map((s) => s.trim()).filter(Boolean),
      restaurants: restaurantsText.split("\n").map((s) => s.trim()).filter(Boolean),
      lat: finalLat,
      lon: finalLon,
    });
  }

  const dateLabel = startDate && endDate ? `${fmt(startDate)} - ${fmt(endDate)}` : "בחירת תאריכים";
  const filteredPlaces = places.filter((p) => categoryFilter === "all" || p.category === categoryFilter);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "480px",
          background: COLORS.sheetBg,
          borderTop: `1px solid ${COLORS.border}`,
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          padding: "16px",
          maxHeight: "88vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "15px", fontWeight: 800, color: COLORS.text }}>{initial ? "עריכת תחנה" : "הוספת תחנה"}</span>
          <button type="button" onClick={onClose} aria-label="סגירה" style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "none", color: COLORS.text, cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <FieldLabel label="עיר / יעד">
          <input
            data-testid="stop-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={fieldStyle}
          />
        </FieldLabel>

        <FieldLabel label="מדינה">
          <CountryPickerButton selectedCode={countryCode} onSelect={(c) => setCountryCode(c.code)} testId="stop-country" />
        </FieldLabel>

        <FieldLabel label="תאריכים">
          <button type="button" data-testid="stop-dates-button" onClick={() => setShowDatePicker(true)} style={{ ...fieldStyle, textAlign: "start", cursor: "pointer" }}>
            {dateLabel}
          </button>
        </FieldLabel>

        <FieldLabel label="סטטוס">
          <div style={{ display: "flex", gap: "6px" }}>
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: status === s ? COLORS.primary : "rgba(255,255,255,0.06)",
                  border: `1px solid ${status === s ? COLORS.primary : COLORS.border}`,
                  color: "#fff",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </FieldLabel>

        <FieldLabel label="מלון (לא חובה)">
          <input data-testid="stop-hotel" value={hotel} onChange={(e) => setHotel(e.target.value)} style={fieldStyle} />
        </FieldLabel>

        <FieldLabel label="אטרקציות (שורה לכל אחת, לא חובה)">
          <textarea value={attractionsText} onChange={(e) => setAttractionsText(e.target.value)} rows={2} style={{ ...fieldStyle, resize: "vertical" }} />
        </FieldLabel>

        <FieldLabel label="מסעדות (שורה לכל אחת, לא חובה)">
          <textarea value={restaurantsText} onChange={(e) => setRestaurantsText(e.target.value)} rows={2} style={{ ...fieldStyle, resize: "vertical" }} />
        </FieldLabel>

        {city.trim() && countryCode ? (
          <div>
            <div style={{ fontSize: "11.5px", fontWeight: 600, color: COLORS.textMuted, marginBottom: "6px" }}>
              מקומות מומלצים {city.trim() ? `ב${city.trim()}` : ""}
            </div>
            {locating || placesLoading ? (
              <div style={{ fontSize: "12px", color: COLORS.textMuted, padding: "6px 2px" }}>
                {locating ? "מאתר את המיקום..." : "מחפש מקומות מומלצים..."}
              </div>
            ) : lat == null || lon == null ? (
              <div style={{ fontSize: "12px", color: COLORS.textMuted, padding: "6px 2px" }}>לא נמצא מיקום מדויק לעיר הזו</div>
            ) : places.length === 0 ? (
              <div style={{ fontSize: "12px", color: COLORS.textMuted, padding: "6px 2px" }}>לא נמצאו מקומות מומלצים סביב המיקום הזה</div>
            ) : (
              <>
                <div style={{ display: "flex", gap: "6px", overflowX: "auto", marginBottom: "8px" }}>
                  {CATEGORY_FILTERS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategoryFilter(c)}
                      style={{
                        flexShrink: 0,
                        padding: "6px 12px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        background: categoryFilter === c ? COLORS.primary : "rgba(255,255,255,0.06)",
                        border: `1px solid ${categoryFilter === c ? COLORS.primary : COLORS.border}`,
                        color: "#fff",
                      }}
                    >
                      {c === "all" ? "הכול" : CATEGORY_LABEL[c]}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "180px", overflowY: "auto" }}>
                  {filteredPlaces.length === 0 ? (
                    <div style={{ fontSize: "12px", color: COLORS.textMuted, padding: "4px 2px" }}>אין תוצאות בקטגוריה הזו</div>
                  ) : (
                    filteredPlaces.map((p) => {
                      const selected = selectedPlaceNames.has(p.name);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePlace(p)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                            padding: "9px 12px",
                            borderRadius: "10px",
                            background: selected ? "rgba(67,214,170,0.14)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${selected ? COLORS.success : COLORS.border}`,
                            cursor: "pointer",
                            textAlign: "start",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                            <div style={{ fontSize: "10.5px", color: COLORS.textMuted }}>{CATEGORY_LABEL[p.category]}</div>
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: selected ? COLORS.success : COLORS.textMuted, flexShrink: 0 }}>{selected ? "✓ נוסף" : "+ הוספה"}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        ) : null}

        <FieldLabel label="מעבר לתחנה הבאה (לא חובה)">
          <input data-testid="stop-transport" value={transportToNext} onChange={(e) => setTransportToNext(e.target.value)} style={fieldStyle} placeholder="למשל: רכבת · כשעה" />
        </FieldLabel>

        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          {initial && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              style={{ padding: "13px 16px", borderRadius: "12px", background: "rgba(239,111,97,0.14)", border: `1px solid ${COLORS.danger}45`, color: COLORS.danger, fontSize: "13.5px", fontWeight: 800, cursor: "pointer" }}
            >
              מחיקת תחנה
            </button>
          ) : null}
          <button
            type="button"
            data-testid="stop-save"
            disabled={!canSave || saving}
            onClick={handleSave}
            style={{
              flex: 1,
              padding: "13px",
              borderRadius: "12px",
              background: canSave && !saving ? COLORS.primary : "rgba(255,255,255,0.08)",
              border: "none",
              color: canSave && !saving ? "#fff" : COLORS.textMuted,
              fontSize: "14.5px",
              fontWeight: 800,
              cursor: canSave && !saving ? "pointer" : "default",
            }}
          >
            {saving ? "שומר..." : "שמירה"}
          </button>
        </div>
      </div>

      {showDatePicker ? (
        <DateRangePicker
          title="תאריכי התחנה"
          initialStartDate={startDate || undefined}
          initialEndDate={endDate || undefined}
          onClose={() => setShowDatePicker(false)}
          onConfirm={(s, e) => {
            setStartDate(s);
            setEndDate(e);
            setShowDatePicker(false);
          }}
        />
      ) : null}
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "11.5px", fontWeight: 600, color: COLORS.textMuted, marginBottom: "4px" }}>{label}</div>
      {children}
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  background: "#0a1526",
  border: `1px solid ${COLORS.border}`,
  color: COLORS.text,
  fontSize: "13.5px",
  fontFamily: "inherit",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
}
