import type { OcrExtractionResult, OcrProvider } from "./types";
import { getAnthropicApiKey } from "./config";

const MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

const EXTRACTION_PROMPT = `זהו מסמך-נסיעות (אישור הזמנה/קבלה/כרטיס/פוליסת ביטוח וכו'). חלץ כל שדה מובנה שניתן לזהות בוודאות: תאריכים, מספרי-אישור/הזמנה, סכומים עם מטבע, שם הספק/החברה, שמות נוסעים, טלפון/אימייל, כתובות.
החזר אך ורק מערך JSON, בלי טקסט נוסף ובלי markdown code fence: [{"fieldName": "snake_case_english_name", "extractedValue": "הערך כפי שמופיע במסמך", "confidenceScore": 0.0-1.0}]
אם שום שדה לא ניתן לזיהוי בביטחון סביר, החזר מערך ריק [].`;

interface ClaudeMessageResponse {
  content?: Array<{ type: string; text?: string }>;
}

interface RawExtractedField {
  fieldName?: unknown;
  extractedValue?: unknown;
  confidenceScore?: unknown;
}

function parseFieldsFromResponseText(text: string): OcrExtractionResult["fields"] {
  // Claude לפעמים עוטף ב-```json למרות ההנחיה — מסירים לפני parse.
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const parsed = JSON.parse(cleaned) as unknown;
  if (!Array.isArray(parsed)) throw new Error("תשובת ה-API אינה מערך JSON");

  return (parsed as RawExtractedField[])
    .filter((f): f is RawExtractedField & { fieldName: string } => typeof f.fieldName === "string" && f.fieldName.length > 0)
    .map((f) => ({
      fieldName: f.fieldName,
      extractedValue: typeof f.extractedValue === "string" ? f.extractedValue : null,
      confidenceScore: typeof f.confidenceScore === "number" && f.confidenceScore >= 0 && f.confidenceScore <= 1 ? f.confidenceScore : null,
    }));
}

export class ClaudeOcrProvider implements OcrProvider {
  readonly name = "claude";

  async extractFields({ imageBase64, mimeType }: { imageBase64: string; mimeType: string }): Promise<OcrExtractionResult> {
    const apiKey = getAnthropicApiKey();
    if (!apiKey) return { ok: false, error: "ANTHROPIC_API_KEY אינו מוגדר", fields: [] };

    const isPdf = mimeType === "application/pdf";
    const contentBlock = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: imageBase64 } }
      : { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } };

    const response = await fetch(MESSAGES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: [contentBlock, { type: "text", text: EXTRACTION_PROMPT }] }],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { ok: false, error: `Claude API החזיר שגיאה (${response.status}): ${body.slice(0, 300)}`, fields: [] };
    }

    const data = (await response.json()) as ClaudeMessageResponse;
    const text = data.content?.find((block) => block.type === "text")?.text;
    if (!text) return { ok: false, error: "לא התקבל טקסט מהתשובה", fields: [] };

    try {
      return { ok: true, fields: parseFieldsFromResponseText(text) };
    } catch {
      return { ok: false, error: "לא ניתן היה לפרש את תשובת המודל כ-JSON", fields: [] };
    }
  }
}

export const claudeOcrProvider = new ClaudeOcrProvider();
