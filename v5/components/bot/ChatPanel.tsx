"use client";

// Panel chrome: header, scrolling transcript, suggestion chips, input. It owns no
// conversation state — `Chatbot.tsx` holds that and the SSE loop — only the scroll behaviour,
// which is genuinely view-local.

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import type { ActionId } from "@/lib/bot/actions";
import BotAvatar, { type BotState } from "./BotAvatar";
import ChatMessage, { type Msg } from "./ChatMessage";

const SUGGESTIONS: readonly { label: string; q: string }[] = [
  { label: "Stack?", q: "What is your stack?" },
  { label: "LLM Gateway?", q: "Tell me about the LLM Gateway" },
  { label: "Contest results?", q: "Contest results?" },
];

/** How close to the bottom still counts as "following along". Two lines of body text. */
const STICK_SLACK_PX = 48;

type Props = {
  msgs: Msg[];
  busy: boolean;
  botState: BotState;
  /** Id of the bubble currently receiving deltas, or null. */
  streamingId: number | null;
  value: string;
  onValue: (v: string) => void;
  onAsk: (q: string) => void;
  onClose: () => void;
  onAction?: (id: ActionId) => void;
  /** Phase 6: playing the 240ms fold toward the badge before a nav chip's scroll starts. */
  collapsing?: boolean;
};

export default function ChatPanel({
  msgs, busy, botState, streamingId, value, onValue, onAsk, onClose, onAction, collapsing,
}: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Follow the stream by default, but the moment the visitor scrolls up to re-read something,
  // stop yanking them back — auto-scroll resumes only when they return to the bottom.
  const [stick, setStick] = useState(true);

  const onScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    setStick(el.scrollHeight - el.scrollTop - el.clientHeight <= STICK_SLACK_PX);
  };

  // Layout effect: scroll before paint, so a long delta never flashes at the wrong offset.
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (el && stick) el.scrollTop = el.scrollHeight;
  }, [msgs, stick]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div
      className={`chat-panel${collapsing ? " is-collapsing" : ""}`}
      role="dialog"
      aria-label="Ask Sadnan-Bot"
    >
      <div className="ch-head">
        <BotAvatar size="head" state={botState} />
        <div className="t">Ask Sadnan-Bot</div>
        <button onClick={onClose} aria-label="Close">×</button>
      </div>

      <div
        className="ch-body"
        ref={bodyRef}
        onScroll={onScroll}
        aria-live="polite"
        aria-atomic="false"
      >
        {msgs.map((m) => (
          <ChatMessage
            key={m.id}
            msg={m}
            streaming={m.id === streamingId}
            onAction={onAction}
          />
        ))}
      </div>

      <div className="ch-chips">
        {SUGGESTIONS.map((s) => (
          <button key={s.label} type="button" disabled={busy} onClick={() => onAsk(s.q)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="ch-input">
        <input
          ref={inputRef}
          value={value}
          disabled={busy}
          placeholder={busy ? "thinking…" : "ask anything…"}
          aria-label="Ask a question"
          onChange={(e) => onValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onAsk(value); }}
        />
        <button onClick={() => onAsk(value)} disabled={busy} aria-label="Send">→</button>
      </div>
    </div>
  );
}
