"use client";

import { LangProvider } from "../lib/LangContext";
import { AuthProvider } from "../lib/AuthContext";

// Wraps the app in client-side context providers.
export default function Providers({ children }) {
  return (
    <LangProvider>
      <AuthProvider>{children}</AuthProvider>
    </LangProvider>
  );
}
