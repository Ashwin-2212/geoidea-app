import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, setAuthToken, getAuthToken, setRefreshToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole, department?: string, avatar?: string, bio?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = getAuthToken();
      if (storedToken) {
        try {
          const u = await api.getMe();
          setUser(u);
          setToken(storedToken);
        } catch (e) {
          console.warn('Session expired or invalid token:', e);
          setAuthToken(null);
          setRefreshToken(null);
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setAuthToken(res.token);
    if (res.refreshToken) setRefreshToken(res.refreshToken);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string, role?: UserRole, department?: string, avatar?: string, bio?: string) => {
    const res = await api.register({ name, email, password, role, department, avatar, bio });
    setAuthToken(res.token);
    if (res.refreshToken) setRefreshToken(res.refreshToken);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    setAuthToken(null);
    setRefreshToken(null);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const u = await api.getMe();
        setUser(u);
      } catch (e) {
        // ignore
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

