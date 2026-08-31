import Link from "next/link";
import { Bed, CaretLeft } from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";

function formatNightLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "short", weekday: "short" });
}

/** רשימת-תאריכים כצ'יפים לחיצים — לא עוד שורת-אזהרה שטוחה בתוך רשימת-חוסרים
 * כללית (בקשת משתמש: "זה בכלל לא יפה, תעשה משהו יפה יותר, ואפשרות לבחור
 * ישירות משם בלחיצה על התאריך"). לחיצה על תאריך עוברת ישירות למסך-היום שלו —
 * שם כבר יש "הוסף משהו ליום הזה", אז אין צורך במנגנון-הוספה נפרד כאן, רק
 * ניווט לנקודה הנכונה. icon/label אופציונליים כדי לשרת גם "לילות בלי מלון"
 * וגם "ימים בלי תוכנית" (דשבורד) מאותו רכיב, בלי לשכפל את ה-JSX. */
export function NoHotelNightsList({
  tripId,
  nights,
  icon: IconComponent = Bed,
  label = "לילות בלי מלון רשום",
}: {
  tripId: string;
  nights: string[];
  icon?: Icon;
  label?: string;
}) {
  if (nights.length === 0) return null;

  const chips = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {nights.map((night) => (
        <Link
          key={night}
          href={`/trips/${tripId}/days/${night}`}
          className="ui-card-interactive"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "var(--radius-full)",
            border: "1px solid color-mix(in srgb, var(--color-warning) 40%, var(--color-border))",
            background: "color-mix(in srgb, var(--color-warning) 12%, var(--color-surface))",
            color: "var(--color-text-primary)",
            textDecoration: "none",
            font: "var(--text-caption)",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {formatNightLabel(night)}
          <CaretLeft size={12} weight="bold" aria-hidden style={{ color: "var(--color-warning)" }} />
        </Link>
      ))}
    </div>
  );

  const heading = (
    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", font: "var(--text-caption)", fontWeight: 700, color: "var(--color-warning)" }}>
      <IconComponent size={16} weight="fill" aria-hidden />
      {label} ({nights.length})
    </span>
  );

  // רשימה קצרה (עד 3) — מוצגת ישירות, בלי לחיצת-פתיחה מיותרת לדבר קטן. מעבר
  // לזה — <details> סגור-בברירת-מחדל עם סיכום קצר ("הצג הכל"), אותה קונבנציה
  // בדיוק כמו שאר האקורדיונים באפליקציה (ר' trips/[tripId]/page.tsx). כך
  // רשימה ארוכה לא תופסת עמוד שלם בדשבורד (בקשת משתמש: "סיכום קצר עם כפתור
  // לפתיחת הרשימה המלאה").
  if (nights.length <= 3) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {heading}
        {chips}
      </div>
    );
  }

  return (
    <details>
      <summary style={{ cursor: "pointer", listStyle: "none" }}>
        {heading}
        <span style={{ font: "var(--text-caption)", color: "var(--color-text-muted)", marginInlineStart: "1.5rem" }}>הצג הכל ←</span>
      </summary>
      <div style={{ marginTop: "0.625rem" }}>{chips}</div>
    </details>
  );
}
