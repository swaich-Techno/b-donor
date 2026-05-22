import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { setAuthToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("bDonorToken"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    setAuthToken(token);
    if (!token) {
      setLoading(false);
      return;
    }

    api.get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem("bDonorToken");
        setToken(null);
        setAuthToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function login(payload) {
    const res = await api.post("/auth/login", payload);
    localStorage.setItem("bDonorToken", res.data.token);
    setAuthToken(res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  async function register(payload) {
    const res = await api.post("/auth/register", payload);
    localStorage.setItem("bDonorToken", res.data.token);
    setAuthToken(res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem("bDonorToken");
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    const res = await api.get("/auth/me");
    setUser(res.data.user);
    return res.data.user;
  }

  const value = useMemo(() => ({
    token,
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: Boolean(token && user)
  }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
