import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { pathToPermissionKey } from "@shared/api";

interface LoginResult {
  success: boolean;
  error?: string;
  remainingAttempts?: number;
  locked?: boolean;
  lockedUntil?: number;
  remainingMs?: number;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[] | null;
  userId: number | null;
  userName: string | null;
  canAccess: (pathname: string) => boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

const SESSION_DURATION = 24 * 60 * 60 * 1000;

interface StoredSession {
  token: string;
  expiresAt: number;
  permissions?: string[] | null;
  userId?: number | null;
  userName?: string | null;
}

function getStoredSession(): StoredSession | null {
  try {
    const stored = localStorage.getItem("adminSession");
    if (!stored) return null;
    const session: StoredSession = JSON.parse(stored);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem("adminSession");
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem("adminSession");
    return null;
  }
}

function setStoredSession(token: string, permissions: string[] | null, userId?: number | null, userName?: string | null): void {
  const session: StoredSession = {
    token: token,
    expiresAt: Date.now() + SESSION_DURATION,
    permissions: permissions ?? null,
    userId: userId ?? null,
    userName: userName ?? null,
  };
  localStorage.setItem("adminSession", JSON.stringify(session));
}

function clearStoredSession(): void {
  localStorage.removeItem("adminSession");
  localStorage.removeItem("adminToken");
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getStoredSession();
    if (session && session.token) {
      setIsAuthenticated(true);
      setPermissions(session.permissions ?? null);
      setUserId(session.userId ?? null);
      setUserName(session.userName ?? null);
    }
    setIsLoading(false);
  }, []);

  const canAccess = useMemo(() => {
    return (pathname: string): boolean => {
      if (permissions === null) return true;
      const key = pathToPermissionKey(pathname);
      if (!key) return false;
      return permissions.includes(key);
    };
  }, [permissions]);

  const login = async (username: string, password: string): Promise<LoginResult> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const perms = data.user?.permissions ?? null;
        const userIdFromResponse = data.user?.id ?? null;
        const userNameFromResponse = data.user?.name ?? data.user?.username ?? null;
        setStoredSession(data.token, perms, userIdFromResponse, userNameFromResponse);
        setPermissions(perms);
        setUserId(userIdFromResponse);
        setUserName(userNameFromResponse);
        setIsAuthenticated(true);
        return { success: true };
      }
      return {
        success: false,
        error: data.error,
        remainingAttempts: data.remainingAttempts,
        locked: data.locked,
        lockedUntil: data.lockedUntil,
        remainingMs: data.remainingMs,
      };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Giriş yapılırken bir hata oluştu" };
    }
  };

  const logout = async () => {
    try {
      // Logout API'sini çağır
      const stored = localStorage.getItem("adminSession");
      if (stored) {
        const session = JSON.parse(stored);
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearStoredSession();
      setIsAuthenticated(false);
      setPermissions(null);
      setUserId(null);
      setUserName(null);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{ isAuthenticated, isLoading, permissions, userId, userName, canAccess, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}

