"use client";

import { useRouter } from "next/navigation";
import { COLOR, SPACE, RADIUS, CloseIcon, HomeIcon, SuitcaseIcon, ChevronIcon, DocumentIcon, ProfileIcon, SearchIcon } from "./design-system";

const LINKS = [
  { label: "דף הבית", href: "/", icon: HomeIcon },
  { label: "הטיולים שלי", href: "/trips", icon: SuitcaseIcon },
  { label: "הארנק שלי", href: "/wallet", icon: SuitcaseIcon },
  { label: "מסמכים וביטוח", href: "/documents", icon: DocumentIcon },
  { label: "חיפוש", href: "/search", icon: SearchIcon },
  { label: "פרופיל והגדרות", href: "/profile", icon: ProfileIcon },
  { label: "עזרה ואודות", href: "/help", icon: DocumentIcon },
];

export function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(2,13,31,0.7)" }} />
      <div
        style={{
          position: "relative",
          width: "78%",
          maxWidth: "300px",
          height: "100%",
          background: COLOR.card,
          borderInlineStart: `1px solid ${COLOR.border}`,
          padding: SPACE.lg,
          display: "flex",
          flexDirection: "column",
          gap: SPACE.md,
          marginInlineStart: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "16px", fontWeight: 700, color: COLOR.textPrimary }}>TRIP MASTER</span>
          <button type="button" onClick={onClose} aria-label="סגירה" style={{ width: "36px", height: "36px", borderRadius: "50%", background: COLOR.cardElevated, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <CloseIcon size={15} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: SPACE.xs, marginTop: SPACE.sm }}>
          {LINKS.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => {
                onClose();
                router.push(link.href);
              }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 10px", borderRadius: `${RADIUS.card}px`, background: "transparent", border: "none", cursor: "pointer", minHeight: "44px" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
                <link.icon color={COLOR.textPrimary} />
                <span style={{ fontSize: "13.5px", fontWeight: 600, color: COLOR.textPrimary }}>{link.label}</span>
              </span>
              <ChevronIcon />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
