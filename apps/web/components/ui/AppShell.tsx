import type { ReactNode } from "react";
import { Sidebar, type SidebarGroup } from "./Sidebar";
import { BottomNavigation } from "./BottomNavigation";
import { QuickAddFab } from "@/components/quick-add-fab";
import { ChatAssistantToggle } from "@/components/chat-assistant/ChatAssistantToggle";
import { ChatAssistantProvider } from "@/components/chat-assistant/chat-assistant-context";

export function AppShell({
  sidebarGroups,
  activeTripId,
  activeTripName,
  isDemoMode,
  userLabel,
  children,
}: {
  sidebarGroups: SidebarGroup[];
  activeTripId: string | null;
  activeTripName?: string | null;
  isDemoMode: boolean;
  userLabel: string;
  children: ReactNode;
}) {
  return (
    <ChatAssistantProvider>
      <div style={{ display: "flex", minHeight: "100dvh", position: "relative" }}>
        <a href="#main-content" className="skip-link">
          דלג לתוכן הראשי
        </a>

        {/* Ambient background glow — without something colorful behind them, the glass cards'
            backdrop-filter has nothing to blur and just reads as a flat panel. See DECISIONS.md
            ("למה זה עדיין נראה כמו Admin Panel"). */}
        <div className="app-ambient-glow" aria-hidden />

        <Sidebar groups={sidebarGroups} userLabel={userLabel} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative", zIndex: 1 }}>
          {isDemoMode ? (
            <div
              role="status"
              style={{
                background: "linear-gradient(90deg, #3b2a00, #4a3400)",
                color: "#ffcc66",
                padding: "0.5rem 1rem",
                fontSize: "0.8125rem",
                textAlign: "center",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              מצב פיתוח — נתוני דמה בלבד, לא מחובר ל-Supabase אמיתי
            </div>
          ) : null}

          <main
            id="main-content"
            className="app-main-content"
            style={{ flex: 1, padding: "0 var(--space-5) var(--space-8)", maxWidth: "1600px", width: "100%", marginInline: "auto" }}
          >
            {children}
          </main>
        </div>

        <QuickAddFab activeTripId={activeTripId} activeTripName={activeTripName} />
        <ChatAssistantToggle activeTripId={activeTripId} />
        <BottomNavigation />
      </div>
    </ChatAssistantProvider>
  );
}
