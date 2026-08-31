// אותו ANTHROPIC_API_KEY בדיוק כמו lib/ocr/config.ts — מודול נפרד לפי המוסכמה
// הקיימת בפרויקט (lib/<feature>/config.ts לכל אינטגרציה חיצונית), לא כפילות-לוגיקה.
import { getAnthropicApiKey as getOcrAnthropicApiKey, isClaudeOcrConfigured } from "@/lib/ocr/config";

export function isChatConfigured(): boolean {
  return isClaudeOcrConfigured();
}

export function getAnthropicApiKey(): string | null {
  return getOcrAnthropicApiKey();
}
