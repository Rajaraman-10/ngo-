import { createContext, useContext, useEffect, useState } from "react";
import { api, isAuthenticated, login as apiLogin, logout as apiLogout } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    if (!isAuthenticated()) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const { data } = await api.get("/accounts/users/me/");
      setUser(data);
      return data;
    } catch {
      apiLogout();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function login(username, password) {
    await apiLogin(username, password);
    return loadMe();
  }

  function logout() {
    apiLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
