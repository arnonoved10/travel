import ExcelJS from "exceljs";

export interface XlsxSheetData {
  name: string;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
}

const MAX_SHEET_NAME_LENGTH = 31; // מגבלת-Excel קשיחה, לא בחירה שלנו

/** אקסל אמיתי (.xlsx) — קובץ בינארי מפורמט, לא CSV עם BOM. כל sheet מקבל
 * שורת-כותרות מודגשת ורוחב-עמודה אוטומטי-בקירוב. עובד גם בדפדפן (exceljs
 * תומך בסביבת דפדפן, לא רק Node) כדי שלא צריך round-trip לשרת. */
export async function buildXlsxWorkbook(sheets: XlsxSheetData[]): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Trip Master";
  workbook.created = new Date();

  const usedNames = new Set<string>();
  for (const sheet of sheets) {
    let name = sheet.name.slice(0, MAX_SHEET_NAME_LENGTH).replace(/[[\]*/\\?:]/g, " ");
    let suffix = 2;
    while (usedNames.has(name)) {
      const base = sheet.name.slice(0, MAX_SHEET_NAME_LENGTH - 3);
      name = `${base} ${suffix}`;
      suffix += 1;
    }
    usedNames.add(name);

    const worksheet = workbook.addWorksheet(name, { views: [{ rightToLeft: true }] });
    worksheet.columns = sheet.headers.map((header) => ({
      header,
      key: header,
      width: Math.min(40, Math.max(10, header.length + 4)),
    }));
    worksheet.getRow(1).font = { bold: true };
    for (const row of sheet.rows) {
      worksheet.addRow(row.map((cell) => cell ?? ""));
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
