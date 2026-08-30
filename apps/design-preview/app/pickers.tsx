"use client";

import { useMemo, useState } from "react";
import { COLOR } from "./shared";
import { COUNTRIES, CURRENCY_META, FlagIcon, type CountryEntry } from "./country-currency-data";
import { currencyMeta } from "./wallet-data";

/**
 * רכיבי-בחירה מבוססי-דגל (מדינה/מטבע) עם חיפוש — מחליפים את כל ה-<select>
 * הרגילים בארנק, לפי בקשה מפורשת. משתמשים בדגלי-SVG מקומיים (FlagIcon),
 * לא אימוג'י, עובד גם ללא אינטרנט. תמיד מוצג שם+קוד לצד הדגל.
 */

function PickerSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1700, display: "flex", alignItems: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(3,6,16,0.65)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: "480px", marginInline: "auto", background: "#101d3a", borderTopLeftRadius: "22px", borderTopRightRadius: "22px", border: `1px solid ${COLOR.cardBorder}`, borderBottom: "none", padding: "10px 16px calc(16px + env(safe-area-inset-bottom))", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ width: "40px", height: "4px", borderRadius: "999px", background: "rgba(255,255,255,0.25)", margin: "4px auto 10px", flexShrink: 0 }} />
        <div style={{ fontSize: "15px", fontWeight: 800, color: "#fff", marginBottom: "8px", flexShrink: 0 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus
      style={{ width: "100%", padding: "11px 12px", borderRadius: "12px", background: "#0e1930", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "14px", fontFamily: "inherit", marginBottom: "8px", flexShrink: 0 }}
    />
  );
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

// ============================== בחירת מדינה ==============================

export function CountryPickerButton({ selectedCode, onSelect, placeholder = "בחירת מדינה", testId }: { selectedCode: string | null; onSelect: (country: CountryEntry) => void; placeholder?: string; testId?: string }) {
  const [open, setOpen] = useState(false);
  const selected = selectedCode ? COUNTRIES.find((c) => c.code === selectedCode) : null;
  return (
    <>
      <button
        type="button"
        data-testid={testId}
        onClick={() => setOpen(true)}
        style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#0e1930", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "14px", fontFamily: "inherit", cursor: "pointer", textAlign: "start" }}
      >
        {selected ? (
          <>
            <FlagIcon countryCode={selected.code} size={22} />
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selected.nameHe} <span style={{ color: COLOR.textSecondary }}>· {selected.nameEn}</span>
            </span>
          </>
        ) : (
          <span style={{ color: COLOR.textMuted, flex: 1 }}>{placeholder}</span>
        )}
        <ChevronDown />
      </button>
      {open ? (
        <CountryPickerSheet
          onClose={() => setOpen(false)}
          onSelect={(c) => {
            onSelect(c);
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

export function CountryPickerSheet({ onClose, onSelect }: { onClose: () => void; onSelect: (country: CountryEntry) => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => normalize(c.nameHe).includes(q) || normalize(c.nameEn).includes(q) || normalize(c.code).includes(q) || normalize(c.currencyCodes[0] ?? "").includes(q));
  }, [query]);
  return (
    <PickerSheet title="בחירת מדינה" onClose={onClose}>
      <SearchBox value={query} onChange={setQuery} placeholder="חיפוש מדינה בעברית או באנגלית..." />
      <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
        {results.length === 0 ? (
          <div style={{ fontSize: "13px", color: COLOR.textSecondary, padding: "16px 4px", textAlign: "center" }}>לא נמצאו מדינות תואמות</div>
        ) : (
          results.map((c) => (
            <button
              key={c.code}
              type="button"
              data-testid={`country-row-${c.code}`}
              onClick={() => onSelect(c)}
              style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 8px", borderRadius: "10px", background: "none", border: "none", color: "#fff", fontSize: "14px", cursor: "pointer", textAlign: "start" }}
            >
              <FlagIcon countryCode={c.code} size={24} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700 }}>{c.nameHe}</span>{" "}
                <span style={{ color: COLOR.textSecondary, fontSize: "12px" }}>{c.nameEn}</span>
              </span>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: COLOR.textSecondary, background: "rgba(255,255,255,0.06)", borderRadius: "999px", padding: "3px 8px" }}>{c.currencyCodes[0]}</span>
            </button>
          ))
        )}
      </div>
    </PickerSheet>
  );
}

