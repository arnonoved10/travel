import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Bucket פרטי (לא ציבורי) — נוצר ידנית מראש ב-Supabase Storage. מסמכים כאן
// עלולים לכלול עותקי-דרכון/פוליסות-ביטוח, אז אין URL ציבורי-קבוע: כל צפייה
// עוברת דרך apps/web/app/api/documents/[documentId]/file/route.ts, שמאמת
// בעלות ואז יוצר קישור-חתום זמני. ר' ההערה המקבילה ב-document-repository.prisma.ts.
const DOCUMENT_BUCKET = "documents";
const SIGNED_URL_TTL_SECONDS = 300; // 5 דקות — מספיק להצגה מיידית; ה-proxy route יוצר קישור טרי בכל בקשה

function getStorageClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY חסרים — נדרשים להעלאת מסמכים ל-Supabase Storage");
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function parseDataUri(dataUri: string): { bytes: Buffer; contentType: string } {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUri);
  if (!match) throw new Error("fileUrl אינו data: URI תקין (base64) — לא ניתן להעלות ל-Storage");
  return { contentType: match[1]!, bytes: Buffer.from(match[2]!, "base64") };
}

function buildStoragePath({ entityType, entityId, fileName }: { entityType: string; entityId: string; fileName?: string | null }): string {
  const safeName = (fileName ?? "file").replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-80);
  return `${entityType}/${entityId}/${randomUUID()}-${safeName}`;
}

/** מעלה data: URI (base64, כמו שנבנה כבר ב-uploadDocumentAction/api/share-target)
 * ל-Storage האמיתי ומחזיר את הנתיב הפנימי שנשמר (לא URL — ר' ההערה למעלה). */
export async function uploadDocumentToStorage({
  dataUri,
  entityType,
  entityId,
  fileName,
}: {
  dataUri: string;
  entityType: string;
  entityId: string;
  fileName?: string | null;
}): Promise<string> {
  const { bytes, contentType } = parseDataUri(dataUri);
  const path = buildStoragePath({ entityType, entityId, fileName });
  const client = getStorageClient();
  const { error } = await client.storage.from(DOCUMENT_BUCKET).upload(path, bytes, { contentType, upsert: false });
  if (error) throw new Error(`העלאה ל-Supabase Storage נכשלה: ${error.message}`);
  return path;
}

/** קישור-צפייה זמני וחתום לנתיב-Storage שכבר קיים — נקרא רק מה-proxy route
 * אחרי אימות בעלות, לעולם לא נחשף ישירות ללקוח כ-Document.fileUrl. */
export async function createSignedDocumentUrl(storagePath: string): Promise<string> {
  const client = getStorageClient();
  const { data, error } = await client.storage.from(DOCUMENT_BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  if (error || !data) throw new Error(`יצירת קישור חתום נכשלה: ${error?.message ?? "unknown error"}`);
  return data.signedUrl;
}

/** בייטים גולמיים ישירות מ-Storage (בלי round-trip דרך קישור-חתום+HTTP) —
 * לצריכה שרתית בלבד, למשל OCR (ר' ocr-actions.ts). */
export async function downloadDocumentFromStorage(storagePath: string): Promise<Buffer> {
  const client = getStorageClient();
  const { data, error } = await client.storage.from(DOCUMENT_BUCKET).download(storagePath);
  if (error || !data) throw new Error(`הורדה מ-Supabase Storage נכשלה: ${error?.message ?? "unknown error"}`);
  return Buffer.from(await data.arrayBuffer());
}
