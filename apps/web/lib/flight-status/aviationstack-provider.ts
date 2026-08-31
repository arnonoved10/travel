import type { FlightLiveStatus } from "@travel-app/shared-types";
import type { FlightStatusProvider, FlightStatusResult } from "./types";
import { getAviationstackApiKey } from "./config";

// Aviationstack — real-time flights endpoint. תמיד קריאה אמיתית בצד-שרת בלבד
// (המפתח לעולם לא נחשף ללקוח). flight_iata הוא בדיוק מה שהמשתמש מזין בשדה
// "מספר טיסה" (למשל "LY083") — לא בונים קוד-IATA מ-airline+number בעצמנו.
const API_URL = "https://api.aviationstack.com/v1/flights";

const KNOWN_STATUSES: readonly FlightLiveStatus[] = ["scheduled", "active", "landed", "cancelled", "diverted", "incident"];

interface AviationstackFlight {
  flight_date?: string;
  flight_status?: string;
  departure?: { delay?: number | null };
  arrival?: { delay?: number | null };
}

interface AviationstackResponse {
  data?: AviationstackFlight[];
  error?: { code?: string; message?: string };
}

function toKnownStatus(raw: string | undefined): FlightLiveStatus {
  return KNOWN_STATUSES.includes(raw as FlightLiveStatus) ? (raw as FlightLiveStatus) : "unknown";
}

export class AviationstackFlightStatusProvider implements FlightStatusProvider {
  readonly name = "aviationstack";

  async checkFlightStatus({ flightNumber, flightDate }: { flightNumber: string; flightDate: string }): Promise<FlightStatusResult> {
    const apiKey = getAviationstackApiKey();
    if (!apiKey) throw new Error("AVIATIONSTACK_API_KEY אינו מוגדר");

    const url = new URL(API_URL);
    url.searchParams.set("access_key", apiKey);
    url.searchParams.set("flight_iata", flightNumber);
    url.searchParams.set("flight_date", flightDate);

    const response = await fetch(url.toString());
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Aviationstack API החזיר שגיאה (${response.status}): ${body.slice(0, 300)}`);
    }

    const data = (await response.json()) as AviationstackResponse;
    if (data.error) {
      throw new Error(`Aviationstack API: ${data.error.message ?? data.error.code ?? "שגיאה לא ידועה"}`);
    }

    const flight = data.data?.[0];
    if (!flight) {
      throw new Error("לא נמצאה טיסה עם מספר-הטיסה והתאריך שהוזנו");
    }

    return {
      liveStatus: toKnownStatus(flight.flight_status),
      liveDelayMinutes: flight.departure?.delay ?? flight.arrival?.delay ?? null,
    };
  }
}

export const aviationstackFlightStatusProvider = new AviationstackFlightStatusProvider();
