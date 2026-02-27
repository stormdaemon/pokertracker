import { getLocations } from "@/features/locations/actions";
import { LocationsList } from "@/features/locations/locations-list";

export const metadata = { title: "Lieux - Poker Tracker Pro" };

export default async function LocationsPage() {
  const locations = await getLocations();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Lieux</h2>
      <LocationsList locations={locations} />
    </div>
  );
}
