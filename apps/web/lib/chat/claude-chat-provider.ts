import { getAnthropicApiKey } from "./config";
import { CHAT_TOOLS } from "./tools";

const MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

export interface ChatToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ChatTurnResult {
  ok: boolean;
  reply: string;
  toolCalls: ChatToolCall[];
  error?: string;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  text: string;
}

interface ClaudeContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

interface ClaudeMessageResponse {
  content?: ClaudeContentBlock[];
}

/** תור-כלים אמיתי (function calling) של Anthropic — לא פרומפט "תחזיר JSON" כמו
 * lib/ocr/claude-provider.ts, כי כאן יש כמה סוגי-פעולה אפשריים באותה הודעה.
 * סבב יחיד: אם Claude בוחר להפעיל כלי, אנחנו מבצעים אותו בעצמנו (execute-tool-call.ts)
 * ובונים את "כרטיס-הקבלה" מהתוצאה האמיתית מה-DB — לא סומכים על טקסט-חופשי של
 * המודל לדיוק המספרים, כדי לא לסכן הלוצינציה על סכומים אמיתיים. */
export async function sendChatTurn({
  systemPrompt,
  history,
  message,
}: {
  systemPrompt: string;
  history: ChatHistoryMessage[];
  message: string;
}): Promise<ChatTurnResult> {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) return { ok: false, reply: "", toolCalls: [], error: "ANTHROPIC_API_KEY אינו מוגדר" };

  const messages = [...history.map((m) => ({ role: m.role, content: m.text })), { role: "user" as const, content: message }];

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
      system: systemPrompt,
      tools: CHAT_TOOLS,
      tool_choice: { type: "auto" },
      messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return { ok: false, reply: "", toolCalls: [], error: `Claude API החזיר שגיאה (${response.status}): ${body.slice(0, 300)}` };
  }

  const data = (await response.json()) as ClaudeMessageResponse;
  const blocks = data.content ?? [];

  const reply = blocks
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const toolCalls: ChatToolCall[] = blocks
    .filter((b): b is ClaudeContentBlock & { id: string; name: string; input: Record<string, unknown> } =>
      b.type === "tool_use" && typeof b.id === "string" && typeof b.name === "string" && typeof b.input === "object" && b.input !== null,
    )
    .map((b) => ({ id: b.id, name: b.name, input: b.input }));

  return { ok: true, reply, toolCalls };
}
