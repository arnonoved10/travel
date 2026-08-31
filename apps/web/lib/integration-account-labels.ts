import type { IntegrationService } from "@travel-app/shared-types";

export const INTEGRATION_SERVICE_LABELS: Record<IntegrationService, string> = {
  booking_com: "Booking.com",
  agoda: "Agoda",
  hotels_com: "Hotels.com",
  expedia: "Expedia",
  bolt: "Bolt",
  grab: "Grab",
  airline: "חברת תעופה",
  car_rental_company: "חברת השכרת רכב",
  insurance_company: "חברת ביטוח",
  other: "אחר",
};
