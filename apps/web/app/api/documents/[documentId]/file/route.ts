import { NextResponse } from "next/server";
import { getDocumentRepository, getPlaceRepository, getTripRepository } from "@travel-app/data-layer";
import { getCurrentUser } from "@/lib/auth/get-current-user";

// פרוקסי-שרת מאומת לצפייה במסמכים (Document.fileUrl מצביע לכאן ב-DATA_SOURCE=prisma,
// ר' ההערה ב-document-repository.prisma.ts) — אותו עיקרון בדיוק כמו api/places-photo:
// ה-bucket ב-Supabase Storage פרטי לגמרי, כל בקשה מאמתת בעלות (טיול או מקום, לפי
// entityType) ורק אז מייצרת קישור-חתום זמני. במצב Mock, Document.fileUrl הוא כבר
// data: URI שמיש ישירות — הנתיב הזה כלל לא נקרא.
async function assertOwnership(userId: string, document: { tripId: string | null; entityType: string; entityId: string }): Promise<boolean> {
  if (document.tripId) {
    const tripRepository = await getTripRepository();
    const trip = await tripRepository.getById({ userId, tripId: document.tripId });
    return trip !== null;
  }
  if (document.entityType === "place") {
    const placeRepository = await getPlaceRepository();
    const place = await placeRepository.getById({ userId, placeId: document.entityId });
    return place !== null;
  }
  return false;
}

export async function GET(_request: Request, context: { params: Promise<{ documentId: string }> }): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { documentId } = await context.params;
  const documentRepository = await getDocumentRepository();
  const document = await documentRepository.getById({ documentId });
  if (!document) return new Response("Not found", { status: 404 });

  const owned = await assertOwnership(user.id, document);
  if (!owned) return new Response("Not found", { status: 404 });

  try {
    const signedUrl = await documentRepository.getSignedFileUrl({ documentId });
    if (!signedUrl) return new Response("Not found", { status: 404 });
    return NextResponse.redirect(signedUrl, 307);
  } catch {
    return new Response("File not available", { status: 502 });
  }
}
