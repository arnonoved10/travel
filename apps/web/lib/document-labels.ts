import type { DocumentEntityType, DocumentType } from "@travel-app/shared-types";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  booking_confirmation: "אישור הזמנה",
  receipt: "קבלה",
  invoice: "חשבונית",
  payment_confirmation: "אישור תשלום",
  voucher: "Voucher",
  ticket: "כרטיס",
  policy: "פוליסה",
  contract: "חוזה",
  screenshot: "צילום מסך",
  image: "תמונה",
  pdf: "PDF",
  passport_copy: "עותק דרכון",
  other: "אחר",
};

export const DOCUMENT_ENTITY_TYPE_LABELS: Record<DocumentEntityType, string> = {
  booking: "הזמנה",
  expense: "הוצאה",
  payment: "תשלום",
  hotel_stay: "מלון",
  flight: "טיסה",
  transport_booking: "תחבורה",
  insurance: "ביטוח",
  activity_reservation: "אטרקציה/כרטיס",
  car_rental: "השכרת רכב",
  place: "מקום",
  planned_activity: "תכנון עתידי",
  trip: "טיול",
  trip_day: "יום בטיול",
  other: "אחר",
};
