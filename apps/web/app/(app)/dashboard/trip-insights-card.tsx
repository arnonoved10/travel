import { DashboardCard } from "./dashboard-card";

export function TripInsightsCard({
  tripsCount,
  placesVisitedCount,
  daysTraveledCount,
  totalSpentByCurrency,
}: {
  tripsCount: number;
  placesVisitedCount: number;
  daysTraveledCount: number;
  totalSpentByCurrency: Map<string, number>;
}) {
  const spentEntries = [...totalSpentByCurrency.entries()].filter(([, amount]) => amount > 0);

  return (
    <DashboardCard title="תובנות טיול (כל הטיולים שלך)" href="/stats">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
          gap: "0.75rem",
        }}
      >
        <InsightStat value={tripsCount} label="טיולים" />
        <InsightStat value={placesVisitedCount} label="מקומות שביקרת בהם" />
        <InsightStat value={daysTraveledCount} label="ימי טיול" />
      </div>
      {/* אין "סה״כ הוצאה" יחיד — זה היה דורש המרת מטבע מומצאת (אין שער חליפין אמיתי
          מחובר). מוצג לפי מטבע בנפרד, כמו בדוח הטיול ובהשוואת הטיולים. */}
      {spentEntries.length > 0 ? (
        <div style={{ marginTop: "var(--space-3)", font: "var(--text-caption)", color: "var(--color-text-muted)" }}>
          סה״כ הוצאות: {spentEntries.map(([currency, amount]) => `${amount.toLocaleString("he-IL")} ${currency}`).join(" · ")}
        </div>
      ) : null}
    </DashboardCard>
  );
}

function InsightStat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          font: "var(--text-metric)",
          fontSize: "1.75rem",
          background: "var(--gradient-brand)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {value}
      </div>
      <div style={{ font: "var(--text-caption)", color: "var(--color-text-muted)" }}>{label}</div>
    </div>
  );
}
