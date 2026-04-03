import { createContext, useContext, useState } from "react";
import { apiFetch, setTokens, clearTokens } from "../api";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // -------- LOGIN --------
  const login = async (email, password) => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });

    // Expect backend to return:
    // { access_token, refresh_token, user }
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);

    return data.user; // IMPORTANT for LoginPage
  };

  // -------- LOGOUT --------
  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
