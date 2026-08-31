import type { LoyaltyProgramType } from "@travel-app/shared-types";

export const LOYALTY_PROGRAM_TYPE_LABELS: Record<LoyaltyProgramType, string> = {
  airline: "טיסות תכופות",
  hotel: "מועדון מלונות",
  car_rental: "השכרת רכב",
  other: "אחר",
};
