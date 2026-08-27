"use client";

import { useRef, useState } from "react";
import { botAnswers } from "@/lib/data";

type Msg = { who: "bot" | "me"; text: string };

function reply(q: string): string {
  const s = q.toLowerCase();
  if (s.includes("stack") || s.includes("skill") || s.includes("tech")) return botAnswers.stack;
  if (s.includes("gateway") || s.includes("llm")) return botAnswers.gateway;
  if (s.includes("contest") || s.includes("icpc") || s.includes("codeforces") || s.includes("result"))
    return botAnswers.contest;
  return botAnswers.def;
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { who: "bot", text: "Hey! I'm a front-end assistant shell for Sadnan's portfolio. Ask about his stack, projects or contest results." },
  ]);
  const [val, setVal] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  const ask = (q: string) => {
    if (!q || !q.trim()) return;
    setOpen(true);
    setMsgs((m) => [...m, { who: "me", text: q }, { who: "bot", text: reply(q) }]);
    setVal("");
    requestAnimationFrame(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    });
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
            {msgs.map((m, i) => (
              <div key={i} className={`ch-msg ${m.who}`}>{m.text}</div>
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
              placeholder="ask anything…"
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") ask(val); }}
            />
            <button onClick={() => ask(val)} aria-label="Send">→</button>
          </div>
        </div>
      )}
    </>
  );
}
