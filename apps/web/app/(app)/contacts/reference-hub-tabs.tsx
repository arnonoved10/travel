"use client";

import { useState } from "react";
import Link from "next/link";
import type { Contact, PaymentCard, LoyaltyProgram, IntegrationAccount } from "@travel-app/shared-types";
import { CONTACT_CATEGORY_LABELS } from "@/lib/contact-labels";
import { LOYALTY_PROGRAM_TYPE_LABELS } from "@/lib/loyalty-program-labels";
import { INTEGRATION_SERVICE_LABELS } from "@/lib/integration-account-labels";
import { DeleteContactButton } from "./delete-contact-button";
import { DeleteLoyaltyProgramButton } from "../loyalty-programs/delete-loyalty-program-button";
import { DeleteIntegrationAccountButton } from "../integration-accounts/delete-integration-account-button";

type TabKey = "contacts" | "payment-cards" | "loyalty-programs" | "integration-accounts";

const TABS: { key: TabKey; label: string }[] = [
  { key: "contacts", label: "אנשי קשר" },
  { key: "payment-cards", label: "כרטיסי תשלום" },
  { key: "loyalty-programs", label: "נקודות/מיילים" },
  { key: "integration-accounts", label: "חשבונות חיצוניים" },
];

function isTabKey(value: string | undefined): value is TabKey {
  return TABS.some((t) => t.key === value);
}

export function ReferenceHubTabs({
  initialTab,
  contacts,
  tripNameById,
  paymentCards,
  loyaltyPrograms,
  integrationAccounts,
}: {
  initialTab: string | undefined;
  contacts: Contact[];
  tripNameById: Record<string, string>;
  paymentCards: PaymentCard[];
  loyaltyPrograms: LoyaltyProgram[];
  integrationAccounts: IntegrationAccount[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>(isTabKey(initialTab) ? initialTab : "contacts");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 style={{ marginTop: 0, marginBottom: 0 }}>אנשי קשר ופרטים</h1>
        <Link href={newHrefFor(activeTab)} style={newButtonStyle}>
          + {newLabelFor(activeTab)}
        </Link>
      </div>

      <p style={{ color: "var(--color-text-muted)" }}>מידע גלובלי, לא לפי טיול ספציפי — משמש לבחירה בטפסים בכל האפליקציה.</p>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }} role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="ui-btn-secondary"
            style={{ ...tabButtonStyle, ...(activeTab === tab.key ? activeTabButtonStyle : null) }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "contacts" ? <ContactsPanel contacts={contacts} tripNameById={tripNameById} /> : null}
      {activeTab === "payment-cards" ? <PaymentCardsPanel cards={paymentCards} /> : null}
      {activeTab === "loyalty-programs" ? <LoyaltyProgramsPanel programs={loyaltyPrograms} /> : null}
      {activeTab === "integration-accounts" ? <IntegrationAccountsPanel accounts={integrationAccounts} /> : null}
    </div>
  );
}

function newHrefFor(tab: TabKey): string {
  if (tab === "contacts") return "/contacts/new";
  if (tab === "payment-cards") return "/payment-cards/new";
  if (tab === "loyalty-programs") return "/loyalty-programs/new";
  return "/integration-accounts/new";
}

function newLabelFor(tab: TabKey): string {
  if (tab === "contacts") return "איש קשר חדש";
  if (tab === "payment-cards") return "כרטיס חדש";
  if (tab === "loyalty-programs") return "תוכנית חדשה";
  return "חשבון חדש";
}

