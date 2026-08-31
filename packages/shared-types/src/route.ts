import { z } from "zod";
import { travelModeSchema } from "./enums";

export const routeStopSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  date: z.iso.date(),
  placeId: z.uuid().nullable(),
  orderIndex: z.number().int().nonnegative(),
  plannedArrivalAt: z.iso.datetime().nullable(),
  plannedDepartureAt: z.iso.datetime().nullable(),
  distanceKm: z.number().nonnegative().nullable(),
  travelTimeMinutes: z.number().int().nonnegative().nullable(),
  travelMode: travelModeSchema.nullable(),
});
export type RouteStop = z.infer<typeof routeStopSchema>;

export const createRouteStopInputSchema = z.object({
  tripId: z.uuid(),
  date: z.iso.date("תאריך לא תקין"),
  placeId: z.uuid({ message: "יש לבחור מקום" }),
  plannedArrivalAt: z.iso.datetime("שעת הגעה לא תקינה").optional(),
  plannedDepartureAt: z.iso.datetime("שעת יציאה לא תקינה").optional(),
  distanceKm: z.number().nonnegative().optional(),
  travelTimeMinutes: z.number().int().nonnegative().optional(),
  travelMode: travelModeSchema.optional(),
});
export type CreateRouteStopInput = z.infer<typeof createRouteStopInputSchema>;
