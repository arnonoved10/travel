import { z } from "zod";
import { placeCategorySchema, tripPlaceStatusSchema } from "./enums";

const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "שעה לא תקינה (פורמט HH:MM)");

const dayHoursSchema = z
  .object({
    open: timeOfDaySchema,
    close: timeOfDaySchema,
  })
  .nullable();

export const openingHoursSchema = z.object({
  sun: dayHoursSchema,
  mon: dayHoursSchema,
  tue: dayHoursSchema,
  wed: dayHoursSchema,
  thu: dayHoursSchema,
  fri: dayHoursSchema,
  sat: dayHoursSchema,
});
export type OpeningHours = z.infer<typeof openingHoursSchema>;
export type DayHours = z.infer<typeof dayHoursSchema>;

export const placeSchema = z.object({
  id: z.uuid(),
  // ספרייה אישית, לא משותפת בין משתמשים — ראה rls_policies.sql.
  userId: z.uuid(),
  name: z.string().min(1),
  category: placeCategorySchema,
  address: z.string().nullable(),
  country: z.string().nullable(),
  city: z.string().nullable(),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  officialWebsite: z.url().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  email: z.email().nullable(),
  openingHours: openingHoursSchema.nullable(),
  generalNotes: z.string().nullable(),
  isFavorite: z.boolean(),
  dontReturn: z.boolean(),
  personalRating: z.number().int().min(1).max(5).nullable(),
  mapLink: z.url().nullable(),
  deletedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Place = z.infer<typeof placeSchema>;

export const createPlaceInputSchema = z
  .object({
    name: z.string().trim().min(1, "שם המקום הוא שדה חובה"),
    category: placeCategorySchema,
    address: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    officialWebsite: z.url().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.email().optional(),
    openingHours: openingHoursSchema.optional(),
    generalNotes: z.string().optional(),
  })
  .refine((data) => (data.lat === undefined) === (data.lng === undefined), {
    message: "יש למלא גם קו רוחב וגם קו אורך, או להשאיר את שניהם ריקים",
    path: ["lng"],
  });
export type CreatePlaceInput = z.infer<typeof createPlaceInputSchema>;

export const setPlacePersonalRatingInputSchema = z.object({
  placeId: z.uuid(),
  personalRating: z.number().int().min(1).max(5).nullable(),
});
export type SetPlacePersonalRatingInput = z.infer<typeof setPlacePersonalRatingInputSchema>;

export const tripPlaceSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  placeId: z.uuid(),
  status: tripPlaceStatusSchema,
  notes: z.string().nullable(),
});
export type TripPlace = z.infer<typeof tripPlaceSchema>;
