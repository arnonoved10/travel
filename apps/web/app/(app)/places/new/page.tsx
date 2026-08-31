import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { PlaceCreateForm } from "../place-create-form";

export default async function NewPlacePage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; city?: string; country?: string; address?: string; officialWebsite?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { name, city, country, address, officialWebsite } = await searchParams;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>מקום חדש</h1>
      <PlaceCreateForm defaultValues={{ name, city, country, address, officialWebsite }} />
    </div>
  );
}
