'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const AuthContext = createContext(null);

function decodeJWT(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const router = useRouter();
  const [token, setToken]     = useState(null);
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('jms_token');
    if (stored) {
      const decoded = decodeJWT(stored);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setToken(stored);
        setUser(decoded);
      } else {
        localStorage.removeItem('jms_token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    const response = await api.post('/login', { username, password });
    const { accessToken: newToken } = response.data;
    localStorage.setItem('jms_token', newToken);
    const decoded = decodeJWT(newToken);
    setToken(newToken);
    setUser(decoded);
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/logout'); } catch {}
    localStorage.removeItem('jms_token');
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  // Usage: can('bookings.create'), can('users.view')
  const can = useCallback((permissionCode) => {
    if (!user) return false;
    if (Array.isArray(user.roles) && user.roles.includes('super_admin')) return true;
    return Array.isArray(user.permissions) && user.permissions.includes(permissionCode);
  }, [user]);

  // hasScope — empty array means no restriction (user sees everything for that type).
  // super_admin bypasses all scope checks.
  const hasScope = useCallback((type, value) => {
    if (!user) return false;
    if (Array.isArray(user.roles) && user.roles.includes('super_admin')) return true;
    const vals = user.scopes?.[type];
    if (!Array.isArray(vals) || vals.length === 0) return true;
    return vals.map(v => v.toLowerCase()).includes(value.toLowerCase());
  }, [user]);

  const canViewHub = useCallback((hubType) => {
    if (!user) return false;
    return hasScope('HubMainHead', hubType);
  }, [user, hasScope]);

  const hasRole = useCallback((roleCode) => {
    if (!user) return false;
    return Array.isArray(user.roles) && user.roles.includes(roleCode);
  }, [user]);

  const value = {
    token,
    user,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    can,
    hasScope,
    canViewHub,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
