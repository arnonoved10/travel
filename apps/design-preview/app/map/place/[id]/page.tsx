"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ScreenShell, ScreenHeader, PrimaryButton, HeartIcon, ShareIcon, NavigateIcon, ClockIcon, COLOR, SPACE } from "../../../design-system";
import { FlagIcon } from "../../../country-currency-data";
import { loadStops, type TripStop } from "../../../trip-content";

const DESCRIPTIONS: Record<string, string> = {
  קיוטו: "קיוטו היא בירת תרבות-יפן: מקדשים עתיקים, בתי-תה מסורתיים וגני-זן מרהיבים, מכל תקופת-ההיסטוריה היפנית.",
  טוקיו: "טוקיו היא עיר-הבירה התוססת של יפן — שילוב של גורדי-שחקים מודרניים לצד מקדשים ושווקים מסורתיים.",
  אוסקה: "אוסקה מוכרת כבירת-האוכל של יפן, עם רחוב-דוטונבורי התוסס ומטבח-רחוב עשיר.",
  הירושימה: "הירושימה משלבת היסטוריה מורכבת עם פארק-שלום מרשים ונוף-מפרץ יפהפה.",
};

export default function PlaceDetailsScreen() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [stop, setStop] = useState<TripStop | null | undefined>(undefined);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStop(loadStops().find((s) => s.id === params.id) ?? null);
  }, [params.id]);

  if (stop === undefined) return null;
  if (stop === null) {
    return (
      <ScreenShell>
        <ScreenHeader title="פרטי מקום" />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={() => setSaved((s) => !s)} aria-label="שמירה" style={{ width: "40px", height: "40px", borderRadius: "50%", background: COLOR.card, border: `1px solid ${COLOR.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <HeartIcon filled={saved} color={saved ? COLOR.danger : COLOR.textPrimary} />
        </button>
      </div>

      <div style={{ height: "160px", borderRadius: "16px", background: `linear-gradient(160deg, ${COLOR.primary}55, ${COLOR.cardElevated})`, border: `1px solid ${COLOR.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FlagIcon countryCode={stop.countryCode} size={48} />
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
          <FlagIcon countryCode={stop.countryCode} size={18} />
          <span style={{ fontSize: "17px", fontWeight: 700, color: COLOR.textPrimary }}>{stop.city}</span>
        </div>
        <div style={{ fontSize: "12px", color: COLOR.textSecondary, marginTop: "2px" }}>מקדשים ותרבות · 4.8 ★★★★★</div>
      </div>

      <div style={{ display: "flex", gap: SPACE.sm }}>
        <IconAction icon={<ShareIcon size={17} />} label="שיתוף" />
        <IconAction icon={<HeartIcon size={17} />} label="שמירה" />
        <IconAction icon={<NavigateIcon size={17} />} label="נווט" active />
      </div>

      <div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>אודות המקום</div>
        <div style={{ fontSize: "12.5px", color: COLOR.textSecondary, lineHeight: 1.6 }}>{DESCRIPTIONS[stop.city] ?? "מידע נוסף על היעד יתווסף בקרוב."}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm, fontSize: "12px", color: COLOR.textSecondary }}>
        <ClockIcon size={16} />
        שעות פתיחה: 08:00 - 18:00
      </div>

      <PrimaryButton onClick={() => router.push("/map")}>נווט למקום</PrimaryButton>
    </ScreenShell>
  );
}

function IconAction({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "10px 4px", borderRadius: "14px", background: active ? `${COLOR.primary}22` : COLOR.card, border: `1px solid ${active ? COLOR.primary : COLOR.border}` }}>
      {icon}
      <span style={{ fontSize: "10px", fontWeight: 700, color: active ? COLOR.primaryLight : COLOR.textSecondary }}>{label}</span>
    </div>
  );
}
