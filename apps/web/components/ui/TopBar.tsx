import type { ReactNode } from "react";
import { SearchBar } from "./SearchBar";
import { NotificationButton } from "./NotificationButton";
import { UserMenuButton } from "./UserMenuButton";

/** Persistent shell element (rendered by AppShell, present on every page) — search,
 * notifications, theme, and profile are always available; `titleSlot` lets each page
 * inject its own greeting/heading without every page re-declaring the whole bar. */
export function TopBar({
  titleSlot,
  searchAction,
  searchPlaceholder,
  userLabel,
  displayName,
}: {
  titleSlot?: ReactNode;
  searchAction: string;
  searchPlaceholder: string;
  userLabel: string;
  /** אופציונלי — כשקיים, תפריט-המשתמש מציג אותו כשם הראשי (עם האימייל מתחתיו),
   * לא רק את האימייל. נדרש בבקשת "תמונת פרופיל ותפריט משתמש" למסך הראשי. */
  displayName?: string | null;
}) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-4)",
        flexWrap: "wrap",
        padding: "var(--space-4) 0",
      }}
    >
      <div style={{ minWidth: 0 }}>{titleSlot}</div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <SearchBar action={searchAction} placeholder={searchPlaceholder} />
        <NotificationButton />
        <UserMenuButton userLabel={userLabel} displayName={displayName} />
      </div>
    </header>
  );
}
