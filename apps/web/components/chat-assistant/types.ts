import type { ExecutedChatAction } from "@/app/(app)/assistant/actions";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  executedActions?: ExecutedChatAction[];
  error?: string;
}
