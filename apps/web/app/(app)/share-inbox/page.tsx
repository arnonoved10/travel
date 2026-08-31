import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getSharedInboxRepository } from "@travel-app/data-layer";
import { DiscardSharedItemButton } from "./discard-shared-item-button";

export const dynamic = "force-dynamic";

export default async function ShareInboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sharedInboxRepository = await getSharedInboxRepository();
  const items = await sharedInboxRepository.listPending({ userId: user.id });

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>תיבת שיתופים</h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        קיבלת אישור-הזמנה במייל (מלון/טיסה/הסעה/אטרקציה/ביטוח)? מהאפליקציה שבה קיבלת אותו לחצו &quot;שתף&quot; ובחרו במערכת
        הזו — הפריט יגיע לכאן, ומכאן משייכים אותו להזמנה המתאימה. <b>דורש שהאפליקציה מותקנת</b> ל-Home Screen (Add to Home
        Screen) כדי שתופיע ברשימת השיתוף של הטלפון.
      </p>

      {items.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>אין כרגע פריטים ממתינים לשיוך.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {items.map((item) => (
            <li
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                background: "var(--color-surface)",
              }}
            >
              <Link href={`/share-inbox/${item.id}`} style={{ display: "flex", gap: "0.75rem", alignItems: "center", flex: 1, textDecoration: "none", color: "inherit" }}>
                {item.fileUrl && item.mimeType?.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element -- data: URI ב-Mock
                  <img src={item.fileUrl} alt="" style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "6px" }} />
                ) : (
                  <span style={{ fontSize: "1.5rem" }}>{item.fileUrl ? "📎" : "🔗"}</span>
                )}
                <div>
                  <div style={{ fontWeight: 600 }}>{item.sharedTitle ?? item.fileName ?? "פריט משותף"}</div>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>{new Date(item.createdAt).toLocaleString("he-IL")}</div>
                </div>
              </Link>
              <DiscardSharedItemButton itemId={item.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
