import type { RecordStatusHistoryInput, StatusHistoryEntry } from "@travel-app/shared-types";

/**
 * ייעודי למעברי סטטוס בלבד (append-only) — ראה גם AuditLogRepository, שמכסה
 * דיף שדות כללי. שני המנגנונים כותבים במקביל על אותו שינוי סטטוס: StatusHistory
 * לדוח "תכנון מול ביצוע", AuditLog ל"יומן שינויים" הכללי.
 */
export interface StatusHistoryRepository {
  listForEntities(params: { refs: Array<{ entityType: string; entityId: string }> }): Promise<StatusHistoryEntry[]>;
  record(params: { input: RecordStatusHistoryInput }): Promise<StatusHistoryEntry>;
}
