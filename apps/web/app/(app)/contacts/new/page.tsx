import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getTripRepository } from "@travel-app/data-layer";
import { ContactCreateForm } from "../contact-create-form";

export default async function NewContactPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tripRepository = await getTripRepository();
  const trips = await tripRepository.list({ userId: user.id });

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>איש קשר חדש</h1>
      <ContactCreateForm trips={trips.map((trip) => ({ id: trip.id, name: trip.name }))} />
    </div>
  );
}
