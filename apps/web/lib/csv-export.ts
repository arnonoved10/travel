// בניית CSV גנרית — Excel פותח CSV UTF-8 (עם BOM) בלי בעיה, אז זה גם מכסה
// בפועל את "Excel" (#83) בלי צורך בספריית xlsx נפרדת לצורך הבסיסי הזה.
// ראה IMPLEMENTATION_GAPS.md P0 סעיף 13 (Export).
function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const lines = [headers.map(escapeCsvCell).join(","), ...rows.map((row) => row.map(escapeCsvCell).join(","))];
  return "﻿" + lines.join("\r\n"); // BOM — כדי ש-Excel יזהה UTF-8 נכון (בלי זה עברית נשברת)
}
