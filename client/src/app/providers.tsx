import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, getToken, setToken, removeToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchDemoUser: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const token = getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data);
    } catch (err) {
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (payload: any) => {
    const res = await api.register(payload);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    api.logout().catch(() => {});
    removeToken();
    setUser(null);
  };

  const switchDemoUser = async (role: UserRole) => {
    const demoCredentials: Record<UserRole, { email: string; pass: string }> = {
      admin: { email: 'admin@edusathi.edu', pass: 'Admin@123' },
      teacher: { email: 'dr.rahim@edusathi.edu', pass: 'Teacher@123' },
      student: { email: 'student.arafat@edusathi.edu', pass: 'Student@123' },
    };

    const target = demoCredentials[role];
    await login(target.email, target.pass);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, switchDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
