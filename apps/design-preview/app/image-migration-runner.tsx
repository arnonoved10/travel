"use client";

import { useEffect } from "react";
import { runImageMigration } from "./trips-data";

/** מותקן תמיד (ר' layout.tsx, לצד ServiceWorkerRegistration/AIAssistantGate
 * שכבר עובדות באותו דפוס) כדי שמיגרציית-התמונות ל-IndexedDB תרוץ פעם אחת
 * בכל טעינה, בלי תלות בטיול-פעיל/מסך-ספציפי — ר' ההסבר המלא ב-
 * runImageMigration (trips-data.ts) על למה זו לא יכולה לרוץ מתוך
 * currentScopeTripId הסינכרונית הרגילה. */
export function ImageMigrationRunner(): null {
  useEffect(() => {
    runImageMigration().catch((err) => console.error("ImageMigrationRunner: failed:", err));
  }, []);
  return null;
}
