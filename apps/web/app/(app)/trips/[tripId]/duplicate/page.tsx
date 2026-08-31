import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getTripRepository } from "@travel-app/data-layer";
import { DuplicateTripForm } from "./duplicate-trip-form";

export default async function DuplicateTripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { tripId } = await params;
  const tripRepository = await getTripRepository();
  const trip = await tripRepository.getById({ userId: user.id, tripId });
  if (!trip) notFound();

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>שכפול טיול: {trip.name}</h1>
      <p style={{ color: "var(--color-text-muted)" }}>
        ייווצר טיול חדש ({trip.name} (עותק)) עם אותו אורך-טיול בדיוק ({trip.startDate} – {trip.endDate}), כולל מדינות/ערים, תקציב,
        רשימות-אריזה, מלווים, ומסלול יומי מלא (עם כל העצירות, בהזזה יחסית לתאריך החדש). הוצאות, הזמנות, מסמכים ויומן-הטיול הישן לא
        מועתקים.
      </p>
      <DuplicateTripForm tripId={tripId} />
    </div>
  );
}
