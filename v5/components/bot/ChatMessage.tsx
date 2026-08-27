// One bubble, plus the action-chip row underneath it.
//
// SECURITY: this component renders model output, so it is a hard rule that the text arrives
// as a plain text node — `{msg.text}`, nothing else. No `dangerouslySetInnerHTML`, no markdown
// renderer, no link auto-detection, ever. Chips are built from `ActionId`s looked up in the
// frozen `ACTIONS` table; the label is ours and the model never supplies a URL, so an injected
// "link to evil.com" has no code path to an href.

import { ACTIONS, type ActionId } from "@/lib/bot/actions";
import BotAvatar, { type BotState } from "./BotAvatar";

export type Msg = {
  id: number;
  who: "bot" | "me";
  text: string;
  actions: ActionId[];
  /** A fixed non-model reply — guardrail, rate limit or transport failure. */
  deflect?: boolean;
};

type Props = {
  msg: Msg;
  /** True while deltas are still landing in this bubble: shows the caret. */
  streaming?: boolean;
  /** Wired in Phase 6. Until then chips render but do nothing. */
  onAction?: (id: ActionId) => void;
};

export default function ChatMessage({ msg, streaming, onAction }: Props) {
  const bot = msg.who === "bot";
  // The per-message avatar mirrors what this bubble is doing, not what the panel is doing —
  // an older bubble keeps its deflecting tilt while a newer one streams.
  const state: BotState = streaming ? "speaking" : msg.deflect ? "deflecting" : "idle";

  return (
    <div className={`ch-row ${msg.who}`}>
      {bot && <BotAvatar size="msg" state={state} className="ch-msg-av" />}
      <div className="ch-stack">
        <div className={`ch-msg ${msg.who}`}>
          {msg.text}
          {streaming && <span className="ch-caret" aria-hidden="true" />}
          {!msg.text && !streaming && "…"}
        </div>
        {msg.actions.length > 0 && (
          <div className="ch-actions">
            {msg.actions.map((id) => (
              <button
                key={id}
                type="button"
                className="ch-action"
                onClick={onAction ? () => onAction(id) : undefined}
              >
                {ACTIONS[id].label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