function ContactsPanel({ contacts, tripNameById }: { contacts: Contact[]; tripNameById: Record<string, string> }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {contacts.map((contact) => (
        <li key={contact.id} style={rowStyle}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{contact.name}</div>
            <div style={mutedStyle}>
              {contact.category ? CONTACT_CATEGORY_LABELS[contact.category] : ""}
              {contact.company ? ` · ${contact.company}` : ""}
              {contact.phone ? ` · ${contact.phone}` : ""}
              {contact.website ? (
                <>
                  {" · "}
                  <a href={contact.website} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)" }}>
                    אתר
                  </a>
                </>
              ) : null}
              {contact.tripId ? ` · 🧳 ${tripNameById[contact.tripId] ?? "טיול שנמחק"}` : ""}
            </div>
          </div>
          <DeleteContactButton contactId={contact.id} />
        </li>
      ))}
      {contacts.length === 0 ? <p style={mutedStyle}>אין עדיין אנשי קשר.</p> : null}
    </ul>
  );
}

function PaymentCardsPanel({ cards }: { cards: PaymentCard[] }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {cards.map((card) => (
        <li key={card.id} style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "10px", background: "var(--color-surface)" }}>
          <div style={{ fontWeight: 600 }}>{card.cardName}</div>
          {card.defaultCurrencyCode ? <div style={mutedStyle}>מטבע ברירת מחדל: {card.defaultCurrencyCode}</div> : null}
        </li>
      ))}
      {cards.length === 0 ? <p style={mutedStyle}>אין עדיין אמצעי תשלום.</p> : null}
    </ul>
  );
}

function LoyaltyProgramsPanel({ programs }: { programs: LoyaltyProgram[] }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {programs.map((program) => (
        <li key={program.id} style={rowStyle}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{program.programName}</div>
            <div style={mutedStyle}>
              {program.programType ? LOYALTY_PROGRAM_TYPE_LABELS[program.programType] : ""}
              {program.memberNumber ? ` · מס' חבר: ${program.memberNumber}` : ""}
              {program.currentBalance !== null ? ` · ${program.currentBalance.toLocaleString("he-IL")} נק'` : ""}
              {program.tierStatus ? ` · ${program.tierStatus}` : ""}
            </div>
          </div>
          <DeleteLoyaltyProgramButton loyaltyProgramId={program.id} />
        </li>
      ))}
      {programs.length === 0 ? <p style={mutedStyle}>אין עדיין תוכניות נקודות/מיילים.</p> : null}
    </ul>
  );
}

function IntegrationAccountsPanel({ accounts }: { accounts: IntegrationAccount[] }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {accounts.map((account) => (
        <li key={account.id} style={rowStyle}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{INTEGRATION_SERVICE_LABELS[account.serviceName]}</div>
            <div style={mutedStyle}>
              {account.emailOrUsername ? `${account.emailOrUsername}` : ""}
              {account.notes ? ` · ${account.notes}` : ""}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem", fontSize: "0.8125rem", flexWrap: "wrap" }}>
              {account.accountLink ? (
                <a href={account.accountLink} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                  לחשבון שלי
                </a>
              ) : null}
              {account.bookingsLink ? (
                <a href={account.bookingsLink} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                  להזמנות שלי
                </a>
              ) : null}
              {account.websiteLink ? (
                <a href={account.websiteLink} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                  לאתר
                </a>
              ) : null}
            </div>
          </div>
          <DeleteIntegrationAccountButton integrationAccountId={account.id} />
        </li>
      ))}
      {accounts.length === 0 ? <p style={mutedStyle}>אין עדיין חשבונות חיצוניים שמורים.</p> : null}
    </ul>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "0.5rem",
  padding: "1rem",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  background: "var(--color-surface)",
};

const mutedStyle: React.CSSProperties = { color: "var(--color-text-muted)", fontSize: "0.875rem" };

const newButtonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: "var(--radius-full)",
  background: "var(--gradient-brand)",
  boxShadow: "var(--glow-brand)",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 700,
};

const tabButtonStyle: React.CSSProperties = {
  padding: "0.5rem 0.875rem",
  borderRadius: "var(--radius-full)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-primary)",
  fontSize: "0.8125rem",
  fontWeight: 600,
  cursor: "pointer",
};

const activeTabButtonStyle: React.CSSProperties = {
  border: "1px solid var(--color-primary)",
  background: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
  color: "var(--color-primary)",
};
