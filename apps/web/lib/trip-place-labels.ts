import type { TripPlaceStatus } from "@travel-app/shared-types";
import { Heart, CalendarClock, CheckCircle2, Circle, Star, Ban, type LucideIcon } from "lucide-react";

export const TRIP_PLACE_STATUS_LABELS: Record<TripPlaceStatus, string> = {
  want_to_go: "רוצה להגיע",
  planned: "מתוכנן",
  visited: "ביקרתי",
  not_visited: "לא ביקרתי",
  favorite: "מועדף",
  dont_return: "לא רוצה לחזור",
};

export const TRIP_PLACE_STATUS_ICONS: Record<TripPlaceStatus, LucideIcon> = {
  want_to_go: Heart,
  planned: CalendarClock,
  visited: CheckCircle2,
  not_visited: Circle,
  favorite: Star,
  dont_return: Ban,
};
