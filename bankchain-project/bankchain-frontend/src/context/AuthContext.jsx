import { createContext, useContext, useState } from 'react';
import { setAuthToken, clearAuthToken } from '../api.js';

const STORAGE_KEY = 'bankchain_user';

/**
 * Holds whoever is "logged in". Persisted to sessionStorage (tab-scoped,
 * cleared when the tab closes) so a page refresh or a stray link that
 * causes a reload doesn't bounce you back to the login screen - this
 * was the root cause of "whatever I click it goes home": the user was
 * only ever in memory, so any reload wiped it and RequireLogin redirected.
 *
 * The stored object's `token` is also pushed into api.js's in-memory
 * authToken, since that's a plain module (not a component) and can't read
 * this context directly - every /customer and /rm call needs it attached.
 */
function loadStoredUser() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed?.token) setAuthToken(parsed.token);
    return parsed;
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(loadStoredUser);

  function setUser(nextUser) {
    setUserState(nextUser);
    if (nextUser?.token) setAuthToken(nextUser.token);
    else clearAuthToken();
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
