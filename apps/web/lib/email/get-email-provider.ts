import type { EmailProvider } from "./types";
import { isEmailConfigured } from "./config";
import { resendEmailProvider } from "./resend-provider";
import { nullEmailProvider } from "./null-provider";

/** שרת-בלבד — לעולם לא נקרא מקומפוננטת-לקוח (המפתח לא נחשף). */
export function getEmailProvider(): EmailProvider {
  return isEmailConfigured() ? resendEmailProvider : nullEmailProvider;
}
