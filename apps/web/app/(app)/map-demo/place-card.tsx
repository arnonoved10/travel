import type { Place } from "@travel-app/shared-types";
import { PLACE_CATEGORY_LABELS, PLACE_CATEGORY_ICONS } from "@/lib/place-labels";
import { NavigateButtons } from "@/components/navigate-buttons";

export function PlaceCard({ place, onClose }: { place: Place; onClose: () => void }) {
  const Icon = PLACE_CATEGORY_ICONS[place.category];

  return (
    <div
      style={{
        position: "absolute",
        bottom: "1rem",
        insetInlineStart: "1rem",
        insetInlineEnd: "1rem",
        maxWidth: "360px",
        marginInlineStart: "auto",
        marginInlineEnd: "auto",
        background: "var(--color-surface-solid)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "1rem",
        boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
        zIndex: 5,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
          <Icon size={18} strokeWidth={1.75} color="var(--color-primary)" aria-hidden />
          <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.name}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="סגור"
          style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "1rem", flexShrink: 0 }}
        >
          ✕
        </button>
      </div>
      <div style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
        {PLACE_CATEGORY_LABELS[place.category]}
        {place.address ? ` · ${place.address}` : ""}
      </div>
      <div style={{ marginTop: "0.75rem" }}>
        <NavigateButtons lat={place.lat} lng={place.lng} address={place.address} />
      </div>
    </div>
  );
}