// ============================== בחירת מטבע ==============================

export function CurrencyPickerButton({ selectedCode, onSelect, options, placeholder = "בחירת מטבע", testId }: { selectedCode: string | null; onSelect: (code: string) => void; options?: string[]; placeholder?: string; testId?: string }) {
  const [open, setOpen] = useState(false);
  const meta = selectedCode ? currencyMeta(selectedCode) : null;
  const country = selectedCode ? Object.values(COUNTRIES).find((c) => c.currencyCodes[0] === selectedCode) : null;
  return (
    <>
      <button
        type="button"
        data-testid={testId}
        onClick={() => setOpen(true)}
        style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#0e1930", border: `1px solid ${COLOR.cardBorder}`, color: "#fff", fontSize: "14px", fontFamily: "inherit", cursor: "pointer", textAlign: "start" }}
      >
        {meta ? (
          <>
            {country ? <FlagIcon countryCode={country.code} size={22} /> : <span style={{ width: "22px", textAlign: "center" }}>{meta.symbol}</span>}
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {meta.code} <span style={{ color: COLOR.textSecondary }}>· {meta.name}</span>
            </span>
          </>
        ) : (
          <span style={{ color: COLOR.textMuted, flex: 1 }}>{placeholder}</span>
        )}
        <ChevronDown />
      </button>
      {open ? (
        <CurrencyPickerSheet
          options={options}
          onClose={() => setOpen(false)}
          onSelect={(code) => {
            onSelect(code);
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

export function CurrencyPickerSheet({ onClose, onSelect, options }: { onClose: () => void; onSelect: (code: string) => void; options?: string[] }) {
  const [query, setQuery] = useState("");
  const allCodes = options ?? Object.keys(CURRENCY_META).filter((c) => CURRENCY_META[c]?.code === c);
  const uniqueCodes = Array.from(new Set(allCodes));
  const results = useMemo(() => {
    const q = normalize(query);
    const list = uniqueCodes
      .map((code) => ({ code, meta: currencyMeta(code), country: Object.values(COUNTRIES).find((c) => c.currencyCodes[0] === code) }))
      .filter((row) => !q || normalize(row.code).includes(q) || normalize(row.meta.name).includes(q) || (row.country && (normalize(row.country.nameHe).includes(q) || normalize(row.country.nameEn).includes(q))));
    return list.sort((a, b) => a.code.localeCompare(b.code));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, options?.join(",")]);
  return (
    <PickerSheet title="בחירת מטבע" onClose={onClose}>
      <SearchBox value={query} onChange={setQuery} placeholder="חיפוש מטבע לפי קוד, שם או מדינה..." />
      <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
        {results.length === 0 ? (
          <div style={{ fontSize: "13px", color: COLOR.textSecondary, padding: "16px 4px", textAlign: "center" }}>לא נמצאו מטבעות תואמים</div>
        ) : (
          results.map(({ code, meta, country }) => (
            <button
              key={code}
              type="button"
              data-testid={`currency-row-${code}`}
              onClick={() => onSelect(code)}
              style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 8px", borderRadius: "10px", background: "none", border: "none", color: "#fff", fontSize: "14px", cursor: "pointer", textAlign: "start" }}
            >
              {country ? <FlagIcon countryCode={country.code} size={24} /> : <span style={{ width: "24px", textAlign: "center", fontSize: "16px" }}>{meta.symbol}</span>}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700 }}>{code}</span> <span style={{ color: COLOR.textSecondary, fontSize: "12px" }}>{meta.name}</span>
              </span>
              <span style={{ fontSize: "13px", color: COLOR.textSecondary }}>{meta.symbol}</span>
            </button>
          ))
        )}
      </div>
    </PickerSheet>
  );
}

// ============================== הוספת מטבע (לפי מדינה או לפי מטבע) ==============================

export function AddCurrencySheet({ existingCodes, onClose, onAdd }: { existingCodes: string[]; onClose: () => void; onAdd: (code: string) => void }) {
  const [mode, setMode] = useState<"country" | "currency">("country");
  const [query, setQuery] = useState("");
  const [altFor, setAltFor] = useState<CountryEntry | null>(null);

  const countryResults = useMemo(() => {
    const q = normalize(query);
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => normalize(c.nameHe).includes(q) || normalize(c.nameEn).includes(q) || normalize(c.code).includes(q));
  }, [query]);
  const currencyCodesAll = Array.from(new Set(Object.keys(CURRENCY_META).map((k) => CURRENCY_META[k]!.code)));
  const currencyResults = useMemo(() => {
    const q = normalize(query);
    return currencyCodesAll
      .map((code) => ({ code, meta: currencyMeta(code), country: COUNTRIES.find((c) => c.currencyCodes[0] === code) }))
      .filter((row) => !q || normalize(row.code).includes(q) || normalize(row.meta.name).includes(q))
      .sort((a, b) => a.code.localeCompare(b.code));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  if (altFor) {
    return (
      <PickerSheet title={`ל${altFor.nameHe} יש כמה מטבעות רשמיים — איזה להוסיף?`} onClose={onClose}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {altFor.currencyCodes.map((code) => {
            const already = existingCodes.includes(code);
            const meta = currencyMeta(code);
            return (
              <button
                key={code}
                type="button"
                disabled={already}
                data-testid={`currency-row-${code}`}
                onClick={() => onAdd(code)}
                style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "12px 10px", borderRadius: "10px", background: already ? "rgba(255,255,255,0.03)" : "#0e1930", border: `1px solid ${COLOR.cardBorder}`, color: already ? COLOR.textMuted : "#fff", fontSize: "14px", fontWeight: 700, cursor: already ? "default" : "pointer", textAlign: "start" }}
              >
                <FlagIcon countryCode={altFor.code} size={22} />
                {code} — {meta.name} {already ? "(כבר בארנק)" : ""}
              </button>
            );
          })}
        </div>
      </PickerSheet>
    );
  }

  return (
    <PickerSheet title="הוספת מטבע" onClose={onClose}>
      <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexShrink: 0 }}>
        {(["country", "currency"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setQuery("");
            }}
            style={{ flex: 1, padding: "8px", borderRadius: "10px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", background: mode === m ? COLOR.purple : "rgba(255,255,255,0.06)", border: `1px solid ${mode === m ? COLOR.purple : COLOR.cardBorder}`, color: "#fff" }}
          >
            {m === "country" ? "לפי מדינה" : "לפי מטבע ישירות"}
          </button>
        ))}
      </div>
      <SearchBox value={query} onChange={setQuery} placeholder={mode === "country" ? "חיפוש מדינה בעברית או באנגלית..." : "חיפוש מטבע לפי קוד או שם..."} />
      <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
        {mode === "country"
          ? countryResults.map((c) => {
              const already = c.currencyCodes.length === 1 && existingCodes.includes(c.currencyCodes[0]!);
              return (
                <button
                  key={c.code}
                  type="button"
                  disabled={already}
                  data-testid={`country-row-${c.code}`}
                  onClick={() => (c.currencyCodes.length > 1 ? setAltFor(c) : onAdd(c.currencyCodes[0]!))}
                  style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 8px", borderRadius: "10px", background: "none", border: "none", color: already ? COLOR.textMuted : "#fff", fontSize: "14px", cursor: already ? "default" : "pointer", textAlign: "start" }}
                >
                  <FlagIcon countryCode={c.code} size={24} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700 }}>{c.nameHe}</span> <span style={{ color: COLOR.textSecondary, fontSize: "12px" }}>{c.nameEn}</span>
                  </span>
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: COLOR.textSecondary, background: "rgba(255,255,255,0.06)", borderRadius: "999px", padding: "3px 8px" }}>
                    {already ? "נוסף" : c.currencyCodes.join(" / ")}
                  </span>
                </button>
              );
            })
          : currencyResults.map(({ code, meta, country }) => {
              const already = existingCodes.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  disabled={already}
                  data-testid={`currency-row-${code}`}
                  onClick={() => onAdd(code)}
                  style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 8px", borderRadius: "10px", background: "none", border: "none", color: already ? COLOR.textMuted : "#fff", fontSize: "14px", cursor: already ? "default" : "pointer", textAlign: "start" }}
                >
                  {country ? <FlagIcon countryCode={country.code} size={24} /> : <span style={{ width: "24px", textAlign: "center" }}>{meta.symbol}</span>}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700 }}>{code}</span> <span style={{ color: COLOR.textSecondary, fontSize: "12px" }}>{meta.name}</span>
                  </span>
                  {already ? <span style={{ fontSize: "11px", color: COLOR.textMuted }}>נוסף</span> : null}
                </button>
              );
            })}
      </div>
    </PickerSheet>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLOR.textSecondary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
