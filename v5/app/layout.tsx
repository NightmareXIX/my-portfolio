import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Smaller / body / mono text runs on JetBrains Mono; the big poster display
// stays on Arial Black. Exposed as a CSS var so theme.ts font stacks can use it.
const jet = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-jet",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kazi Fardin Islam (Sadnan) — Software Engineer",
  description:
    "Backend / full-stack engineer. Role-based APIs, multi-provider LLM gateways and real-time platforms, backed by real test suites and Dockerized infra.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jet.variable}>
      <body>{children}</body>
    </html>
  );
}
