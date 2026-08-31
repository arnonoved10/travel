"use client";

// כפתור הדפסה גנרי — משמש בכל מסך שרוצים לאפשר לו "Print"/"Save as PDF"
// (הדפדפן עצמו יודע לשמור כ-PDF מתוך דיאלוג ההדפסה, אין צורך בספריית PDF
// נפרדת לצורך הזה). לפני ההדפסה פותח זמנית את כל אלמנטי <details> הסגורים
// בעמוד (BookingGroup וכו') כדי שהתוכן שבתוכם באמת יודפס, לא רק הכותרת —
// ומחזיר אותם למצב הקודם אחרי ההדפסה (אירוע afterprint).
export function PrintButton({ label = "🖨️ הדפס / שמור כ-PDF" }: { label?: string }) {
  function handlePrint() {
    const detailsElements = Array.from(document.querySelectorAll<HTMLDetailsElement>("details"));
    const previouslyClosed = detailsElements.filter((d) => !d.open);
    previouslyClosed.forEach((d) => {
      d.open = true;
    });

    const restore = () => {
      previouslyClosed.forEach((d) => {
        d.open = false;
      });
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);

    window.print();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="no-print"
      style={{
        padding: "0.5rem 0.875rem",
        borderRadius: "var(--radius-full)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        color: "var(--color-text-primary)",
        cursor: "pointer",
        fontSize: "0.8125rem",
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}
