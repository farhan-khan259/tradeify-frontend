import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, setToken } from "../api/client";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  register: (data: RegisterData) => Promise<User | null>;
  logout: () => void;
  refresh: () => Promise<User | null>;
  updateBalance: (balance: number) => void;
}

interface RegisterData {
  email: string;
  full_name: string;
  password: string;
  referral_code?: string;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh(): Promise<User | null> {
    try {
      const { data } = await api.get<User>("/auth/me");
      setUser(data);
      return data;
    } catch {
      setUser(null);
      return null;
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    // OAuth2 password flow expects form-encoded username/password.
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    const { data } = await api.post("/auth/login", form);
    setToken(data.access_token);
    return await refresh();
  }

  async function register(payload: RegisterData) {
    await api.post("/auth/register", payload);
    return await login(payload.email, payload.password);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  function updateBalance(balance: number) {
    setUser((prev) => (prev ? { ...prev, balance } : prev));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
