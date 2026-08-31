import type { ContactCategory } from "@travel-app/shared-types";

export const CONTACT_CATEGORY_LABELS: Record<ContactCategory, string> = {
  hotel: "מלון",
  driver: "נהג",
  taxi_company: "חברת מוניות",
  insurance: "ביטוח",
  rental_company: "חברת השכרה",
  airline: "חברת תעופה",
  ferry: "מעבורת",
  guide: "מדריך",
  agent: "סוכן",
  attraction: "אטרקציה",
  other: "אחר",
};
