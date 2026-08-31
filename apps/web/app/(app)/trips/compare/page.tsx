import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getFinanceRepository, getTripRepository } from "@travel-app/data-layer";
import { getTripDayDates } from "@/lib/trip-days";
import { BarChart } from "@/components/bar-chart";

export const dynamic = "force-dynamic";

function formatCurrencyMap(map: Map<string, number>): string {
  if (map.size === 0) return "—";
  return Array.from(map.entries())
    .map(([currency, amount]) => `${Math.round(amount * 100) / 100} ${currency}`)
    .join(" · ");
}

export default async function CompareTripsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tripRepository = await getTripRepository();
  const financeRepository = await getFinanceRepository();
  const trips = (await tripRepository.list({ userId: user.id })).filter((t) => t.deletedAt === null);

  const rows = await Promise.all(
    trips.map(async (trip) => {
      const expenses = await financeRepository.listExpenses({ tripId: trip.id });
      const dayCount = getTripDayDates(trip.startDate, trip.endDate).length;
      const totalByCurrency = new Map<string, number>();
      for (const e of expenses) totalByCurrency.set(e.currencyCode, (totalByCurrency.get(e.currencyCode) ?? 0) + e.amount);
      const avgPerDayByCurrency = new Map<string, number>();
      if (dayCount > 0) {
        for (const [currency, total] of totalByCurrency) avgPerDayByCurrency.set(currency, total / dayCount);
      }
      return { trip, dayCount, expenseCount: expenses.length, totalByCurrency, avgPerDayByCurrency };
    }),
  );

  const currencies = Array.from(new Set(rows.flatMap((r) => Array.from(r.totalByCurrency.keys())))).sort();
  const costChartByCurrency = new Map<string, Array<{ label: string; value: number }>>();
  for (const currency of currencies) {
    costChartByCurrency.set(
      currency,
      rows.map((r) => ({ label: r.trip.name, value: r.totalByCurrency.get(currency) ?? 0 })),
    );
  }

  return (
    <div>
      <div>
        <h1 style={{ marginTop: 0, marginBottom: "0.25rem" }}>השוואה בין טיולים</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          עלות כוללת וממוצע ליום, לפי מטבע — בלי המרה בין מטבעות (כמו בדוח הטיול הבודד).
        </p>
      </div>

      {costChartByCurrency.size > 0 ? (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
          }}
        >
          <h2 style={{ fontSize: "1.125rem", marginTop: 0 }}>עלות כוללת להשוואה</h2>
          {Array.from(costChartByCurrency.entries()).map(([currency, data]) => (
            <div key={currency} style={{ marginBottom: "1rem" }}>
              {costChartByCurrency.size > 1 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>{currency}</p>
              ) : null}
              <BarChart data={data} unit={currency} />
            </div>
          ))}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>אין עדיין טיולים להשוואה.</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: "1rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>טיול</th>
                <th style={headerCellStyle}>תאריכים</th>
                <th style={headerCellStyle}>הוצאות</th>
                <th style={headerCellStyle}>עלות כוללת</th>
                <th style={headerCellStyle}>ממוצע ליום</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ trip, dayCount, expenseCount, totalByCurrency, avgPerDayByCurrency }) => (
                <tr key={trip.id}>
                  <td style={cellStyle}>
                    <Link href={`/trips/${trip.id}/report`}>{trip.name}</Link>
                  </td>
                  <td style={{ ...cellStyle, color: "var(--color-text-muted)" }}>
                    {trip.startDate} — {trip.endDate} ({dayCount} ימים)
                  </td>
                  <td style={cellStyle}>{expenseCount}</td>
                  <td style={{ ...cellStyle, fontWeight: 600 }}>{formatCurrencyMap(totalByCurrency)}</td>
                  <td style={cellStyle}>{formatCurrencyMap(avgPerDayByCurrency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const headerCellStyle: React.CSSProperties = {
  textAlign: "start",
  padding: "0.5rem",
  borderBottom: "1px solid var(--color-border)",
  color: "var(--color-text-muted)",
  fontSize: "0.8125rem",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const cellStyle: React.CSSProperties = {
  padding: "0.5rem",
  borderBottom: "1px solid var(--color-border)",
  whiteSpace: "nowrap",
};
