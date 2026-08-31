import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUserRepository } from "@travel-app/data-layer";
import { DownloadBackupButton } from "@/components/download-backup-button";
import { exportBackup } from "@/lib/backup/export-backup";
import { ThemeSettingsForm } from "./theme-settings-form";
import { PreferencesForm } from "./preferences-form";
import { RestoreBackupForm } from "./restore-backup-form";
import { PushNotificationSetup } from "./push-notification-setup";
import { DisplayNameForm } from "./display-name-form";
import { isPushConfigured, getVapidPublicKey } from "@/lib/push/config";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const backup = await exportBackup(user.id);
  const backupJson = JSON.stringify(backup, null, 2);
  const backupFileName = `גיבוי-${new Date().toISOString().slice(0, 10)}.json`;
  const userRepository = await getUserRepository();
  const displayName = await userRepository.getDisplayName({ userId: user.id });

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>הגדרות</h1>

      <h2 style={{ marginTop: 0, fontSize: "1.125rem" }}>שם תצוגה</h2>
      <DisplayNameForm currentDisplayName={displayName} />

      <h2 style={{ marginTop: "2rem", fontSize: "1.125rem" }}>מראה</h2>
      <p style={{ color: "var(--color-text-muted)" }}>
        התאמת מראה הממשק — השינויים חלים מיד, בלי צורך בשמירה או רענון.
      </p>
      <ThemeSettingsForm />

      <h2 style={{ marginTop: "2rem", fontSize: "1.125rem" }}>התראות-דחיפה</h2>
      <p style={{ color: "var(--color-text-muted)" }}>
        מגיעות גם כשהאפליקציה סגורה — בשונה מהתראות-הדפדפן ב-/now שפועלות רק כשהדף פתוח. כרגע מחובר בפועל
        לעדכוני סטטוס-טיסה (עיכוב/ביטול) שנבדקים בעמוד הטיול.
      </p>
      {isPushConfigured() ? <PushNotificationSetup vapidPublicKey={getVapidPublicKey()!} /> : <p style={{ color: "var(--color-text-muted)" }}>לא מחובר.</p>}

      <h2 style={{ marginTop: "2rem", fontSize: "1.125rem" }}>העדפות</h2>
      <p style={{ color: "var(--color-text-muted)" }}>
        ברירות מחדל שמשמשות בכל הטיולים — נשמרות במכשיר הזה.
      </p>
      <PreferencesForm />

      <h2 style={{ marginTop: "2rem", fontSize: "1.125rem" }}>גיבוי ושחזור</h2>
      <p style={{ color: "var(--color-text-muted)" }}>
        קובץ JSON מלא של כל הטיולים והנתונים שלהם — טיולים, מקומות, הזמנות, הוצאות, תשלומים, מסמכים ועוד.
      </p>
      <DownloadBackupButton json={backupJson} fileName={backupFileName} />

      <h3 style={{ marginTop: "1.5rem", fontSize: "1rem" }}>שחזור מגיבוי</h3>
      <RestoreBackupForm />
    </div>
  );
}
