"use client";

import { useEffect, useState } from "react";
import { formatDateTimeInZone } from "@/lib/dates";
import { countryFlagEmoji } from "@/lib/country-flags";

const HOME_TIMEZONE = "Asia/Jerusalem";
const HOME_FLAG = "🇮🇱";

/** שעון-עולם: יעד מול הבית (ישראל). timezone/name/country מגיעים מהשרת
 * (אותו currentWeather.timezone שכבר נטען ל-/today ול-/dashboard — אין קריאת-
 * רשת נוספת). טיקה קלה בצד-לקוח כדי שלא יתיישן אם המסך נשאר פתוח. משותף בין
 * /today ו-/dashboard (שני מסכי-כניסה אפשריים), לכן חי ב-components/ ולא
 * בתוך תיקיית-route ספציפית. */
export function WorldClockCard({
  destination,
}: {
  destination: { name: string | null; country: string | null; timezone: string | null } | null;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const nowIso = now.toISOString();
  const destinationFlag = countryFlagEmoji(destination?.country);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "0.875rem 1rem",
        borderRadius: "var(--radius-lg)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      {destination?.timezone ? (
        <>
          <ClockRow flag={destinationFlag ?? "🌍"} label={destination.name ?? "היעד"} time={formatDateTimeInZone(nowIso, destination.timezone)} />
          <div style={{ height: 1, background: "var(--color-border)", margin: "0.625rem 0" }} />
        </>
      ) : null}
      <ClockRow flag={HOME_FLAG} label="אצלנו (ישראל)" time={formatDateTimeInZone(nowIso, HOME_TIMEZONE)} />
    </div>
  );
}

function ClockRow({ flag, label, time }: { flag: string; label: string; time: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <span style={{ fontSize: "1.75rem", lineHeight: 1, flexShrink: 0 }} aria-hidden>
        {flag}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
        <div style={{ fontSize: "1.0625rem", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{time}</div>
      </div>
    </div>
  );
}
