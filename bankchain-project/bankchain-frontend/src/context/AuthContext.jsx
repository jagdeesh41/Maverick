import { createContext, useContext, useState } from 'react';

/**
 * Holds whoever is "logged in" for the lifetime of the browser tab.
 * Nothing here is persisted (no localStorage) — refreshing the page
 * logs you out, on purpose, since auth itself is mocked.
 *
 * Shape: { userId, username, fullName, role } — userId + role are the
 * two things every API call in api.js actually needs.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

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
