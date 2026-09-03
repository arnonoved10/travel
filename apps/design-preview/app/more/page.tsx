"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, ScreenHeader, ScreenShell, BottomNav, COLOR } from "../shared";
import { LegacyCard, LegacyScreenHeader, LegacyScreenShell, LegacyBottomNav, LEGACY_COLOR } from "../route/legacy-shared";
import { reverseGeocodeCountryAction } from "../actions";
import { FlagIcon } from "../country-currency-data";
import { CountryPickerButton, CurrencyPickerButton, AddCurrencySheet } from "../pickers";
import { Field, Sheet, ActionRow, PillSelect, DotsIcon, CameraIcon, ImageIcon, ChevronIcon, inputStyle, ToastView } from "../ui-kit";
import {
  currencyMeta,
  formatMoney,
  primaryCountryForCurrency,
  SK,
  tripScopedKey,
  loadJSON,
  saveJSON,
  today,
  nextId,
  compressImageFile,
  readWalletStateFromStorage,
  writeWalletStateToStorage,
  buildBackupBlob,
  downloadBlob,
  parseBackupJSON,
  buildExpenseReportCSV,
  notifyStorageFailure,
  type DocumentEntry,
  type ProfileInfo,
} from "../wallet-data";
import { type WalletStore } from "../wallet-store";
import { currentScopeTripId, resetAllTripScopedData } from "../trips-data";
import { putImage, deleteImage, clearAllImages, PROFILE_PHOTO_ID } from "../image-store";
import { useStoredImage } from "../use-stored-image";

/**
 * מסך "עוד" (design-preview בלבד) — כל אפשרות מובילה לתת-מסך אמיתי
 * ופעיל (לא "בקרוב"): ניהול מטבעות, ניהול כרטיסים, גיבוי/שחזור/דוח
 * (שהועברו הנה מהארנק לפי בקשה מפורשת), מסמכים וביטוח, פרופיל, הגדרות,
 * עזרה ואודות. שני פריטים בלבד (מצב-בהיר, שפות-נוספות) נשארים "בקרוב"
 * בכנות — כי מימוש אמיתי שלהם דורש מנגנון-עיצוב/תרגום שלם שלא קיים כאן.
 */

type Section = "currencies" | "cards" | "backup" | "documents" | "profile" | "settings" | "help" | "about" | null;

interface MoreLink {
  key: Exclude<Section, null>;
  label: string;
  description: string;
}
// עודכן: כל שורה מובילה לכתובת-URL אמיתית ונפרדת (לא section-switching
// פנימי) — כל מסך חייב "כתובת פנימית ברורה" לפי חבילת-העיצוב המחייבת.
// רכיבי ה-Section עצמם לא שוכתבו, רק מוצגים כעת גם דרך ה-URL הישיר.
const LINKS: { href: string; label: string; description: string }[] = [
  { href: "/currencies", label: "ניהול מטבעות", description: "הוספה, מחיקה, סדר, מטבע מקומי ומטבע בסיס" },
  { href: "/wallet/cards", label: "ניהול כרטיסי אשראי", description: "הוספה, עריכה, מחיקה וכרטיס ראשי" },
  { href: "/backup", label: "גיבוי ושחזור", description: "גיבוי נתוני הארנק, שחזור וייצוא דוח הוצאות" },
  { href: "/documents", label: "מסמכים וביטוח", description: "פוליסת ביטוח, דרכון, כרטיסי טיסה ומלון" },
  { href: "/profile", label: "פרופיל", description: "פרטים אישיים, מדינה, שפה ואיש קשר לחירום" },
  { href: "/settings", label: "הגדרות", description: "מטבע בסיס, יחידות טמפרטורה, התראות ואיפוס" },
  { href: "/help", label: "עזרה ואודות", description: "שאלות נפוצות, מדריכים, פנייה לתמיכה וגרסה" },
];

