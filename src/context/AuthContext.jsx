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

// Legacy: "True" string or boolean true → true (used for backward-compat flags in JWT)
function isTrue(val) {
  return val === true || val === 'True' || val === 'true';
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

  // ── New RBAC permission check (module.action codes) ───────────────────────
  // Usage: can('bookings.create'), can('users.view')
  const can = useCallback((permissionCode) => {
    if (!user) return false;
    // super_admin bypasses all permission checks
    if (Array.isArray(user.roles) && user.roles.includes('super_admin')) return true;
    // New format: permissions is an array of codes
    if (Array.isArray(user.permissions)) {
      return user.permissions.includes(permissionCode);
    }
    // Legacy fallback: boolean/string fields in JWT (old format)
    return isTrue(user[permissionCode]);
  }, [user]);

  // Hub-type scope check — new: scopes.hub[], legacy: MDRTRCView* string fields
  const canViewHub = useCallback((hubType) => {
    if (!user) return false;
    const key = hubType.toLowerCase();

    // New format: scopes.hub array
    if (user.scopes?.hub) {
      return user.scopes.hub.includes(key);
    }

    // Legacy fallback
    const legacyMap = {
      Sabeel: 'MDRTRCViewSabeel', FMB: 'MDRTRCViewFMB',
      Vajebaat: 'MDRTRCViewVajebaat', Other: 'MDRTRCViewOther',
    };
    return user[legacyMap[hubType]] === hubType;
  }, [user]);

  // Convenience: check if user has any of the given roles
  const hasRole = useCallback((roleCode) => {
    if (!user) return false;
    return Array.isArray(user.roles) && user.roles.includes(roleCode);
  }, [user]);

  // ── Backward-compat permissions map (for existing pages that use permissions.MP*) ──
  const permissions = user ? (() => {
    const p = user.permissions;        // new array, or undefined
    const isSuperAdmin = Array.isArray(user.roles) && user.roles.includes('super_admin');
    const has = (code) => isSuperAdmin || (Array.isArray(p) ? p.includes(code) : isTrue(user[code]));
    const hub  = user.scopes?.hub || [];
    const inHub = (type) => isSuperAdmin || hub.length === 0 || hub.includes(type.toLowerCase());

    return {
      // ── Sidebar menu ──
      MPBasicMenu:        has('member_search.view') || has('receipt_quick.create') || has('daily_report.view') || isTrue(user.MPBasicMenu),
      MPDueDetails:       has('due.view')                || isTrue(user.MPDueDetails),
      MPSabeelStatistics: has('sabeel_stats.view')       || isTrue(user.MPSabeelStatistics),
      MPFMBStatistics:    has('fmb_stats.view')          || isTrue(user.MPFMBStatistics),
      MPUtility:          has('utility.view')            || isTrue(user.MPUtility),
      MPMohallah:         has('mohallah.view')           || isTrue(user.MPMohallah),
      MPBooking:          has('bookings.view') || has('seating.view') || isTrue(user.MPBooking),
      MPDistributor:      has('distribution.view')       || isTrue(user.MPDistributor),
      MPMuminDetails:     has('members.view')            || isTrue(user.MPMuminDetails),
      MPExpense:          has('expenses.view')           || isTrue(user.MPExpense),
      MPOhbatMajlis:      has('ohbat_majlis.view') || has('majlis.view') || isTrue(user.MPOhbatMajlis),
      MPManagUser:        has('users.view')              || isTrue(user.MPManagUser),
      MPMuminTakhmeen:    has('takhmeen.report_view')    || isTrue(user.MPMuminTakhmeen),
      MPSafaiChitthi:     has('safai.view')              || isTrue(user.MPSafaiChitthi),
      MPFollowupList:     has('followup.view')           || isTrue(user.MPFollowupList),
      MPFMBDailyMenu:     has('fmb_menu.view')           || isTrue(user.MPFMBDailyMenu),

      // ── Mumin Details ──
      MDEditTakhmeen:        has('takhmeen.edit')                    || isTrue(user.MDEditTakhmeen),
      MDDeleteTakhmeen:      has('takhmeen.delete')                  || isTrue(user.MDDeleteTakhmeen),
      MDEditReceipt:         has('receipts.edit')                    || isTrue(user.MDEditReceipt),
      MDNewInsert:           has('members.add') || has('receipts.create') || isTrue(user.MDNewInsert),
      MDEditProfile:         has('members.edit')                     || isTrue(user.MDEditProfile),
      MDResetPassword:       has('members.reset_password')           || isTrue(user.MDResetPassword),
      MDVajUnlock:           has('members.vajebaat_unlock')          || isTrue(user.MDVajUnlock),
      MDHIMView:             has('members.view_him')                 || isTrue(user.MDHIMView),
      MDSpeedVajebaatView:   has('members.quick_entry')              || isTrue(user.MDSpeedVajebaatView),
      MDVajebaatDetailsView: has('members.view_vajebaat_details')    || isTrue(user.MDVajebaatDetailsView),
      MDVajebaatTabView:     has('members.view_vajebaat_tab')        || isTrue(user.MDVajebaatTabView),
      MDSafaiChitthiTabView: has('members.view.safaichitthi_tab')    || isTrue(user.MDSafaiChitthiTabView),
      MDAddSafai:            has('members.create.razachitthitab')    || isTrue(user.MDAddSafai),
      MDEditSafai:           has('safai.edit')                       || isTrue(user.MDEditSafai),
      MDDeleteSafai:         has('safai.delete')                     || isTrue(user.MDDeleteSafai),
      MDSafaiPrint:          has('safai.print')                      || isTrue(user.MDSafaiPrint),
      MDEditFMB:            has('members.edit_fmb')                  || isTrue(user.MDEditFMB),
      MDPrintFMB:           has('members.print_fmb')                 || isTrue(user.MDPrintFMB),
      MDOverallDue:         has('members.print_overalldue')          || isTrue(user.MDOverallDue),
      // ⚠ Restriction flag — must NOT use has() because has() returns true for super_admin on every code.
      // Only activate this if it is explicitly assigned on the user's own permission list.
      MDHideAllButtons:      (Array.isArray(p) ? p.includes('members.hide_actions') : isTrue(user.MDHideAllButtons)),

      // ── Receipts ──
      URDelete: has('receipts.delete') || isTrue(user.URDelete),
      URCancel: has('receipts.cancel') || isTrue(user.URCancel),
      UREdit:   has('receipts.edit')   || isTrue(user.UREdit),

      // ── Daily Report ──
      DREdit:       has('daily_report.edit')                             || isTrue(user.DREdit),
      DRViewSabeel: (has('daily_report.view') && inHub('sabeel'))        || isTrue(user.DRViewSabeel),
      DRViewFMB:    (has('daily_report.view') && inHub('fmb'))           || isTrue(user.DRViewFMB),
      DRViewOther:  (has('daily_report.view') && inHub('other'))         || isTrue(user.DRViewOther),

      // ── Due ──
      GDAccNo:        has('due.view_account_no')                         || isTrue(user.GDAccNo),
      GDViewSabeel:   (has('due.view') && inHub('sabeel'))               || isTrue(user.GDViewSabeel),
      GDViewFMB:      (has('due.view') && inHub('fmb'))                  || isTrue(user.GDViewFMB),
      GDViewVajebaat: (has('due.view') && inHub('vajebaat'))             || isTrue(user.GDViewVajebaat),
      GDViewOther:    (has('due.view') && inHub('other'))                || isTrue(user.GDViewOther),

      // ── Bookings ──
      BookingAdd:    has('bookings.create') || isTrue(user.BookingAdd),
      BookingEdit:   has('bookings.edit')   || isTrue(user.BookingEdit),
      BookingDelete: has('bookings.delete') || isTrue(user.BookingDelete),
      BookingPrint: has('bookings.print_safaichitthi') || isTrue(user.BookingPrint),
      RazaStatus:    has('bookings.update_raza') || has('safai.update_raza') || isTrue(user.RazaStatus),

      // ── Safai Chitthi ──
      
      SafaiEdit:   has('safai.edit')   || isTrue(user.SafaiEdit),
      SafaiDelete: has('safai.delete') || isTrue(user.SafaiDelete),
      SafaiPrint: has('safai.print') || isTrue(user.SafaiPrint),
      // RazaStatus:    has('bookings.update_raza') || has('safai.update_raza') || isTrue(user.RazaStatus),

      // ── Hub view ──
      viewSabeel:   canViewHub('Sabeel'),
      viewFMB:      canViewHub('FMB'),
      viewVajebaat: canViewHub('Vajebaat'),
      viewOther:    canViewHub('Other'),

      // ── Running years ──
      ForYearAll: user.ForYearAll ?? '',
      ForYearFMB: user.ForYearFMB ?? '',
    };
  })() : {};

  const value = {
    token,
    user,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    can,
    canViewHub,
    hasRole,
    permissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
