import { getCurrencyRateProvider } from "@travel-app/data-layer";
import { currencyFlagEmoji } from "@/lib/country-flags";

/**
 * שערי-חליפין חיים (בקשת משתמש: "המערכת חייבת להביא און-ליין מהאינטרנט
 * מה השער העדכני"). משתמש באותו CurrencyRateProvider שכבר קיים בכל שאר
 * המערכת (ממיר-מהיר/ארנק/דוח) — בנק ישראל + Frankfurter (ECB), בלי מפתח
 * API, בלי שער-מומצא: מטבע שאף מקור לא פתר לו שער פשוט לא מוצג. "חי"
 * כאן אומר "נשלף מהאינטרנט בכל טעינת העמוד", לא Push בזמן-אמת — שני
 * המקורות מתעדכנים פעם ביום, לא כל שנייה כמו בבורסה.
 */
export async function ExchangeRatesCard({ currencyCodes }: { currencyCodes: string[] }) {
  const provider = getCurrencyRateProvider();
  const rates = await provider.getRatesToILS(currencyCodes);
  const rateByCode = new Map(rates.map((r) => [r.currencyCode, r]));

  if (rates.length === 0) {
    return <p style={mutedStyle}>אין כרגע שערי חליפין זמינים (בעיית רשת?) — נסה לרענן את העמוד.</p>;
  }

  const asOf = rates[0]?.asOf;

  // רשת קומפקטית 2x2 (לפי המוקאפ) — בלי אחוז-שינוי יומי: אין לנו מקור נתוני-
  // שער-קודם (BoiFrankfurterProvider מחזיר רק שער-נוכחי, ר' currency-rate/),
  // אז אין "1.2%↑" מומצא כאן, בניגוד למוקאפ — רק השער העדכני עצמו, אמיתי.
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
        {currencyCodes.slice(0, 4).map((code) => {
          const flag = currencyFlagEmoji(code);
          const rate = rateByCode.get(code);
          return (
            <div key={code} style={tileStyle}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                {flag ? <span style={{ fontSize: "1.25rem" }} aria-hidden>{flag}</span> : null}
                <span style={{ font: "var(--text-caption)", fontWeight: 700 }}>{code} / ₪</span>
              </span>
              {rate ? (
                <span style={{ ...numericStyle, fontWeight: 800, fontSize: "1.0625rem" }}>{rate.rateToILS.toFixed(4)}</span>
              ) : (
                <span style={mutedStyle}>אין שער זמין</span>
              )}
            </div>
          );
        })}
      </div>
      <p style={mutedStyle}>מקור: בנק ישראל / ECB (Frankfurter) · נשלף עכשיו מהאינטרנט{asOf ? ` · תאריך השער: ${asOf}` : ""}</p>
    </div>
  );
}

const tileStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.375rem",
  padding: "0.625rem 0.75rem",
  borderRadius: "var(--radius-md)",
  background: "var(--color-surface-elevated)",
  border: "1px solid var(--color-border)",
};

const mutedStyle: React.CSSProperties = { color: "var(--color-text-muted)", font: "var(--text-caption)", margin: 0 };
const numericStyle: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };
