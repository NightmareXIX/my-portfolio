"use client";

import { useEffect, useState } from "react";

// Brief brand loader: fills a boxy progress bar, then fades out smoothly.
// Purely cosmetic — content is already rendered underneath.
export default function Loader() {
  const [done, setDone] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setDone(true), 780);
    const t2 = setTimeout(() => setHidden(true), 1360); // after fade transition
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (hidden) return null;

  return (
    <div className={`loader${done ? " gone" : ""}`} aria-hidden="true">
      <div className="loader-inner">
        <div className="mark disp">SADNAN<span className="b">!</span></div>
        <div className="loader-bar"><i /></div>
        <div className="loader-note mono">loading portfolio…</div>
      </div>
    </div>
  );
}
