import type { OcrProvider } from "./types";
import { isClaudeOcrConfigured } from "./config";
import { claudeOcrProvider } from "./claude-provider";
import { tesseractOcrProvider } from "./tesseract-provider";

/** בשונה מ-getRecommendationsProvider/getMapProvider — כאן תמיד יש ספק זמין
 * (Tesseract לא דורש מפתח בכלל), אין מצב "לא מחובר". Claude, כשמוגדר, נבחר
 * כברירת-מחדל כי הוא מדויק משמעותית (מבין הקשר, לא רק דפוסי-regex). */
export function getOcrProvider(): OcrProvider {
  return isClaudeOcrConfigured() ? claudeOcrProvider : tesseractOcrProvider;
}
