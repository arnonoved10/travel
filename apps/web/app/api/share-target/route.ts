import { NextResponse } from "next/server";
import { getSharedInboxRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logger } from "@/lib/logger";

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // אותה מגבלה כמו uploadDocumentAction — data: URI ב-Mock, לא Storage אמיתי

// יעד ה-share_target שב-manifest.json (ראה שם) — הדפדפן/מערכת-ההפעלה שולחים
// לכאן POST כשמשתמשים בכפתור "שתף" הטבעי בטלפון (למשל מתוך Gmail) ובוחרים
// באפליקציה הזו. עדיין לא ידוע לאיזה טיול/הזמנה זה שייך — כל קובץ/טקסט
// ששותף נשמר כ-SharedInboxItem זמני, והמשתמש משייך אותו בעצמו ב-/share-inbox.
// חייב להחזיר redirect (לא JSON) כדי שהניווט בדפדפן/PWA יתקדם כראוי.
export async function POST(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const formData = await request.formData();
  const title = readText(formData, "title");
  const text = readText(formData, "text");
  const url = readText(formData, "url");
  const files = formData.getAll("file").filter((value): value is File => value instanceof File && value.size > 0);

  const sharedInboxRepository = await getSharedInboxRepository();
  const createdIds: string[] = [];

  if (files.length === 0) {
    // שיתוף טקסט/קישור בלבד (בלי צילום-מסך/קובץ) — עדיין נקלט, המסך הבא יסביר
    // שאי-אפשר להפוך את זה למסמך בלי קובץ מצורף.
    if (title || text || url) {
      const item = await sharedInboxRepository.create({ userId: user.id, input: { sharedTitle: title, sharedText: text, sharedUrl: url } });
      createdIds.push(item.id);
    }
  } else {
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileUrl = `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
      const item = await sharedInboxRepository.create({
        userId: user.id,
        input: { fileUrl, fileName: file.name || undefined, mimeType: file.type || undefined, sharedTitle: title, sharedText: text, sharedUrl: url },
      });
      createdIds.push(item.id);
    }
  }

  logger.info("shared inbox item(s) received", { userId: user.id, count: createdIds.length });

  const destination = createdIds.length === 1 ? `/share-inbox/${createdIds[0]}` : "/share-inbox";
  return NextResponse.redirect(new URL(destination, request.url), 303);
}

function readText(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}
