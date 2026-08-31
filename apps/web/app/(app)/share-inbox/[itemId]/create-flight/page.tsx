import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSharedInboxRepository, getTripRepository } from "@travel-app/data-layer";
import { getOcrProvider } from "@/lib/ocr/get-ocr-provider";
import { mapExtractedFieldsToFlightPrefill, type FlightPrefill } from "@/lib/ocr/map-extracted-fields";
import { CreateFlightFromScanForm } from "./create-flight-from-scan-form";

export const dynamic = "force-dynamic";

export default async function CreateFlightFromSharedItemPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sharedInboxRepository = await getSharedInboxRepository();
  const item = await sharedInboxRepository.getById({ userId: user.id, itemId });
  if (!item?.fileUrl) notFound();

  const tripRepository = await getTripRepository();
  const trips = await tripRepository.list({ userId: user.id });

  let prefill: FlightPrefill = { airline: undefined, flightNumber: undefined };
  let ocrError: string | null = null;
  try {
    const base64 = item.fileUrl.replace(/^data:[^;]+;base64,/, "");
    const result = await getOcrProvider().extractFields({ imageBase64: base64, mimeType: item.mimeType ?? "image/jpeg" });
    if (result.ok) {
      prefill = mapExtractedFieldsToFlightPrefill(result.fields);
    } else {
      ocrError = result.error ?? "קריאת המסמך נכשלה.";
    }
  } catch {
    ocrError = "קריאת המסמך נכשלה.";
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>יצירת הזמנת טיסה מהתמונה</h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        השדות שזוהו בתמונה מולאו-מראש — בדוק אותם לפני השמירה. שדות שלא זוהו נשארו ריקים בכוונה, לא הומצא להם ערך.
      </p>
      {ocrError ? <p style={{ color: "var(--color-danger)", fontSize: "0.875rem" }}>{ocrError} אפשר עדיין למלא ידנית.</p> : null}

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        {item.mimeType?.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element -- data: URI ב-Mock, לא ניתן ל-next/image לאופטימיזציה
          <img src={item.fileUrl} alt="תצוגה מקדימה" style={{ width: "160px", height: "160px", objectFit: "cover", borderRadius: "8px" }} />
        ) : null}
        <CreateFlightFromScanForm itemId={item.id} trips={trips.map((t) => ({ id: t.id, name: t.name }))} prefill={prefill} />
      </div>
    </div>
  );
}
