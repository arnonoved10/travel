import Link from "next/link";
import type { Trip, Wallet } from "@travel-app/shared-types";
import { DashboardCard } from "./dashboard-card";

export function WalletSummaryCard({ trip, wallets }: { trip: Trip; wallets: Wallet[] }) {
  return (
    <DashboardCard
      title="ארנק"
      // #wallet, לא #finances — ר' ההערה המקבילה ב-app/(app)/layout.tsx:
      // "ארנק" הוא <details> סגור-בברירת-מחדל, ורק hash שתואם-בדיוק את
      // ה-id שלו פותח אותו (OpenDetailsFromHash).
      action={
        <Link href={`/trips/${trip.id}#wallet`} style={{ font: "var(--text-caption)", color: "var(--color-primary)", fontWeight: 700 }}>
          פרטים ←
        </Link>
      }
    >
      {wallets.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", font: "var(--text-caption)", margin: 0 }}>אין עדיין ארנק לטיול זה.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {wallets.map((w) => (
            <div key={w.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ color: "var(--color-text-muted)", font: "var(--text-caption)" }}>{w.currencyCode}</span>
              <span style={{ font: "var(--text-metric)", fontSize: "1.25rem" }}>{w.currentBalance.toLocaleString("he-IL")}</span>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
