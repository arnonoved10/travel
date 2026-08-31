import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { XlsxSheetData } from "./xlsx-export";

const HEBREW_FONT_NAME = "NotoSansHebrew";
const REGULAR_FONT_URL = "/fonts/NotoSansHebrew-Regular.ttf";
const BOLD_FONT_URL = "/fonts/NotoSansHebrew-Bold.ttf";

async function fetchFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`לא ניתן היה לטעון את הפונט (${url}): ${response.status}`);
  const buffer = await response.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

/** רושם את Noto Sans Hebrew (SIL OFL, קבצים ב-public/fonts/) ב-jsPDF — בלי זה
 * jsPDF יודע לצייר רק את 14 הפונטים הסטנדרטיים של PDF (לטיניים בלבד), ועברית
 * הייתה יוצאת ריבועים ריקים. נטען פעם אחת בלבד (lazy, רק כשבאמת מייצאים PDF). */
async function registerHebrewFont(doc: jsPDF): Promise<void> {
  const [regular, bold] = await Promise.all([fetchFontAsBase64(REGULAR_FONT_URL), fetchFontAsBase64(BOLD_FONT_URL)]);
  doc.addFileToVFS("NotoSansHebrew-Regular.ttf", regular);
  doc.addFont("NotoSansHebrew-Regular.ttf", HEBREW_FONT_NAME, "normal");
  doc.addFileToVFS("NotoSansHebrew-Bold.ttf", bold);
  doc.addFont("NotoSansHebrew-Bold.ttf", HEBREW_FONT_NAME, "bold");
}

/** autoTable מצייר עמודות משמאל-לימין לפי סדר המערך, בלי מודעות RTL משלו —
 * היפוך סדר העמודות (וכל תא בשורה, באותו סדר) הוא מה שהופך "עמודה ראשונה
 * במערך" ל"עמודה ימנית ביותר על הדף", כלומר קריאה עברית טבעית מימין לשמאל. */
function toRtlColumnOrder<T>(cells: T[]): T[] {
  return [...cells].reverse();
}

/** מסמך PDF אמיתי (טקסט אמיתי וניתן-לחיפוש, לא תמונה) עם עברית תקינה —
 * כותרת-מסמך + טבלה אחת פר-sheet, אותו headers/rows בדיוק כמו buildXlsxWorkbook
 * כדי ששני הייצואים תמיד יציגו את אותו מידע. */
export async function buildPdfDocument(sheets: XlsxSheetData[], title: string): Promise<Uint8Array> {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  await registerHebrewFont(doc);
  doc.setFont(HEBREW_FONT_NAME, "normal");
  doc.setR2L(true);

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginRight = pageWidth - 40;
  let cursorY = 50;

  doc.setFont(HEBREW_FONT_NAME, "bold");
  doc.setFontSize(16);
  doc.text(title, marginRight, cursorY, { align: "right" });
  cursorY += 12;
  doc.setFontSize(9);
  doc.setFont(HEBREW_FONT_NAME, "normal");
  doc.text(new Date().toLocaleDateString("he-IL"), marginRight, cursorY, { align: "right" });
  cursorY += 20;

  for (const sheet of sheets) {
    doc.setFont(HEBREW_FONT_NAME, "bold");
    doc.setFontSize(12);
    doc.text(sheet.name, marginRight, cursorY, { align: "right" });
    cursorY += 8;

    autoTable(doc, {
      startY: cursorY,
      head: [toRtlColumnOrder(sheet.headers)],
      body: sheet.rows.map((row) => toRtlColumnOrder(row.map((cell) => (cell === null || cell === undefined ? "" : String(cell))))),
      styles: { font: HEBREW_FONT_NAME, fontStyle: "normal", halign: "right", fontSize: 9 },
      headStyles: { font: HEBREW_FONT_NAME, fontStyle: "bold", halign: "right" },
      margin: { left: 40, right: 40 },
      theme: "grid",
    });

    // autoTable מקדם את lastAutoTable.finalY אחרי כל טבלה — משמש כנקודת-פתיחה לבאה.
    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
    if (cursorY > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      cursorY = 50;
    }
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
