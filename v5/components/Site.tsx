"use client";

import { ThemeProvider } from "@/components/ThemeContext";
import Sections from "@/components/Sections";
import Chatbot from "@/components/Chatbot";
import Loader from "@/components/Loader";

export default function Site({ initialPreset }: { initialPreset?: string }) {
  return (
    <ThemeProvider initialPreset={initialPreset}>
      <Loader />
      <Sections />
      <Chatbot />
    </ThemeProvider>
  );
}
