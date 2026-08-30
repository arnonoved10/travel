"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScreenShell, PageTitle, Card, SearchIcon, ClockIcon, SuitcaseIcon, PinIcon, DocumentIcon, COLOR, SPACE } from "../design-system";

const CATEGORIES = [
  { key: "all", label: "הכל", icon: SearchIcon },
  { key: "trips", label: "טיולים", icon: SuitcaseIcon },
  { key: "places", label: "מקומות", icon: PinIcon },
  { key: "bookings", label: "הזמנות", icon: DocumentIcon },
  { key: "expenses", label: "הוצאות", icon: DocumentIcon },
  { key: "documents", label: "מסמכים", icon: DocumentIcon },
] as const;

const RECENT = ["מלון סופוסו בברצלונה", "טיסות למילאנו", "מסעדות ליד קולוסאום"];

function SearchContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["key"]>("all");

  return (
    <ScreenShell>
      <PageTitle title="חיפוש" />
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm, background: COLOR.card, border: `1px solid ${COLOR.border}`, borderRadius: "12px", padding: "10px 14px" }}>
        <SearchIcon />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="חפש בכל התוכן שלך..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: COLOR.textPrimary, fontSize: "13px" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: SPACE.sm }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCategory(c.key)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "12px 4px", borderRadius: "14px", background: category === c.key ? `${COLOR.primary}22` : COLOR.card, border: `1px solid ${category === c.key ? COLOR.primary : COLOR.border}`, cursor: "pointer" }}
          >
            <c.icon color={category === c.key ? COLOR.primaryLight : COLOR.textSecondary} />
            <span style={{ fontSize: "11px", fontWeight: 600, color: category === c.key ? COLOR.primaryLight : COLOR.textSecondary }}>{c.label}</span>
          </button>
        ))}
      </div>

      <div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.textPrimary, marginBottom: SPACE.sm }}>חיפושים אחרונים</div>
        <div style={{ display: "flex", flexDirection: "column", gap: SPACE.xs }}>
          {RECENT.map((r) => (
            <Card key={r} onClick={() => setQuery(r)} style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
              <ClockIcon size={16} />
              <span style={{ fontSize: "12.5px", color: COLOR.textPrimary }}>{r}</span>
            </Card>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}

export default function SearchScreen() {
  return (
    <Suspense fallback={null}>
      <SearchContent />
    </Suspense>
  );
}
