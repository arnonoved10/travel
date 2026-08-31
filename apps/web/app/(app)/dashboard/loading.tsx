import { SkeletonCard } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <SkeletonCard height="60px" />
      <div className="dashboard-hero-row" style={{ display: "grid", gap: "var(--space-5)" }}>
        <SkeletonCard height="360px" />
        <SkeletonCard height="360px" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-4)" }}>
        <SkeletonCard height="6rem" />
        <SkeletonCard height="6rem" />
        <SkeletonCard height="6rem" />
        <SkeletonCard height="6rem" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-5)" }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
