import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiFetch, saveSession, clearSession, getSession } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // { token, user: {employee_id, role, name} }
  const [loading, setLoading] = useState(true); // читаем AsyncStorage при старте
  const [loginError, setLoginError] = useState(null);

  useEffect(() => {
    getSession().then((s) => {
      setSession(s);
      setLoading(false);
    });
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
    setSession(null);
  }, []);

  const login = useCallback(async (loginValue, password) => {
    setLoginError(null);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ login: loginValue, password }),
      });
      const user = {
        employee_id: data.employee_id,
        role: data.role,
        name: data.name,
      };
      await saveSession(data.access_token, user);
      setSession({ token: data.access_token, user });
      return true;
    } catch (err) {
      setLoginError(err.message);
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, login, logout, loginError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth должен использоваться внутри <AuthProvider>");
  return ctx;
}

/** Хелпер: вызывать из apiFetch(..., onSessionExpired) внутри экранов. */
export function useApiFetch() {
  const { logout } = useAuth();
  return (path, options) => apiFetch(path, options, logout);
}
