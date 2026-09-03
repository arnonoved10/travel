/**
 * אחסון תמונות (קבלות/מסמכים/תמונת-פרופיל) ב-IndexedDB במקום localStorage —
 * לפי בקשה מפורשת: "תדאג שלא יחסר מקום". ל-localStorage מכסה קטנה (כמה
 * מגה-בייט בלבד) וזו הייתה סיבה אמיתית לכשלי-שמירה בפועל (ר' ההערה ב-
 * wallet-data.ts על saveJSON) — ל-IndexedDB מכסה גדולה בהרבה בכל דפדפן.
 * חנות-אובייקטים אחת בלבד, מפתוחה לפי מזהה-מחרוזת: כל גישה כאן היא בדיוק
 * חיפוש-נקודתי לפי מזהה כבר-ייחודי-גלובלית (nextId("rcpt"/"doc"), או
 * PROFILE_PHOTO_ID הקבוע לתמונת-הפרופיל) — לא סריקת-טווח/אינדקס — ולכן אין
 * תועלת בכמה חנויות נפרדות.
 */

const DB_NAME = "design-preview-images-v1";
const DB_VERSION = 1;
const STORE = "images";

export const PROFILE_PHOTO_ID = "profile-photo";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function putImage(id: string, dataUrl: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataUrl, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** לא זורקת לעולם — קריאה חסרה או כשל-אמיתי כאחד מחזירים null, כדי שכל
 * נקודת-תצוגה (שכבר יודעת להציג אייקון-ברירת-מחדל כשאין תמונה) תתנהג
 * זהה בשני המקרים, בלי try/catch בכל מקום-שימוש. */
export async function getImage(id: string): Promise<string | null> {
  try {
    const db = await openDB();
    return await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteImage(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteImages(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const id of ids) store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllImages(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
