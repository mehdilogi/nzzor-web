"use client";

import { LangProvider } from "../lib/LangContext";

// Wraps the app in client-side context providers.
export default function Providers({ children }) {
  return <LangProvider>{children}</LangProvider>;
}
