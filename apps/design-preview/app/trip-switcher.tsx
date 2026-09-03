"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "./ui-kit";
import { FlagIcon } from "./country-currency-data";
import { allTrips, activeTrip, setActiveTrip, type DemoTrip } from "./trips-data";

/**
 * "צ'יפ" קטן שמציג את הטיול הפעיל הנוכחי ופותח חלונית להחלפה מהירה בין כל
 * הטיולים (לא רק דרך "הטיולים שלי" עם חיפוש-בטאבים) — לפי בקשה מפורשת:
 * "צריך שיהיה קל לעבור בין הטיולים... כשבא לי לעבור מאחד לאחד לעשות דברים".
 * חשוב במיוחד עכשיו שארנק/מסלול/הזמנות/אריזה/מעקב תלויי-טיול (ר' תוכנית
 * ההיקף-לכל-טיול) — בלי מעבר מהיר, המשתמש "תקוע" עם תוכן של טיול אחד בלי
 * דרך נוחה לראות טיול אחר. משתמש ב-Sheet המשותף מ-ui-kit.tsx (כבר נייטרלי
 * חזותית, בשימוש גם במסכי legacy וגם החדשים) כדי לא לשכפל עיצוב-חלונית.
 * החלפת טיול טוענת את העמוד הנוכחי מחדש (לא רק state) כי כל מסך תלוי-טיול
 * קובע tripId פעם אחת בעליית-הרכיב — טעינה-מחדש מבטיחה שהוא ייקרא נכון
 * מהטיול החדש בלי לתפור טיפול-מיוחד בכל מסך בנפרד.
 */
export function TripSwitcherPill({
  color = "#fff",
  background = "rgba(255,255,255,0.08)",
  border = "rgba(255,255,255,0.18)",
}: {
  color?: string;
  background?: string;
  border?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState<DemoTrip[]>([]);
  const [current, setCurrent] = useState<DemoTrip | null | undefined>(undefined);

  useEffect(() => {
    setTrips(allTrips());
    setCurrent(activeTrip());
  }, []);

  function openSheet() {
    setTrips(allTrips());
    setCurrent(activeTrip());
    setOpen(true);
  }

  function handleSwitch(id: string) {
    if (current?.id === id) {
      setOpen(false);
      return;
    }
    setActiveTrip(id);
    window.location.href = window.location.pathname;
  }

  if (current === undefined) return null;

  const groups: { label: string; trips: DemoTrip[] }[] = [
    { label: "פעיל", trips: trips.filter((t) => t.status === "active") },
    { label: "עתידיים", trips: trips.filter((t) => t.status === "upcoming") },
    { label: "היסטוריה", trips: trips.filter((t) => t.status === "completed") },
  ];

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-label="החלפת טיול"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 10px",
          borderRadius: "999px",
          background,
          border: `1px solid ${border}`,
          color,
          fontSize: "12px",
          fontWeight: 700,
          cursor: "pointer",
          maxWidth: "150px",
          flexShrink: 0,
        }}
      >
        {current ? (
          <>
            <FlagIcon countryCode={current.countryCode} size={15} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{current.name}</span>
          </>
        ) : (
          <span>בחירת טיול</span>
        )}
        <span style={{ fontSize: "9px", flexShrink: 0 }}>▾</span>
      </button>

      {open ? (
        <Sheet title="החלפת טיול" onClose={() => setOpen(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {trips.length === 0 ? (
              <div style={{ fontSize: "13px", color: "#94A3B8", textAlign: "center", padding: "8px 0" }}>עדיין אין טיולים</div>
            ) : (
              groups.map((g) =>
                g.trips.length === 0 ? null : (
                  <div key={g.label}>
                    <div style={{ fontSize: "11px", fontWeight: 800, color: "#94A3B8", marginBottom: "6px" }}>{g.label}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {g.trips.map((t) => {
                        const isCurrent = t.id === current?.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSwitch(t.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "11px 12px",
                              borderRadius: "12px",
                              background: isCurrent ? "rgba(138,90,223,0.16)" : "rgba(255,255,255,0.04)",
                              border: `1px solid ${isCurrent ? "rgba(138,90,223,0.5)" : "rgba(255,255,255,0.08)"}`,
                              color: "#fff",
                              fontSize: "13.5px",
                              fontWeight: 700,
                              cursor: "pointer",
                              textAlign: "start",
                            }}
                          >
                            <FlagIcon countryCode={t.countryCode} size={20} />
                            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                            {isCurrent ? <span style={{ fontSize: "11px", color: "#43d6aa", flexShrink: 0 }}>✓ נוכחי</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )
              )
            )}
            <button
              type="button"
              onClick={() => router.push("/trips/new")}
              style={{ padding: "12px", borderRadius: "12px", background: "rgba(138,90,223,0.16)", border: "1px solid rgba(138,90,223,0.4)", color: "#c9b3ff", fontSize: "13.5px", fontWeight: 700, cursor: "pointer" }}
            >
              + טיול חדש
            </button>
          </div>
        </Sheet>
      ) : null}
    </>
  );
}
