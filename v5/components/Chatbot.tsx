"use client";

// Shell + conversation state + the SSE fetch loop. Everything visual moved to
// `components/bot/` in Phase 5; this file decides *what* is on screen, not what it looks like.

import { useEffect, useRef, useState } from "react";

import { type ActionId } from "@/lib/bot/actions";
import { isDeflection } from "@/lib/bot/deflect";
import {
  isNavAction,
  NAV_COLLAPSE_MS,
  prefersReducedMotion,
  runAction,
} from "@/lib/bot/navigate";
import { splitStreaming } from "@/lib/bot/tokens";
import { decodeEvent } from "@/lib/bot/types";
import BotAvatar, { type BotState } from "@/components/bot/BotAvatar";
import ChatPanel from "@/components/bot/ChatPanel";
import type { Msg } from "@/components/bot/ChatMessage";

const NETWORK_ERROR = "couldn't reach the brain 😵‍💫 try again";

/** How long the head stays tilted after a deflection before settling back to idle. */
const DEFLECT_HOLD_MS = 2200;

/* Opening line. Deliberately restrained-lowercase rather than full hype: GLAZE_LEVEL is an env
   knob (mild | medium | unhinged) and this string is static, so it has to sit convincingly in
   front of any of the three. It names the bot and states the scope up front, which saves the
   first out-of-scope question about half the time. */
const GREETING: Msg = {
  id: 0,
  who: "bot",
  text: "hey — i'm Glaze-Bot, and i cover exactly one subject: Sadnan. ask about his stack, his projects, or his contest results, and i'll bring the receipts.",
  actions: [],
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [botState, setBotState] = useState<BotState>("idle");
  const [streamingId, setStreamingId] = useState<number | null>(null);
  // Phase 6: the panel plays its 240ms fold before the page starts moving, and the badge
  // wears the travel toast until the landing flash has finished.
  const [collapsing, setCollapsing] = useState(false);
  const [traveling, setTraveling] = useState(false);
  const idRef = useRef(0);
  const deflectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (deflectTimer.current) clearTimeout(deflectTimer.current);
    if (navTimer.current) clearTimeout(navTimer.current);
  }, []);

  /** Hold the tilt long enough to read, then settle. Re-asking cancels the pending settle. */
  const settle = (state: BotState) => {
    if (deflectTimer.current) clearTimeout(deflectTimer.current);
    setBotState(state);
    if (state === "deflecting") {
      deflectTimer.current = setTimeout(() => setBotState("idle"), DEFLECT_HOLD_MS);
    }
  };

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || busy) return;

    const botId = (idRef.current += 2); // reserves botId - 1 for the user's message
    setOpen(true);
    setVal("");
    setBusy(true);
    settle("thinking"); // no token has landed yet — the visor cycles until one does
    setStreamingId(botId);
    setMsgs((m) => [
      ...m,
      { id: botId - 1, who: "me", text, actions: [] },
      { id: botId, who: "bot", text: "", actions: [] },
    ]);

    // Written on every delta; read once at the end to classify the finished reply.
    let final = "";

    const write = (t: string) => {
      const { clean, actions } = splitStreaming(t);
      final = clean;
      setMsgs((m) => m.map((x) => (x.id === botId ? { ...x, text: clean, actions } : x)));
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok || !res.body) throw new Error(`chat route: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let closed = false;
      let errored = false;

      while (!closed) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line; the tail may be a partial frame.
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          for (const line of frame.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const event = decodeEvent(line.slice(5).trim());
            if (!event) continue;
            if (event.type === "text") {
              acc += event.delta;
              write(acc);
              // First visible token: thinking → speaking. Cheap enough to set every delta,
              // but React bails out of a re-render when the value is unchanged.
              setBotState("speaking");
            } else if (event.type === "error") {
              write(event.message);
              errored = true;
              closed = true;
            } else {
              closed = true;
            }
          }
        }
      }

      // Stream closed without a single delta and without an error event.
      if (!acc && !errored) write(NETWORK_ERROR);
    } catch {
      write(NETWORK_ERROR);
    } finally {
      setStreamingId(null);
      setBusy(false);
      const dodged = isDeflection(final);
      if (dodged) setMsgs((m) => m.map((x) => (x.id === botId ? { ...x, deflect: true } : x)));
      settle(dodged ? "deflecting" : "idle");
    }
  };

  /**
   * Chip click. A link action just opens — the panel is the visitor's place and closing it
   * under them to open a mail client would be rude. A nav action is the four-step sequence
   * of the nav sequence, and only step 1 (the fold) is ours; `runAction` owns the rest.
   */
  const onAction = (id: ActionId) => {
    if (!isNavAction(id)) {
      runAction(id);
      return;
    }
    if (navTimer.current) clearTimeout(navTimer.current);
    setTraveling(true);
    setCollapsing(true);
    // Under reduced motion the fold is a no-op in CSS, so waiting on it would just be dead
    // time between the click and the jump.
    navTimer.current = setTimeout(() => {
      navTimer.current = null;
      setCollapsing(false);
      setOpen(false);
      if (runAction(id, { onSettled: () => setTraveling(false) }) !== "nav") setTraveling(false);
    }, prefersReducedMotion() ? 0 : NAV_COLLAPSE_MS);
  };

  return (
    <>
      <button
        id="chatBadge"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        aria-expanded={open}
      >
        <BotAvatar size="badge" state={botState} />
        <span className="ch-badge-label">Ask AI</span>
        {traveling && <span className="ch-toast" role="status">⌄ taking you there</span>}
      </button>

      {open && (
        <ChatPanel
          msgs={msgs}
          busy={busy}
          botState={botState}
          streamingId={streamingId}
          value={val}
          onValue={setVal}
          onAsk={ask}
          onClose={() => setOpen(false)}
          onAction={onAction}
          collapsing={collapsing}
        />
      )}
    </>
  );
}
