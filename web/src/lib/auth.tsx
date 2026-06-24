import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, getToken, setToken, clearToken } from './api';

interface AuthState {
  isAuthenticated: boolean;
  admin: { id: number; username: string; display_name: string | null } | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AuthState['admin']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api.getMe()
      .then((data) => setAdmin(data))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const data = await api.login(username, password);
    setToken(data.token);
    setAdmin(data.admin);
  };

  const logout = () => {
    clearToken();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!admin, admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
