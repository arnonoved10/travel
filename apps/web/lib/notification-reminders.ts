export interface ReminderCandidate {
  id: string;
  title: string;
  body: string;
  eventAt: string;
  leadTimeMinutes: number;
}

/**
 * מחזירה רק תזכורות שצריך "לירות" עכשיו: הגענו לחלון בין (זמן האירוע פחות
 * leadTimeMinutes) לבין זמן האירוע עצמו, והתזכורת עדיין לא נורתה בעבר
 * (alreadyFired). אחרי שהאירוע עצמו עבר, אין טעם עוד להתריע עליו.
 */
export function dueReminders(candidates: ReminderCandidate[], now: Date, alreadyFired: ReadonlySet<string>): ReminderCandidate[] {
  return candidates.filter((candidate) => {
    if (alreadyFired.has(candidate.id)) return false;
    const eventAtMs = new Date(candidate.eventAt).getTime();
    const fireAtMs = eventAtMs - candidate.leadTimeMinutes * 60_000;
    return now.getTime() >= fireAtMs && now.getTime() < eventAtMs;
  });
}
