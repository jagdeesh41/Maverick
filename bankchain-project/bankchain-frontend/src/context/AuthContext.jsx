import { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'bankchain_user';

/**
 * Holds whoever is "logged in". Persisted to sessionStorage (tab-scoped,
 * cleared when the tab closes) so a page refresh or a stray link that
 * causes a reload doesn't bounce you back to the login screen - this
 * was the root cause of "whatever I click it goes home": the user was
 * only ever in memory, so any reload wiped it and RequireLogin redirected.
 */
function loadStoredUser() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(loadStoredUser);

  function setUser(nextUser) {
    setUserState(nextUser);
    try {
      if (nextUser) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // sessionStorage unavailable (e.g. private mode edge case) - fall back to memory-only
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
