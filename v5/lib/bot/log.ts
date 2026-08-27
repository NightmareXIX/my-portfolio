// Phase 4.6. One line per request, structured, and deliberately incapable of carrying message
// content: `LogRecord` has no field for it, so "just add the prompt for debugging" would be a
// visible type change in review rather than a quiet console.log.
//
// If transcripts are ever wanted for tuning, that needs a disclosed notice
// in the widget first. Do not quietly log what strangers type.

export type LogRecord = {
  ts: string;
  hashedIp: string;
  tokensUsed: number;
  provider?: "gemini" | "groq" | "canned";
  blocked?: string;
};

export function logChat(record: Omit<LogRecord, "ts">): void {
  const line: LogRecord = { ts: new Date().toISOString(), ...record };
  console.log(`[chat] ${JSON.stringify(line)}`);
}
