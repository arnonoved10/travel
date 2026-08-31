import type { FlightStatusProvider } from "./types";
import { isFlightStatusConfigured } from "./config";
import { aviationstackFlightStatusProvider } from "./aviationstack-provider";
import { nullFlightStatusProvider } from "./null-provider";

/** שרת-בלבד (כמו getRecommendationsProvider) — קריאות Aviationstack קורות
 * תמיד ב-Server Action. */
export function getFlightStatusProvider(): FlightStatusProvider {
  return isFlightStatusConfigured() ? aviationstackFlightStatusProvider : nullFlightStatusProvider;
}