function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <button type="button" onClick={onBack} aria-label="חזרה לעוד" style={{ width: "36px", height: "36px", borderRadius: "50%", background: COLOR.cardBg, border: `1px solid ${COLOR.cardBorder}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 5 8 12l7 7" />
        </svg>
      </button>
      <h1 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#fff" }}>{title}</h1>
    </div>
  );
}

function ComingSoonSheet({ label, onClose }: { label: string; onClose: () => void }) {
  return (
    <Sheet title={`${label} — בקרוב`} onClose={onClose}>
      <div style={{ fontSize: "13px", color: COLOR.textSecondary, marginBottom: "16px" }}>התכונה הזו דורשת מנגנון עיצוב/תרגום מלא שעדיין לא נבנה בהדגמה זו. כרגע כל המסכים מוצגים בעברית ובערכת-הנושא הכהה בלבד.</div>
      <button type="button" onClick={onClose} style={{ width: "100%", padding: "13px", borderRadius: "12px", background: COLOR.purple, border: "none", color: "#fff", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}>
        הבנתי
      </button>
    </Sheet>
  );
}

function LegacyChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: LEGACY_COLOR.textMuted }}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

export default function MorePreviewScreen() {
  const router = useRouter();
  return (
    <LegacyScreenShell>
      <LegacyScreenHeader title="עוד" subtitle="הגדרות, ניהול ותמיכה" />
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {LINKS.map((link) => (
          <button key={link.href} type="button" onClick={() => router.push(link.href)} style={{ display: "block", width: "100%", textAlign: "start", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
            <LegacyCard style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{link.label}</div>
                <div style={{ fontSize: "11.5px", color: LEGACY_COLOR.textSecondary, marginTop: "2px" }}>{link.description}</div>
              </div>
              <LegacyChevronIcon />
            </LegacyCard>
          </button>
        ))}
      </div>
      <LegacyBottomNav active="more" />
    </LegacyScreenShell>
  );
}

// ============================== ניהול מטבעות ==============================

// עודכן: לא עוד עותק-עצמאי שלישי של לוגיקת-הארנק (בנוסף ל-wallet-store.ts
// ו-wallet/page.tsx לפני איחודו) — מקבל את ה-store המשותף (useWalletStore,
// שנוצר פעם אחת ברמת דף-העטיפה currencies/page.tsx) כ-prop, כדי שגם הטוסט
// וגם ההיקף-לכל-טיול יהיו תמיד זהים לשאר מסכי הארנק, לא מסונכרנים-ידנית.
export function CurrenciesSection({ onBack, store }: { onBack: () => void; store: WalletStore }) {
  const { balances, baseCurrency, setBaseCurrency, manualCountryCode, setManualCountryCode, setGeoCountryCode, showToast, adjustBalance, moveBalance, removeBalanceCurrency } = store;
  const [addOpen, setAddOpen] = useState(false);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "error" | "done">("idle");

  function setLocal(code: string) {
    const country = primaryCountryForCurrency(code);
    if (!country) {
      showToast("לא נמצאה מדינה מתאימה למטבע זה");
      return;
    }
    setManualCountryCode(country.code);
    showToast(`המטבע המקומי הוגדר ל-${currencyMeta(code).name}`);
  }
  async function detectByLocation() {
    if (!("geolocation" in navigator)) {
      setGeoStatus("error");
      showToast("המכשיר אינו תומך באיתור מיקום");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const result = await reverseGeocodeCountryAction(pos.coords.latitude, pos.coords.longitude);
        if (result) {
          setGeoCountryCode(result.countryCode);
          setGeoStatus("done");
          showToast(`זוהה מיקום: ${result.countryName}`);
        } else {
          setGeoStatus("error");
          showToast("לא ניתן היה לזהות מדינה מהמיקום");
        }
      },
      () => {
        setGeoStatus("error");
        showToast("ההרשאה לאיתור מיקום נדחתה");
      },
    );
  }

  return (
    <>
      <SubHeader title="ניהול מטבעות" onBack={onBack} />
      <Card>
        <div style={{ fontSize: "12.5px", color: COLOR.textSecondary, marginBottom: "8px" }}>מטבע הבסיס קובע לפי איזה מטבע מוצג הסיכום הכולל בארנק.</div>
        <Field label="מטבע בסיס">
          <CurrencyPickerButton selectedCode={baseCurrency} onSelect={setBaseCurrency} testId="settings-base-currency" />
        </Field>
      </Card>
      <Card>
        <div style={{ fontSize: "12.5px", color: COLOR.textSecondary, marginBottom: "8px" }}>המטבע המקומי נקבע אוטומטית לפי יעד הטיול הפעיל, אך ניתן לעקוף ידנית — לדוגמה כשמתכננים קטע טיול שלא כלול עדיין במסלול.</div>
        <button type="button" onClick={detectByLocation} disabled={geoStatus === "loading"} style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}>
          {geoStatus === "loading" ? "מאתר מיקום..." : "זיהוי מיקום אוטומטי (GPS)"}
        </button>
        {manualCountryCode ? (
          <button type="button" onClick={() => setManualCountryCode(null)} style={{ width: "100%", marginTop: "6px", padding: "8px", borderRadius: "10px", background: "none", border: "none", color: COLOR.textMuted, fontSize: "11.5px", cursor: "pointer" }}>
            איפוס הבחירה הידנית וחזרה לזיהוי אוטומטי
          </button>
        ) : null}
      </Card>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>מטבעות בארנק</span>
        <button type="button" onClick={() => setAddOpen(true)} style={{ padding: "6px 12px", borderRadius: "999px", background: "rgba(138,90,223,0.18)", border: `1px solid ${COLOR.purple}55`, color: "#c9b3ff", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}>
          + הוספת מטבע
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {balances.map((b, i) => {
          const country = primaryCountryForCurrency(b.code);
          const isLocal = manualCountryCode ? country?.code === manualCountryCode : false;
          return (
            <Card key={b.code} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {country ? <FlagIcon countryCode={country.code} size={22} /> : null}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                  {b.code} · {currencyMeta(b.code).name}
                  {isLocal ? <span style={{ fontSize: "9px", fontWeight: 800, color: "#c9b3ff", background: "rgba(138,90,223,0.22)", borderRadius: "999px", padding: "1px 6px" }}>מקומי</span> : null}
                  {baseCurrency === b.code ? <span style={{ fontSize: "9px", fontWeight: 800, color: COLOR.turquoise, background: "rgba(67,214,170,0.14)", borderRadius: "999px", padding: "1px 6px" }}>בסיס</span> : null}
                </div>
                <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>יתרה: {formatMoney(b.balance, b.code)}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <button type="button" disabled={i === 0} aria-label="הזזה למעלה" onClick={() => moveBalance(i, -1)} style={{ width: "24px", height: "20px", borderRadius: "5px", background: "rgba(255,255,255,0.06)", border: "none", color: i === 0 ? COLOR.textMuted : "#fff", cursor: i === 0 ? "default" : "pointer", fontSize: "11px" }}>
                  ▲
                </button>
                <button type="button" disabled={i === balances.length - 1} aria-label="הזזה למטה" onClick={() => moveBalance(i, 1)} style={{ width: "24px", height: "20px", borderRadius: "5px", background: "rgba(255,255,255,0.06)", border: "none", color: i === balances.length - 1 ? COLOR.textMuted : "#fff", cursor: i === balances.length - 1 ? "default" : "pointer", fontSize: "11px" }}>
                  ▼
                </button>
              </div>
              <button type="button" onClick={() => setLocal(b.code)} style={{ padding: "6px 8px", borderRadius: "8px", background: "rgba(138,90,223,0.14)", border: `1px solid ${COLOR.purple}40`, color: "#c9b3ff", fontSize: "10px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                הפוך למקומי
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`להסיר את ${b.code} מהארנק?`)) removeBalanceCurrency(b.code);
                }}
                aria-label={`מחיקת ${b.code}`}
                style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(239,111,97,0.12)", border: `1px solid ${COLOR.danger}40`, color: COLOR.danger, cursor: "pointer", fontSize: "13px" }}
              >
                ✕
              </button>
            </Card>
          );
        })}
      </div>

      {addOpen ? (
        <AddCurrencySheet
          existingCodes={balances.map((b) => b.code)}
          onClose={() => setAddOpen(false)}
          onAdd={(code) => {
            if (!balances.some((b) => b.code === code)) adjustBalance(code, 0);
            setAddOpen(false);
            showToast(`נוסף מטבע ${currencyMeta(code).name}`);
          }}
        />
      ) : null}
    </>
  );
}

// ============================== גיבוי ושחזור ==============================

// קורא/כותב ישירות דרך wallet-data.ts (לא useWalletStore) בכוונה — גיבוי
// הוא תמונת-מצב חד-פעמית, לא state חי, ואין טעם להרכיב hook מלא בשבילו.
// מקבל tripId מפורש מדף-העטיפה (backup/page.tsx, שכבר קורא currentScopeTripId
// פעם אחת) — ר' הסבר ב-wallet-data.ts על מניעת מעגל-ייבוא.
export function BackupSection({ onBack, showToast, tripId }: { onBack: () => void; showToast: (m: string) => void; tripId: string }) {
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLastBackupAt(loadJSON<string | null>(tripScopedKey(SK.lastBackupAt, tripId), null));
  }, [tripId]);

  async function handleBackup() {
    const state = await readWalletStateFromStorage(tripId);
    downloadBlob(buildBackupBlob(state), `wallet-backup-${today()}.json`);
    const now = new Date().toISOString();
    saveJSON(tripScopedKey(SK.lastBackupAt, tripId), now);
    setLastBackupAt(now);
    showToast("גיבוי נתוני הארנק נשמר בהצלחה");
  }
  function handleRestore(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const parsed = parseBackupJSON(String(reader.result));
      if (!parsed) {
        showToast("קובץ הגיבוי אינו תקין — השחזור בוטל");
        return;
      }
      await writeWalletStateToStorage(parsed, tripId);
      showToast("נתוני הארנק שוחזרו מהגיבוי בהצלחה");
    };
    reader.readAsText(file);
  }
  async function handleReport() {
    const state = await readWalletStateFromStorage(tripId);
    const csv = buildExpenseReportCSV(state.expenses, state.cards);
    downloadBlob(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), `expense-report-${today()}.csv`);
    showToast("דוח ההוצאות יוצא בהצלחה");
  }

  return (
    <>
      <SubHeader title="גיבוי ושחזור" onBack={onBack} />
      <Card>
        <div style={{ fontSize: "12.5px", color: COLOR.textSecondary, marginBottom: "4px" }}>גיבוי אחרון:</div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{lastBackupAt ? new Date(lastBackupAt).toLocaleString("he-IL") : "טרם בוצע גיבוי"}</div>
      </Card>
      <button type="button" onClick={handleBackup} style={{ padding: "13px", borderRadius: "12px", background: COLOR.purple, border: "none", color: "#fff", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}>
        גיבוי נתוני הארנק
      </button>
      <div style={{ fontSize: "10.5px", color: COLOR.textMuted, marginTop: "-6px" }}>שומר בקובץ JSON את היתרות, ההוצאות, ההמרות, הכרטיסים והקבלות</div>
      <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: "13px", borderRadius: "12px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}>
        שחזור נתוני הארנק
      </button>
      <div style={{ fontSize: "10.5px", color: COLOR.textMuted, marginTop: "-6px" }}>מחזיר את הארנק למצב ששמור בקובץ גיבוי קודם</div>
      <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRestore(f); e.target.value = ""; }} />
      <button type="button" onClick={handleReport} style={{ padding: "13px", borderRadius: "12px", background: "rgba(138,90,223,0.16)", border: `1px solid ${COLOR.purple}45`, color: "#c9b3ff", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}>
        ייצוא דוח הוצאות (CSV)
      </button>
    </>
  );
}

// ============================== מסמכים וביטוח ==============================

const DOCUMENT_KIND_LABEL: Record<DocumentEntry["kind"], string> = {
  insurance: "ביטוח נסיעות",
  passport: "דרכון",
  flight: "כרטיס טיסה",
  hotel: "אישור מלון",
  other: "אחר",
};

export function DocumentsSection({ onBack, showToast }: { onBack: () => void; showToast: (m: string, a?: string, cb?: () => void) => void }) {
  const [hydrated, setHydrated] = useState(false);
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [viewing, setViewing] = useState<DocumentEntry | null>(null);
  const [renaming, setRenaming] = useState<DocumentEntry | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const pendingDelete = useRef<{ doc: DocumentEntry; index: number } | null>(null);

  useEffect(() => {
    setDocuments(loadJSON(SK.documents, []));
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    saveJSON(SK.documents, documents);
  }, [documents, hydrated]);

  function remove(id: string) {
    const idx = documents.findIndex((d) => d.id === id);
    const doc = documents[idx]!;
    if (!confirm(`למחוק את "${doc.title}"?`)) return;
    pendingDelete.current = { doc, index: idx };
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    showToast(`"${doc.title}" נמחק`, "בטל", () => {
      const pending = pendingDelete.current;
      if (!pending) return;
      setDocuments((prev) => {
        const arr = [...prev];
        arr.splice(pending.index, 0, pending.doc);
        return arr;
      });
      pendingDelete.current = null;
    });
    // מוחקת גם את תמונת-המסמך עצמה מ-IndexedDB — מושהית עד אחרי חלון-הביטול
    // (4200ms ב-showToast), כדי ש"בטל" ישחזר את התמונה במלואה, לא רק את הרשומה.
    setTimeout(() => {
      if (pendingDelete.current?.doc.id === id) deleteImage(id).catch((err) => console.error("DocumentsSection.remove: deleteImage failed:", err));
    }, 4300);
  }

  return (
    <>
      <SubHeader title="מסמכים וביטוח" onBack={onBack} />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={() => setAddOpen(true)} style={{ padding: "6px 12px", borderRadius: "999px", background: "rgba(138,90,223,0.18)", border: `1px solid ${COLOR.purple}55`, color: "#c9b3ff", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}>
          + הוספת מסמך
        </button>
      </div>
      {documents.length === 0 ? (
        <div style={{ fontSize: "12.5px", color: COLOR.textSecondary, padding: "6px 2px" }}>עדיין לא נוספו מסמכים</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {documents.map((d) => (
            <Card key={d.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button type="button" onClick={() => setViewing(d)} style={{ width: "44px", height: "44px", borderRadius: "10px", overflow: "hidden", border: `1px solid ${COLOR.cardBorder}`, padding: 0, cursor: "pointer", flexShrink: 0 }}>
                <DocumentThumbnail id={d.id} title={d.title} />
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#fff" }}>{d.title}</div>
                <div style={{ fontSize: "11px", color: COLOR.textSecondary }}>{DOCUMENT_KIND_LABEL[d.kind]} · {d.createdAt}</div>
              </div>
              <button type="button" onClick={() => { setRenaming(d); setRenameValue(d.title); }} style={{ padding: "6px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                שינוי שם
              </button>
              <button type="button" onClick={() => remove(d.id)} aria-label={`מחיקת ${d.title}`} style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(239,111,97,0.12)", border: `1px solid ${COLOR.danger}40`, color: COLOR.danger, cursor: "pointer", fontSize: "13px" }}>
                ✕
              </button>
            </Card>
          ))}
        </div>
      )}

      {viewing ? (
        <Sheet title={viewing.title} onClose={() => setViewing(null)}>
          <DocumentViewerImage id={viewing.id} title={viewing.title} />
        </Sheet>
      ) : null}

      {renaming ? (
        <Sheet title="שינוי שם המסמך" onClose={() => setRenaming(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Field label="שם המסמך">
              <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} style={inputStyle()} />
            </Field>
            <button
              type="button"
              disabled={!renameValue.trim()}
              onClick={() => {
                setDocuments((prev) => prev.map((d) => (d.id === renaming.id ? { ...d, title: renameValue.trim() } : d)));
                setRenaming(null);
                showToast("שם המסמך עודכן");
              }}
              style={{ padding: "13px", borderRadius: "12px", background: COLOR.purple, border: "none", color: "#fff", fontSize: "14.5px", fontWeight: 800, cursor: "pointer" }}
            >
              שמירה
            </button>
          </div>
        </Sheet>
      ) : null}

      {addOpen ? (
        <AddDocumentForm
          onClose={() => setAddOpen(false)}
          onSave={async (doc, dataUrl) => {
            const id = nextId("doc");
            try {
              await putImage(id, dataUrl);
            } catch (err) {
              console.error("AddDocumentForm.onSave: putImage failed:", err);
              notifyStorageFailure();
              return;
            }
            setDocuments((prev) => [{ id, createdAt: today(), ...doc }, ...prev]);
            setAddOpen(false);
            showToast("המסמך נוסף");
          }}
        />
      ) : null}
    </>
  );
}

function DocumentThumbnail({ id, title }: { id: string; title: string }) {
  const url = useStoredImage(id);
  if (!url) return null;
  return <img src={url} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
}
function DocumentViewerImage({ id, title }: { id: string; title: string }) {
  const url = useStoredImage(id);
  if (!url) return null;
  return <img src={url} alt={title} style={{ width: "100%", borderRadius: "12px" }} />;
}

function AddDocumentForm({ onClose, onSave }: { onClose: () => void; onSave: (doc: Omit<DocumentEntry, "id" | "createdAt">, dataUrl: string) => void }) {
  const [kind, setKind] = useState<DocumentEntry["kind"]>("insurance");
  const [title, setTitle] = useState("");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const compressed = await compressImageFile(file);
    setDataUrl(compressed);
    if (!title) setTitle(DOCUMENT_KIND_LABEL[kind]);
  }

  return (
    <Sheet title="הוספת מסמך" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Field label="סוג המסמך">
          <PillSelect options={["insurance", "passport", "flight", "hotel", "other"] as const} value={kind} onChange={setKind} labels={DOCUMENT_KIND_LABEL} />
        </Field>
        <Field label="תמונת המסמך">
          {dataUrl ? (
            <img src={dataUrl} alt="תצוגה מקדימה" style={{ width: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "10px", background: "#000" }} />
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" onClick={() => cameraRef.current?.click()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "11px", borderRadius: "10px", background: "rgba(138,90,223,0.16)", border: `1px solid ${COLOR.purple}40`, color: "#c9b3ff", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}>
                <CameraIcon size={15} />
                צילום
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "11px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}>
                <ImageIcon size={15} />
                בחירת קובץ
              </button>
            </div>
          )}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
        </Field>
        <Field label="שם המסמך">
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle()} />
        </Field>
        <button type="button" disabled={!dataUrl || !title.trim()} onClick={() => onSave({ kind, title: title.trim() }, dataUrl!)} style={{ padding: "13px", borderRadius: "12px", background: dataUrl && title.trim() ? COLOR.purple : "rgba(255,255,255,0.08)", border: "none", color: "#fff", fontSize: "14.5px", fontWeight: 800, cursor: dataUrl && title.trim() ? "pointer" : "default" }}>
          שמירת המסמך
        </button>
      </div>
    </Sheet>
  );
}

// ============================== פרופיל ==============================

const DEFAULT_PROFILE: ProfileInfo = { name: "", phone: "", email: "", countryCode: "IL", language: "he", baseCurrency: "ILS", emergencyContactName: "", emergencyContactPhone: "" };

export function ProfileSection({ onBack, showToast }: { onBack: () => void; showToast: (m: string) => void }) {
  const [profile, setProfile] = useState<ProfileInfo>(DEFAULT_PROFILE);
  const photoRef = useRef<HTMLInputElement>(null);
  // undefined = "לא נגעו בתמונה" (מציגים את מה ששמור), null = "הוסרה
  // במפורש", מחרוזת = תמונה חדשה שנבחרה — בכל שלושת המצבים שום דבר לא
  // נכתב בפועל עד לחיצה על "שמירת הפרופיל", בדיוק כמו ההתנהגות הקודמת.
  const [photoPreview, setPhotoPreview] = useState<string | null | undefined>(undefined);
  const storedPhotoUrl = useStoredImage(PROFILE_PHOTO_ID);
  const displayedPhoto = photoPreview !== undefined ? photoPreview : storedPhotoUrl;

  useEffect(() => {
    setProfile(loadJSON(SK.profile, DEFAULT_PROFILE));
  }, []);

  async function handlePhoto(file: File) {
    setPhotoPreview(await compressImageFile(file, 400, 0.8));
  }
  async function save() {
    if (photoPreview !== undefined) {
      try {
        if (photoPreview) await putImage(PROFILE_PHOTO_ID, photoPreview);
        else await deleteImage(PROFILE_PHOTO_ID);
      } catch (err) {
        console.error("ProfileSection.save: photo save failed:", err);
        notifyStorageFailure();
        return;
      }
    }
    saveJSON(SK.profile, profile);
    saveJSON(SK.baseCcy, profile.baseCurrency);
    showToast("הפרופיל נשמר");
  }

  return (
    <>
      <SubHeader title="פרופיל" onBack={onBack} />
      <div style={{ fontSize: "10.5px", color: COLOR.textMuted }}>פרופיל מקומי להדגמה בלבד — אינו מחובר לחשבון המשתמש האמיתי או לשרת.</div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative" }}>
          <button type="button" onClick={() => photoRef.current?.click()} style={{ width: "76px", height: "76px", borderRadius: "50%", overflow: "hidden", border: `2px solid ${COLOR.purple}`, background: "#0e1930", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
            {displayedPhoto ? <img src={displayedPhoto} alt="תמונת פרופיל" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <CameraIcon size={22} />}
          </button>
          {displayedPhoto ? (
            <button
              type="button"
              onClick={() => confirm("להסיר את תמונת הפרופיל?") && setPhotoPreview(null)}
              aria-label="הסרת תמונת הפרופיל"
              style={{ position: "absolute", bottom: 0, insetInlineEnd: -4, width: "24px", height: "24px", borderRadius: "50%", background: COLOR.danger, border: "2px solid #0e1930", color: "#fff", cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
            >
              ✕
            </button>
          ) : null}
        </div>
        <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f); e.target.value = ""; }} />
      </div>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Field label="שם מלא">
            <input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} style={inputStyle()} />
          </Field>
          <Field label="טלפון">
            <input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} style={inputStyle()} />
          </Field>
          <Field label="דוא״ל">
            <input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} style={inputStyle()} />
          </Field>
          <Field label="מדינת מגורים">
            <CountryPickerButton selectedCode={profile.countryCode} onSelect={(c) => setProfile((p) => ({ ...p, countryCode: c.code }))} />
          </Field>
          <Field label="מטבע בסיס">
            <CurrencyPickerButton selectedCode={profile.baseCurrency} onSelect={(code) => setProfile((p) => ({ ...p, baseCurrency: code }))} />
          </Field>
          <Field label="איש קשר לחירום — שם">
            <input value={profile.emergencyContactName} onChange={(e) => setProfile((p) => ({ ...p, emergencyContactName: e.target.value }))} style={inputStyle()} />
          </Field>
          <Field label="איש קשר לחירום — טלפון">
            <input value={profile.emergencyContactPhone} onChange={(e) => setProfile((p) => ({ ...p, emergencyContactPhone: e.target.value }))} style={inputStyle()} />
          </Field>
        </div>
      </Card>
      <button type="button" onClick={save} style={{ padding: "13px", borderRadius: "12px", background: COLOR.purple, border: "none", color: "#fff", fontSize: "14.5px", fontWeight: 800, cursor: "pointer" }}>
        שמירת הפרופיל
      </button>
    </>
  );
}

// ============================== הגדרות ==============================

interface SettingsData {
  temperatureUnit: "C" | "F";
}
const DEFAULT_SETTINGS: SettingsData = { temperatureUnit: "C" };

// אומדן שמרני-בכוונה (לא "המכסה האמיתית" — היא משתנה בין דפדפנים ולא
// ניתנת-לקריאה ישירות) — רק כדי לתת למשתמש אינדיקציה מוקדמת לפני שנתקל
// בכשל-שמירה בפועל (ר' התיקון ל-saveJSON: כשל אמיתי כן יוצג מיידית, זה
// כאן רק אזהרה-מונעת). מחשב לפי כל מפתחות "design-preview-" בלבד — לא
// כל localStorage של הדפדפן (עלול לכלול אתרים/הרחבות אחרים באותו פרופיל,
// אבל localStorage ממילא מבודד-לפי-origin כך שבפועל כל המפתחות כאן שייכים
// לאפליקציה הזו בלבד).
const ESTIMATED_QUOTA_BYTES = 5 * 1024 * 1024;
function computeStorageUsageBytes(): number {
  if (typeof localStorage === "undefined") return 0;
  let total = 0;
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith("design-preview-")) continue;
    total += key.length + (localStorage.getItem(key)?.length ?? 0);
  }
  return total;
}

export function SettingsSection({ onBack, showToast }: { onBack: () => void; showToast: (m: string) => void }) {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [baseCurrency, setBaseCurrency] = useState("ILS");
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | "unsupported">("default");
  const [comingSoon, setComingSoon] = useState<string | null>(null);
  const [storageBytes, setStorageBytes] = useState(0);

  useEffect(() => {
    setSettings(loadJSON(SK.settings, DEFAULT_SETTINGS));
    setBaseCurrency(loadJSON(SK.baseCcy, "ILS"));
    setNotifStatus(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
    setStorageBytes(computeStorageUsageBytes());
  }, []);

  function updateSettings(patch: Partial<SettingsData>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveJSON(SK.settings, next);
      return next;
    });
  }
  function changeBaseCurrency(code: string) {
    setBaseCurrency(code);
    saveJSON(SK.baseCcy, code);
    showToast(`מטבע הבסיס עודכן ל-${code}`);
  }
  async function requestNotifications() {
    if (typeof Notification === "undefined") {
      showToast("הדפדפן אינו תומך בהתראות");
      return;
    }
    const result = await Notification.requestPermission();
    setNotifStatus(result);
    showToast(result === "granted" ? "ההרשאה להתראות אושרה" : "ההרשאה להתראות לא ניתנה");
  }
  // מוחק את כל הנתונים התלויי-טיול (ארנק/מסלול/הזמנות/אריזה/מעקב) של כל
  // טיול שקיים אי-פעם, כולל מרשם-הטיולים עצמו — לא רק את הטיול הפעיל, כי
  // "מחיקת כל הנתונים שלי" אמורה להיות איפוס אמיתי-מלא, לא רק של מה שגלוי
  // כרגע. מפתחות-חשבון-גלובליים (מסמכים/פרופיל/הגדרות/קטגוריות) לא תלויי-
  // טיול — נמחקים כאן בנפרד.
  function resetDemoData() {
    if (!confirm("למחוק את כל הנתונים באפליקציה (טיולים, ארנק, הוצאות, מסלול, הזמנות)? לא ניתן לבטל.")) return;
    resetAllTripScopedData();
    for (const key of [SK.documents, SK.profile, SK.settings, SK.customCategories]) localStorage.removeItem(key);
    // מכסה קבלות + מסמכים + תמונת-פרופיל בבת-אחת — כל התמונות יושבות
    // ב-IndexedDB אחד (ר' image-store.ts), לא רק תחת מפתחות-הטיולים.
    clearAllImages().catch((err) => console.error("resetDemoData: clearAllImages failed:", err));
    showToast("כל הנתונים נמחקו — טוען מחדש...");
    setTimeout(() => window.location.reload(), 900);
  }

  return (
    <>
      <SubHeader title="הגדרות" onBack={onBack} />
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>מקום אחסון בשימוש</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: storageBytes / ESTIMATED_QUOTA_BYTES > 0.8 ? COLOR.danger : COLOR.textSecondary }}>
            {(storageBytes / 1024).toLocaleString(undefined, { maximumFractionDigits: 0 })} KB
          </span>
        </div>
        <div style={{ width: "100%", height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, (storageBytes / ESTIMATED_QUOTA_BYTES) * 100)}%`, height: "100%", background: storageBytes / ESTIMATED_QUOTA_BYTES > 0.8 ? COLOR.danger : COLOR.purple }} />
        </div>
        {storageBytes / ESTIMATED_QUOTA_BYTES > 0.7 ? (
          <div style={{ fontSize: "11px", color: COLOR.danger, marginTop: "6px" }}>מתקרב למכסת האחסון של הדפדפן — נסו לרענן ולנסות שוב אם שמירה נכשלת.</div>
        ) : (
          <div style={{ fontSize: "10.5px", color: COLOR.textMuted, marginTop: "6px" }}>
            אומדן — כל הנתונים נשמרים רק בדפדפן הזה. תמונות (קבלות/מסמכים/תמונת-פרופיל) נשמרות בנפרד באחסון עם מכסה גדולה בהרבה, ולא נספרות כאן.
          </div>
        )}
      </Card>
      <Card>
        <Field label="מטבע בסיס">
          <CurrencyPickerButton selectedCode={baseCurrency} onSelect={changeBaseCurrency} />
        </Field>
      </Card>
      <Card>
        <span style={{ fontSize: "12.5px", fontWeight: 700, color: COLOR.textSecondary, display: "block", marginBottom: "6px" }}>יחידות טמפרטורה</span>
        <PillSelect options={["C", "F"] as const} value={settings.temperatureUnit} onChange={(v) => updateSettings({ temperatureUnit: v })} labels={{ C: "צלזיוס (°C)", F: "פרנהייט (°F)" }} />
      </Card>
      <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>התראות</div>
          <div style={{ fontSize: "11px", color: COLOR.textSecondary, marginTop: "2px" }}>סטטוס: {notifStatus === "granted" ? "מאושר" : notifStatus === "denied" ? "נדחה" : notifStatus === "unsupported" ? "לא נתמך" : "טרם נשאל"}</div>
        </div>
        <button type="button" onClick={requestNotifications} style={{ padding: "8px 14px", borderRadius: "10px", background: "rgba(138,90,223,0.18)", border: `1px solid ${COLOR.purple}55`, color: "#c9b3ff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
          בקשת הרשאה
        </button>
      </Card>
      <button type="button" onClick={() => setComingSoon("מצב תצוגה בהיר")} style={{ display: "block", width: "100%", textAlign: "start", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
        <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>מצב תצוגה: כהה</span>
          <ChevronIcon />
        </Card>
      </button>
      <button type="button" onClick={() => setComingSoon("שפות נוספות")} style={{ display: "block", width: "100%", textAlign: "start", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
        <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>שפה: עברית</span>
          <ChevronIcon />
        </Card>
      </button>
      <button type="button" onClick={resetDemoData} style={{ padding: "13px", borderRadius: "12px", background: "rgba(239,111,97,0.14)", border: `1px solid ${COLOR.danger}45`, color: COLOR.danger, fontSize: "14px", fontWeight: 800, cursor: "pointer" }}>
        מחיקת כל הנתונים שלי
      </button>

      {comingSoon ? <ComingSoonSheet label={comingSoon} onClose={() => setComingSoon(null)} /> : null}
    </>
  );
}

// ============================== עזרה ==============================

const FAQ: { q: string; a: string }[] = [
  { q: "איך מוגדר המטבע המקומי בארנק?", a: "המערכת בוחרת אותו אוטומטית לפי יעד הטיול הפעיל בתאריך הנוכחי. אפשר לעקוף זאת בכל רגע דרך \"שינוי מדינה\" בכרטיס המטבע המקומי, או דרך ניהול מטבעות במסך עוד." },
  { q: "למה ההמרה בין מטבעות לא משתמשת בשער האינטרנט?", a: "כי בפועל מקבלים סכום שונה בכל דוכן/בנק. לכן מזינים את הסכום שהתקבל בפועל, ושער האינטרנט מוצג רק כמידע להשוואה." },
  { q: "מה ההבדל בין הוצאה במזומן להוצאה באשראי?", a: "הוצאת מזומן/חיוב מפחיתה מיד מהיתרה. הוצאת אשראי לא מפחיתה מהיתרה (מחויבת מאוחר יותר בדוח האשראי) אבל כן נכללת בסך ההוצאות ובדוח." },
  { q: "איפה שומרים את הקבלות שמצלמים?", a: "הקבלות נשמרות מקומית במכשיר בלבד (לא מועלות לשרת), בצמוד להוצאה שאליה צולמו." },
  { q: "איך משחזרים נתונים לאחר מחיקה או החלפת מכשיר?", a: "דרך עוד ← גיבוי ושחזור: אפשר לגבות לקובץ ולשחזר ממנו בכל שלב." },
];

export function HelpSection({ onBack, showToast }: { onBack: () => void; showToast: (m: string) => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  return (
    <>
      <SubHeader title="עזרה" onBack={onBack} />
      <span style={{ fontSize: "13px", fontWeight: 800, color: "#fff" }}>שאלות נפוצות</span>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {FAQ.map((item, i) => (
          <Card key={i}>
            <button type="button" onClick={() => setOpenIndex(openIndex === i ? null : i)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "start" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{item.q}</span>
              <span style={{ color: COLOR.textSecondary, fontSize: "14px", flexShrink: 0, marginInlineStart: "8px" }}>{openIndex === i ? "−" : "+"}</span>
            </button>
            {openIndex === i ? <div style={{ fontSize: "12px", color: COLOR.textSecondary, marginTop: "8px", lineHeight: 1.6 }}>{item.a}</div> : null}
          </Card>
        ))}
      </div>
      <span style={{ fontSize: "13px", fontWeight: 800, color: "#fff" }}>פנייה לתמיכה</span>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Field label="נושא">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle()} />
          </Field>
          <Field label="הודעה">
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} style={{ ...inputStyle(), resize: "vertical" }} />
          </Field>
          <button
            type="button"
            disabled={!subject.trim() || !message.trim()}
            onClick={() => {
              setSubject("");
              setMessage("");
              showToast("הפנייה נשמרה להדגמה בלבד — אין כרגע חיבור אמיתי למערכת תמיכה");
            }}
            style={{ padding: "11px", borderRadius: "10px", background: subject.trim() && message.trim() ? COLOR.purple : "rgba(255,255,255,0.08)", border: "none", color: "#fff", fontSize: "13px", fontWeight: 800, cursor: subject.trim() && message.trim() ? "pointer" : "default" }}
          >
            שליחה
          </button>
        </div>
      </Card>
    </>
  );
}

// ============================== אודות ==============================

export function AboutSection({ onBack }: { onBack: () => void }) {
  const [openSheet, setOpenSheet] = useState<"privacy" | "terms" | null>(null);
  return (
    <>
      <SubHeader title="אודות" onBack={onBack} />
      <Card style={{ textAlign: "center", padding: "24px 16px" }}>
        <div style={{ fontSize: "20px", fontWeight: 800, color: "#fff" }}>TRIP MASTER</div>
        <div style={{ fontSize: "12px", color: COLOR.textSecondary, marginTop: "4px" }}>גרסת הדגמה (design-preview) 0.1.0</div>
      </Card>
      <button type="button" onClick={() => setOpenSheet("privacy")} style={{ display: "block", width: "100%", textAlign: "start", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
        <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>מדיניות פרטיות</span>
          <ChevronIcon />
        </Card>
      </button>
      <button type="button" onClick={() => setOpenSheet("terms")} style={{ display: "block", width: "100%", textAlign: "start", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
        <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>תנאי שימוש</span>
          <ChevronIcon />
        </Card>
      </button>
      <Card>
        <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>מקורות מידע בשימוש בהדגמה זו</div>
        <ul style={{ margin: 0, paddingInlineStart: "18px", fontSize: "11.5px", color: COLOR.textSecondary, lineHeight: 1.9 }}>
          <li>מזג אוויר: Open-Meteo (חינמי, ללא מפתח)</li>
          <li>שערי מטבע: בנק ישראל + Frankfurter (ECB)</li>
          <li>זיהוי טקסט בקבלות: Tesseract OCR (מקומי, חינמי)</li>
          <li>מפות ומיקום: OpenStreetMap (אריחי מפה + Nominatim לזיהוי מדינה לפי מיקום)</li>
        </ul>
      </Card>

      {openSheet ? (
        <Sheet title={openSheet === "privacy" ? "מדיניות פרטיות" : "תנאי שימוש"} onClose={() => setOpenSheet(null)}>
          <div style={{ fontSize: "12px", color: COLOR.textSecondary, lineHeight: 1.8 }}>
            זהו טקסט הדגמה בלבד (design-preview) ואינו מסמך משפטי אמיתי. כל הנתונים במסך זה — יתרות, הוצאות, מסמכים ופרופיל — נשמרים באחסון המקומי של הדפדפן בלבד ואינם נשלחים לשום שרת חיצוני.
          </div>
        </Sheet>
      ) : null}
    </>
  );
}
