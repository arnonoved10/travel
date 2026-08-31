import type { TripType } from "@travel-app/shared-types";

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  beach: "חוף/ים",
  ski: "סקי/הרים",
  city: "עיר",
  nature: "טבע/טיולים",
  business: "עסקים",
  road_trip: "רואד-טריפ",
  other: "אחר",
};
