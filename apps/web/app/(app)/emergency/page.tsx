import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getBookingRepository, getContactRepository, getDocumentRepository, getTripPlaceRepository, getTripRepository } from "@travel-app/data-layer";
import { getEmergencyNumbersForCountry } from "@/lib/emergency-numbers";
import { CONTACT_CATEGORY_LABELS } from "@/lib/contact-labels";
import { EntityDocumentSection } from "../trips/[tripId]/documents/entity-document-section";
import { NearestMedical, type MedicalCandidate } from "./nearest-medical";
import { getActiveTrip } from "@/lib/active-trip";
import { resolveWeatherReferencePlace } from "@/lib/weather-reference-place";

export const dynamic = "force-dynamic";

const EMERGENCY_CONTACT_CATEGORIES = new Set(["insurance", "hotel", "driver", "taxi_company"]);

export default async function EmergencyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().slice(0, 10);
  const tripRepository = await getTripRepository();
  const allTrips = await tripRepository.list({ userId: user.id });
  const activeTripResult = getActiveTrip(allTrips, today);

  if (!activeTripResult) {
    return (
      <div>
        <h1 style={{ marginTop: 0 }}>🆘 חירום</h1>
        <p style={{ color: "var(--color-text-muted)" }}>אין טיול כרגע — מסך החירום מציג מידע לפי הטיול הפעיל/הקרוב.</p>
        <EmergencyNumbersCard country={null} />
      </div>
    );
  }
  const { trip: activeTrip, isUpcoming } = activeTripResult;

  const [bookingRepository, tripPlaceRepository, contactRepository, documentRepository] = await Promise.all([
    getBookingRepository(),
    getTripPlaceRepository(),
    getContactRepository(),
    getDocumentRepository(),
  ]);
  const [hotelStays, insurances, tripPlaces, contacts, tripDocuments] = await Promise.all([
    bookingRepository.listHotelStays({ tripId: activeTrip.id }),
    bookingRepository.listInsurances({ tripId: activeTrip.id }),
    tripPlaceRepository.listForTrip({ userId: user.id, tripId: activeTrip.id }),
    contactRepository.list({ userId: user.id }),
    documentRepository.listForTrip({ tripId: activeTrip.id }),
  ]);
  const passportDocuments = tripDocuments.filter((d) => d.entityType === "trip" && d.documentType === "passport_copy");

  const tonightHotel = hotelStays.find((h) => h.checkInDate <= today && today < h.checkOutDate);
  const activeInsurance = insurances.find((i) => i.startDate <= today && today <= i.endDate) ?? insurances[0];
  // מדינה: מקום מקושר, ובלעדיו מלון-ראשון-עם-קואורדינטות (ר' lib/weather-reference-place.ts)
  // — כדי שמספרי-חירום כבר יעבדו אחרי הזנת מלון בלבד, בלי קישור-מקום נפרד.
  const tripCountry = tripPlaces.find((tp) => tp.place.country)?.place.country ?? resolveWeatherReferencePlace(tripPlaces, hotelStays)?.country ?? null;
  const emergencyNumbers = getEmergencyNumbersForCountry(tripCountry);
  const emergencyContacts = contacts.filter((c) => c.category !== null && EMERGENCY_CONTACT_CATEGORIES.has(c.category));
  const medicalCandidates: MedicalCandidate[] = tripPlaces
    .filter((tp) => (tp.place.category === "hospital" || tp.place.category === "pharmacy") && tp.place.lat !== null && tp.place.lng !== null)
    .map((tp) => ({ placeId: tp.placeId, name: tp.place.name, category: tp.place.category, lat: tp.place.lat as number, lng: tp.place.lng as number }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h1 style={{ marginTop: 0, marginBottom: "0.25rem" }}>🆘 חירום</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          <Link href={`/trips/${activeTrip.id}`}>{activeTrip.name}</Link>
          {tripCountry ? ` · ${tripCountry}` : ""}
          {isUpcoming ? ` · מתחיל ב-${activeTrip.startDate}` : ""}
        </p>
      </div>

      <EmergencyNumbersCard country={tripCountry} />

      <Card title="ביטוח נסיעות">
        {activeInsurance ? (
          <div>
            <div style={{ fontWeight: 600 }}>{activeInsurance.company}</div>
            {activeInsurance.policyNumber ? <div style={mutedStyle}>פוליסה: {activeInsurance.policyNumber}</div> : null}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.375rem" }}>
              {activeInsurance.emergencyPhone ? (
                <a href={`tel:${activeInsurance.emergencyPhone}`} style={{ color: "var(--color-primary)" }}>
                  📞 {activeInsurance.emergencyPhone}
                </a>
              ) : null}
              {activeInsurance.emergencyWhatsapp ? (
                <a href={`https://wa.me/${activeInsurance.emergencyWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                  💬 WhatsApp: {activeInsurance.emergencyWhatsapp}
                </a>
              ) : null}
              {activeInsurance.emergencyEmail ? <a href={`mailto:${activeInsurance.emergencyEmail}`} style={{ color: "var(--color-primary)" }}>✉️ {activeInsurance.emergencyEmail}</a> : null}
            </div>
            {activeInsurance.emergencyInstructions ? <p style={{ ...mutedStyle, marginTop: "0.375rem" }}>{activeInsurance.emergencyInstructions}</p> : null}
            {!activeInsurance.emergencyPhone && !activeInsurance.emergencyWhatsapp && !activeInsurance.emergencyEmail ? (
              <p style={mutedStyle}>אין פרטי חירום שמורים לביטוח הזה עדיין.</p>
            ) : null}
          </div>
        ) : (
          <p style={mutedStyle}>אין ביטוח נסיעות רשום לטיול הזה.</p>
        )}
      </Card>

      <Card title="המלון הנוכחי">
        {tonightHotel ? (
          <div>
            <div style={{ fontWeight: 600 }}>{tonightHotel.hotelName}</div>
            {tonightHotel.address ? <div style={mutedStyle}>{tonightHotel.address}</div> : null}
            {tonightHotel.phone ? (
              <a href={`tel:${tonightHotel.phone}`} style={{ color: "var(--color-primary)" }}>
                📞 {tonightHotel.phone}
              </a>
            ) : (
              <p style={mutedStyle}>אין מספר טלפון שמור למלון הזה.</p>
            )}
          </div>
        ) : (
          <p style={mutedStyle}>אין מלון רשום להיום.</p>
        )}
      </Card>

      <Card title="אנשי קשר לחירום">
        {emergencyContacts.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {emergencyContacts.map((c) => (
              <li key={c.id}>
                <div style={{ fontWeight: 600 }}>
                  {c.name} <span style={mutedStyle}>({c.category ? (CONTACT_CATEGORY_LABELS[c.category] ?? c.category) : "אחר"})</span>
                </div>
                {c.phone ? (
                  <a href={`tel:${c.phone}`} style={{ color: "var(--color-primary)", fontSize: "0.875rem" }}>
                    📞 {c.phone}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p style={mutedStyle}>
            אין עדיין אנשי קשר בקטגוריות רלוונטיות (ביטוח/מלון/נהג/מוניות) —{" "}
            <Link href="/contacts/new" style={{ color: "var(--color-primary)" }}>
              הוסף איש קשר
            </Link>
            .
          </p>
        )}
      </Card>

      <Card title="בית חולים/מרקחת קרובים">
        <NearestMedical candidates={medicalCandidates} />
      </Card>

      <Card title="הערות רפואיות אישיות">
        {activeTrip.medicalNotes ? (
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{activeTrip.medicalNotes}</p>
        ) : (
          <p style={mutedStyle}>
            אין עדיין הערות רפואיות שמורות —{" "}
            <Link href={`/trips/${activeTrip.id}`} style={{ color: "var(--color-primary)" }}>
              אפשר להוסיף בעריכת הטיול
            </Link>
            .
          </p>
        )}
      </Card>

      <Card title="עותק דרכון">
        <EntityDocumentSection tripId={activeTrip.id} entityType="trip" entityId={activeTrip.id} documents={passportDocuments} />
      </Card>

      <Card title="מסמכים נוספים">
        <Link href={`/trips/${activeTrip.id}#document-center`} style={{ color: "var(--color-primary)" }}>
          פתח את מרכז המסמכים (פוליסת ביטוח, אישורי הזמנה) →
        </Link>
      </Card>
    </div>
  );
}

function EmergencyNumbersCard({ country }: { country: string | null }) {
  const numbers = getEmergencyNumbersForCountry(country);
  return (
    <Card title={`מספרי חירום — ${numbers.country}`}>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <NumberBlock label="משטרה" value={numbers.police} />
        <NumberBlock label="אמבולנס" value={numbers.ambulance} />
        <NumberBlock label="כבאות" value={numbers.fire} />
      </div>
      {numbers.notes ? <p style={{ ...mutedStyle, marginTop: "0.5rem" }}>{numbers.notes}</p> : null}
      <p style={{ ...mutedStyle, marginTop: "0.5rem" }}>מספרים כלליים ויציבים לרוב — מומלץ לוודא מול משרד החוץ/השגרירות לפני הנסיעה.</p>
    </Card>
  );
}

function NumberBlock({ label, value }: { label: string; value: string }) {
  return (
    <a href={`tel:${value}`} style={{ textAlign: "center", textDecoration: "none", color: "inherit" }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-danger)" }}>{value}</div>
      <div style={mutedStyle}>{label}</div>
    </a>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "10px", background: "var(--color-surface)" }}>
      <h2 style={{ fontSize: "0.875rem", marginTop: 0, color: "var(--color-text-muted)" }}>{title}</h2>
      {children}
    </div>
  );
}

const mutedStyle: React.CSSProperties = { color: "var(--color-text-muted)", fontSize: "0.8125rem", margin: 0 };
