"use client";

// =============================================================================
// Nzzor — Customer auth context
// Provides the current signed-in user across the public app. Loads from the
// API on mount if a token is present.
// =============================================================================

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getUserToken, clearUserToken, userMe } from "./accountApi";

const AuthContext = createContext({ user: null, loading: true, signOut: () => {}, refresh: () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getUserToken()) { setUser(null); setLoading(false); return; }
    try {
      const u = await userMe();
      setUser(u);
    } catch {
      // token bad or expired — clear it silently
      clearUserToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  function signOut() {
    clearUserToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
