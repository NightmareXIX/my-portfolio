"use client";

import { useEffect, useState } from "react";

// Dhaka clock (UTC+6), hydration-safe: renders a placeholder until mounted.
export default function Clock() {
  const [label, setLabel] = useState("DHK --:--");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const u = d.getTime() + d.getTimezoneOffset() * 60000;
      const dk = new Date(u + 6 * 3600000);
      const h = ("0" + dk.getHours()).slice(-2);
      const m = ("0" + dk.getMinutes()).slice(-2);
      setLabel(`DHK ${h}:${m}`);
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  return <span className="clock">{label}</span>;
}
