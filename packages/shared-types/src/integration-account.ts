import { z } from "zod";
import { integrationServiceSchema, integrationTypeSchema } from "./enums";

// גלובלי פר-משתמש (לא פר-טיול) — אותו עיקרון כמו LoyaltyProgram/PaymentCard/
// Contact. integrationType נשאר manual_link בכל מה שה-UI תומך בו כיום —
// oauth_data_portability (Booking.com) נדחה במפורש עד שיש דומיין/פריסה יציבה
// (ר' PROJECT_REQUIREMENTS.md #24), השדות oauth* נשארים ב-schema לקראת אז.
export const integrationAccountSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  serviceName: integrationServiceSchema,
  integrationType: integrationTypeSchema,
  appLink: z.string().nullable(),
  websiteLink: z.string().nullable(),
  accountLink: z.string().nullable(),
  bookingsLink: z.string().nullable(),
  emailOrUsername: z.string().nullable(),
  // תמיד null עד ש-oauth_data_portability ייבנה בפועל (ר' ההערה למעלה) — קיימים
  // כאן רק כדי לשקף במלואו את עמודות ה-DB, כמו כל שאר טיפוסי-הפלט בפרויקט.
  oauthProvider: z.string().nullable(),
  oauthSecretRef: z.string().nullable(),
  oauthScope: z.string().nullable(),
  oauthConnectedAt: z.iso.datetime().nullable(),
  oauthExpiresAt: z.iso.datetime().nullable(),
  notes: z.string().nullable(),
  deletedAt: z.iso.datetime().nullable(),
});
export type IntegrationAccount = z.infer<typeof integrationAccountSchema>;

export const createIntegrationAccountInputSchema = z.object({
  serviceName: integrationServiceSchema,
  appLink: z.string().trim().url("קישור לא תקין").optional(),
  websiteLink: z.string().trim().url("קישור לא תקין").optional(),
  accountLink: z.string().trim().url("קישור לא תקין").optional(),
  bookingsLink: z.string().trim().url("קישור לא תקין").optional(),
  emailOrUsername: z.string().trim().optional(),
  notes: z.string().optional(),
});
export type CreateIntegrationAccountInput = z.infer<typeof createIntegrationAccountInputSchema>;
