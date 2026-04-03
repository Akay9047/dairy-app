import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../lib/api";
 
interface Admin {
  id: string;
  name: string;
  username: string;
  role?: string;
  language?: string;
  dairyId?: string;
  dairyName?: string;
  rateConfig?: {
    fatRatePerKg: number;
    snfRatePerKg: number;
    minRatePerLiter: number;
    useMinRate: boolean;
    milkType?: string;
  };
}
 
interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  superLogin: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
 
const AuthContext = createContext<AuthContextType | null>(null);
 
// Alag alag keys — super admin aur admin ek dusre ko overwrite nahi karenge
const ADMIN_TOKEN_KEY = "dairy_admin_token";
const ADMIN_DATA_KEY = "dairy_admin_data";
const SA_TOKEN_KEY = "dairy_sa_token";
const SA_DATA_KEY = "dairy_sa_data";
 
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
 
  useEffect(() => {
    // Check current page to decide which session to load
    const isSuperPage = window.location.pathname.startsWith("/super");
 
    if (isSuperPage) {
      const saToken = localStorage.getItem(SA_TOKEN_KEY);
      const saData = localStorage.getItem(SA_DATA_KEY);
      if (saToken && saData) {
        setToken(saToken);
        setAdmin(JSON.parse(saData));
      }
    } else {
      const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
      const adminData = localStorage.getItem(ADMIN_DATA_KEY);
      if (adminToken && adminData) {
        setToken(adminToken);
        setAdmin(JSON.parse(adminData));
      }
    }
    setIsLoading(false);
  }, []);
 
  const login = async (username: string, password: string) => {
    const data = await authApi.login({ username, password });
    const adminObj = { ...data.admin, role: "admin" };
    localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(adminObj));
    setToken(data.token);
    setAdmin(adminObj);
  };
 
  const superLogin = async (username: string, password: string) => {
    const data = await authApi.superLogin({ username, password });
    const saObj = { ...data.superAdmin, role: "superadmin" };
    localStorage.setItem(SA_TOKEN_KEY, data.token);
    localStorage.setItem(SA_DATA_KEY, JSON.stringify(saObj));
    setToken(data.token);
    setAdmin(saObj);
  };
 
  const logout = () => {
    const isSuperPage = window.location.pathname.startsWith("/super");
    if (isSuperPage) {
      localStorage.removeItem(SA_TOKEN_KEY);
      localStorage.removeItem(SA_DATA_KEY);
    } else {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_DATA_KEY);
    }
    setToken(null);
    setAdmin(null);
  };
 
  return (
    <AuthContext.Provider value={{ admin, token, login, superLogin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
 
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
 