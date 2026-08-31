import type { OcrExtractedField } from "./types";

/**
 * ממפה תוצאת-OCR גולמית לשדות-ברירת-מחדל להזמנה חדשה — לא pass-through
 * ישיר: fieldName נבנה חופשי (heuristic-field-extraction.ts נותן snake_case
 * קבוע, Claude חופשי לגמרי, ר' claude-provider.ts), אז מחפשים לפי כמה
 * שמות-חלופיים סבירים ולא סומכים על שם אחד. תאריך-בלבד (בלי שעה) ממופה רק
 * לשדות date-only בטופס (checkInDate) — לעולם לא בונים datetime עם שעה
 * מומצאת עבור departureAt/arrivalAt, כי אין ל-OCR שעה אמינה לחלץ.
 */

function findValue(fields: OcrExtractedField[], ...candidateNames: string[]): string | undefined {
  for (const name of candidateNames) {
    const match = fields.find((f) => f.fieldName.toLowerCase() === name.toLowerCase() && f.extractedValue);
    if (match?.extractedValue) return match.extractedValue;
  }
  return undefined;
}

function findAmount(fields: OcrExtractedField[]): number | undefined {
  const raw = findValue(fields, "amount", "amount_1", "price", "total_amount", "total");
  if (!raw) return undefined;
  const parsed = Number(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export interface HotelPrefill {
  hotelName?: string;
  checkInDate?: string;
  confirmationNumber?: string;
  phone?: string;
  email?: string;
  agreedPrice?: number;
}

export function mapExtractedFieldsToHotelPrefill(fields: OcrExtractedField[]): HotelPrefill {
  return {
    hotelName: findValue(fields, "hotel_name", "vendor", "company_name", "venue_name"),
    checkInDate: findValue(fields, "date", "date_1", "check_in_date", "checkin_date"),
    confirmationNumber: findValue(fields, "confirmation_number", "confirmation_number_1", "booking_number"),
    phone: findValue(fields, "phone"),
    email: findValue(fields, "email"),
    agreedPrice: findAmount(fields),
  };
}

export interface FlightPrefill {
  airline: string | undefined;
  flightNumber: string | undefined;
  confirmationNumber?: string;
  phone?: string;
  email?: string;
  agreedPrice?: number;
}

export function mapExtractedFieldsToFlightPrefill(fields: OcrExtractedField[]): FlightPrefill {
  return {
    airline: findValue(fields, "airline", "vendor", "company_name"),
    flightNumber: findValue(fields, "flight_number"),
    confirmationNumber: findValue(fields, "confirmation_number", "confirmation_number_1", "booking_number"),
    phone: findValue(fields, "phone"),
    email: findValue(fields, "email"),
    agreedPrice: findAmount(fields),
  };
}
