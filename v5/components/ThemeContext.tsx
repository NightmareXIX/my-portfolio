"use client";

import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import { defaultTheme, presets, resolveVars, ThemeState } from "@/lib/theme";

type Ctx = {
  theme: ThemeState;
  setTheme: React.Dispatch<React.SetStateAction<ThemeState>>;
  patch: (p: Partial<ThemeState>) => void;
  applyPreset: (id: string) => void;
  activePreset: string | null;
};

const ThemeCtx = createContext<Ctx | null>(null);

export function useTheme() {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error("useTheme must be used inside ThemeProvider");
  return c;
}

export function ThemeProvider({
  children,
  initialPreset,
}: {
  children: React.ReactNode;
  initialPreset?: string;
}) {
  const seed = initialPreset ? presets.find((p) => p.id === initialPreset)?.state : undefined;
  const [theme, setTheme] = useState<ThemeState>(seed ?? defaultTheme);

  const patch = useCallback((p: Partial<ThemeState>) => setTheme((t) => ({ ...t, ...p })), []);
  const applyPreset = useCallback((id: string) => {
    const pre = presets.find((p) => p.id === id);
    if (pre) setTheme({ ...pre.state });
  }, []);

  const activePreset = useMemo(() => {
    const match = presets.find((p) => JSON.stringify(p.state) === JSON.stringify(theme));
    return match ? match.id : null;
  }, [theme]);

  const vars = useMemo(() => resolveVars(theme), [theme]);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, patch, applyPreset, activePreset }}>
      <div className="theme-root" style={vars as React.CSSProperties}>
        {children}
      </div>
    </ThemeCtx.Provider>
  );
}
