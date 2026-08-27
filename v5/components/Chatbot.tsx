"use client";

import { useEffect, useRef, useState } from "react";
import { decodeEvent } from "@/lib/bot/types";

type Msg = { id: number; who: "bot" | "me"; text: string };

const NETWORK_ERROR = "couldn't reach the brain 😵‍💫 try again";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 0, who: "bot", text: "Hey! I'm a front-end assistant shell for Sadnan's portfolio. Ask about his stack, projects or contest results." },
  ]);
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs, open]);

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || busy) return;

    const botId = (idRef.current += 2); // reserves botId - 1 for the user's message
    setOpen(true);
    setVal("");
    setBusy(true);
    setMsgs((m) => [...m, { id: botId - 1, who: "me", text }, { id: botId, who: "bot", text: "" }]);

    const write = (t: string) => setMsgs((m) => m.map((x) => (x.id === botId ? { ...x, text: t } : x)));

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
      setBusy(false);
    }
  };

  return (
    <>
      <button id="chatBadge" onClick={() => setOpen((o) => !o)} aria-label="Open assistant">
        <span className="d" /> Ask AI
      </button>

      {open && (
        <div className="chat-panel" role="dialog" aria-label="Ask Sadnan-Bot">
          <div className="ch-head">
            <div className="t">Ask Sadnan-Bot</div>
            <button onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>
          <div className="ch-body" ref={bodyRef}>
            {msgs.map((m) => (
              <div key={m.id} className={`ch-msg ${m.who}`}>{m.text || "…"}</div>
            ))}
          </div>
          <div className="ch-chips">
            <button onClick={() => ask("What is your stack?")}>Stack?</button>
            <button onClick={() => ask("Tell me about the LLM Gateway")}>LLM Gateway?</button>
            <button onClick={() => ask("Contest results?")}>Contest results?</button>
          </div>
          <div className="ch-input">
            <input
              value={val}
              disabled={busy}
              placeholder={busy ? "thinking…" : "ask anything…"}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") ask(val); }}
            />
            <button onClick={() => ask(val)} disabled={busy} aria-label="Send">→</button>
          </div>
        </div>
      )}
    </>
  );
}
