'use client';
// src/context/AuthContext.jsx
// Replaces ASP.NET Session[].
// Stores JWT in localStorage. Decodes it to expose permissions.
// All components read permissions via useAuth() hook.

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const AuthContext = createContext(null);

// ── Decode JWT payload without a library ────────────────────────────────
function decodeJWT(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// ── Helper: "True" string or true boolean → true ─────────────────────────
function isTrue(val) {
  return val === true || val === 'True' || val === 'true';
}

export function AuthProvider({ children }) {
  const router = useRouter();
  const [token, setToken]   = useState(null);
  const [user, setUser]     = useState(null);   // decoded JWT payload
  const [loading, setLoading] = useState(true); // initial hydration

  // ── Hydrate from localStorage on mount ────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('jms_token');
    if (stored) {
      const decoded = decodeJWT(stored);
      // Check expiry
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setToken(stored);
        setUser(decoded);
      } else {
        localStorage.removeItem('jms_token');
      }
    }
    setLoading(false);
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    const response = await api.post('/login', { username, password });
    const { accessToken: newToken } = response.data;

    localStorage.setItem('jms_token', newToken);
    const decoded = decodeJWT(newToken);
    setToken(newToken);
    setUser(decoded);

    return response.data;
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post('/logout');
    } catch {
      // ignore — clear client state regardless
    }
    localStorage.removeItem('jms_token');
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  // ── Permission helpers — mirror original Session[] checks ──────────────
  //
  // Usage in any component:
  //   const { can, isAuthenticated } = useAuth();
  //   if (can('MPBasicMenu')) { ... }

  const can = useCallback((permissionKey) => {
    if (!user) return false;
    return isTrue(user[permissionKey]);
  }, [user]);

  // Check hub-type view permission
  // Mirrors: Session["MDRTRCViewSabeel"] == "Sabeel"
  const canViewHub = useCallback((hubType) => {
    if (!user) return false;
    const map = {
      Sabeel:   'MDRTRCViewSabeel',
      FMB:      'MDRTRCViewFMB',
      Vajebaat: 'MDRTRCViewVajebaat',
      Other:    'MDRTRCViewOther',
    };
    return user[map[hubType]] === hubType;
  }, [user]);

  const value = {
    token,
    user,
    loading,
    isAuthenticated: !!token && !!user,

    // Auth actions
    login,
    logout,

    // Permission checks
    can,
    canViewHub,

    // Shorthand permissions — most commonly used
    permissions: user ? {
      // Sidebar menu items
      MPBasicMenu:        isTrue(user.MPBasicMenu),
      MPDueDetails:       isTrue(user.MPDueDetails),
      MPSabeelStatistics: isTrue(user.MPSabeelStatistics),
      MPFMBStatistics:    isTrue(user.MPFMBStatistics),
      MPUtility:          isTrue(user.MPUtility),
      MPMohallah:         isTrue(user.MPMohallah),
      MPBooking:          isTrue(user.MPBooking),
      MPDistributor:      isTrue(user.MPDistributor),
      MPMuminDetails:     isTrue(user.MPMuminDetails),
      MPExpense:          isTrue(user.MPExpense),
      MPOhbatMajlis:      isTrue(user.MPOhbatMajlis),
      MPManagUser:        isTrue(user.MPManagUser),
      MPMuminTakhmeen:    isTrue(user.MPMuminTakhmeen),
      MPSafaiChitthi:     isTrue(user.MPSafaiChitthi),
      MPFollowupList:     isTrue(user.MPFollowupList),
      MPFMBDailyMenu:     isTrue(user.MPFMBDailyMenu),

      // Mumin Details
      MDEditTakhmeen:       isTrue(user.MDEditTakhmeen),
      MDDeleteTakhmeen:     isTrue(user.MDDeleteTakhmeen),
      MDEditReceipt:        isTrue(user.MDEditReceipt),
      MDNewInsert:          isTrue(user.MDNewInsert),
      MDVajUnlock:          isTrue(user.MDVajUnlock),
      MDHIMView:            isTrue(user.MDHIMView),
      MDSpeedVajebaatView:  isTrue(user.MDSpeedVajebaatView),
      MDVajebaatDetailsView:isTrue(user.MDVajebaatDetailsView),
      MDVajebaatTabView:    isTrue(user.MDVajebaatTabView),
      MDOtherTabView:       isTrue(user.MDOtherTabView),
      MDHideAllButtons:     isTrue(user.MDHideAllButtons),

      // Receipt
      URDelete: isTrue(user.URDelete),
      URCancel: isTrue(user.URCancel),
      UREdit:   isTrue(user.UREdit),

      // Daily Report
      DREdit:       isTrue(user.DREdit),
      DRViewSabeel: isTrue(user.DRViewSabeel),
      DRViewFMB:    isTrue(user.DRViewFMB),
      DRViewOther:  isTrue(user.DRViewOther),

      // General Due
      GDAccNo:        isTrue(user.GDAccNo),
      GDViewSabeel:   isTrue(user.GDViewSabeel),
      GDViewFMB:      isTrue(user.GDViewFMB),
      GDViewVajebaat: isTrue(user.GDViewVajebaat),
      GDViewOther:    isTrue(user.GDViewOther),

      // Booking
      BookingAdd:    isTrue(user.BookingAdd),
      BookingEdit:   isTrue(user.BookingEdit),
      BookingDelete: isTrue(user.BookingDelete),

      // Running years
      ForYearAll: user.ForYearAll ?? '',
      ForYearFMB: user.ForYearFMB ?? '',

      // Hub view
      viewSabeel:   user.MDRTRCViewSabeel   === 'Sabeel',
      viewFMB:      user.MDRTRCViewFMB      === 'FMB',
      viewVajebaat: user.MDRTRCViewVajebaat === 'Vajebaat',
      viewOther:    user.MDRTRCViewOther    === 'Other',
    } : {},
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
