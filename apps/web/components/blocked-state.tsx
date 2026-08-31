/**
 * מצבי שגיאה גנריים לשימוש חוזר — היו אד-הוק (טקסט מפוזר) בכל מקום שנוגע
 * בשירות חיצוני לא-מחובר או בהרשאת דפדפן שנדחתה. ר' #114 ב-FEATURE_AUDIT.md.
 */

export function BlockedIntegrationState({
  title,
  description,
  steps,
  footnote,
}: {
  title: string;
  description: string;
  steps?: React.ReactNode[];
  footnote?: string;
}) {
  return (
    <div
      style={{
        padding: "1.5rem",
        borderRadius: "var(--radius-lg, 10px)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        maxWidth: "640px",
      }}
    >
      <h2 style={{ margin: 0, fontSize: "1.0625rem" }}>🔌 {title}</h2>
      <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{description}</p>
      {steps && steps.length > 0 ? (
        <ol style={{ margin: 0, paddingInlineStart: "1.25rem", color: "var(--color-text-muted)", fontSize: "0.875rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          {steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      ) : null}
      {footnote ? <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.75rem" }}>{footnote}</p> : null}
    </div>
  );
}

/**
 * onRetry: מאפשר לנסות שוב בלי לרענן את העמוד — ברגע שהדפדפן דחה הרשאה
 * הפופאפ המקורי לא יחזור לעולם (per-origin, חד-פעמי), אבל קריאה טרייה
 * ל-getCurrentPosition() כן יכולה להצליח אם המשתמש התיר ידנית דרך הגדרות
 * האתר — לפני התיקון הזה לא הייתה שום דרך לנסות שוב בלי לצאת מהעמוד.
 * showInstructions: מוצג רק במצב "denied" בפועל (לא unsupported/error כלליים).
 */
export function PermissionDeniedState({
  message,
  onRetry,
  showInstructions = false,
}: {
  message: string;
  onRetry?: () => void;
  showInstructions?: boolean;
}) {
  return (
    <div
      style={{
        padding: "0.75rem 1rem",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-elevated)",
        color: "var(--color-text-muted)",
        fontSize: "0.8125rem",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      <span aria-hidden>🔒</span>
      <span style={{ flex: "1 1 200px" }}>
        {message}
        {showInstructions ? " לחצו על סמל המנעול בשורת הכתובת ← הרשאות אתר ← מיקום ← אפשר, ואז נסו שוב." : ""}
      </span>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="ui-btn-secondary" style={retryButtonStyle}>
          נסה שוב
        </button>
      ) : null}
    </div>
  );
}

const retryButtonStyle: React.CSSProperties = {
  minHeight: "2.25rem",
  padding: "0.3rem 0.75rem",
  borderRadius: "var(--radius-full)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-primary)",
  fontSize: "0.75rem",
  fontWeight: 600,
  cursor: "pointer",
};

/**
 * כפתור מפורש לבקשת מיקום — משמש עם useGeolocation() במקום useEffect אוטומטי
 * ב-mount, כדי לא "לשרוף" את בקשת-ההרשאה החד-פעמית של הדפדפן לפני שהמשתמש
 * הבין למה נשאל. ר' ההערה ב-lib/use-geolocation.ts.
 */
export function RequestLocationButton({ onRequest, label = "📍 אפשר גישה למיקום" }: { onRequest: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onRequest}
      className="ui-btn-secondary"
      style={{
        minHeight: "2.75rem",
        padding: "0.5rem 0.875rem",
        borderRadius: "var(--radius-full)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-elevated)",
        color: "var(--color-text-primary)",
        fontSize: "0.8125rem",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
