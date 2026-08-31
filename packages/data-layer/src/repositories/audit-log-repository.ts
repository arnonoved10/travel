import type { AuditLogEntry, CreateAuditLogEntryInput } from "@travel-app/shared-types";

/**
 * Coverage מוגבל בכוונה בשלב הזה — לא כל Repository באפליקציה כותב ל-Audit
 * Log (זה היה דורש לגעת בעשרות פונקציות create/update). מודגם על Trip
 * (עדכון שדות) ו-PlannedActivity (שינוי סטטוס) בלבד. ראה DECISIONS.md.
 */
export interface AuditLogRepository {
  listForEntities(params: { refs: Array<{ entityType: string; entityId: string }> }): Promise<AuditLogEntry[]>;
  record(params: { input: CreateAuditLogEntryInput }): Promise<AuditLogEntry>;
}
