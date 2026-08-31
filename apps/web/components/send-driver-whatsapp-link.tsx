import type { Flight, TransportBooking } from "@travel-app/shared-types";
import { buildDriverWhatsAppMessage } from "@/lib/driver-whatsapp-message";

// קישור wa.me ממוען לנהג הספציפי (לא שיתוף-כללי כמו WhatsAppShareLink) — לא API
// בתשלום, לא דורש מפתח. אותו כפתור משמש גם לשליחה ראשונית וגם לעדכון-שינוי:
// ההודעה תמיד נבנית מהמצב הנוכחי בפועל של ההסעה (ר' driver-whatsapp-message.ts).
export function SendDriverWhatsAppLink({
  transportBooking,
  linkedFlight,
}: {
  transportBooking: Pick<TransportBooking, "mode" | "pickupText" | "dropoffText" | "pickupAt" | "pickupTimezone" | "phone" | "whatsapp">;
  linkedFlight: Pick<Flight, "airline" | "flightNumber" | "arrivalAt" | "arrivalTimezone" | "liveStatus" | "liveDelayMinutes"> | null;
}) {
  const target = transportBooking.whatsapp || transportBooking.phone;
  if (!target) return null;

  const phone = target.replace(/\D/g, "");
  const text = buildDriverWhatsAppMessage({ transportBooking, linkedFlight });
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.25rem 0.625rem",
        borderRadius: "var(--radius-full)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        color: "var(--color-text-primary)",
        textDecoration: "none",
        fontSize: "0.75rem",
        fontWeight: 600,
      }}
    >
      💬 שלח פרטי איסוף לנהג
    </a>
  );
}
