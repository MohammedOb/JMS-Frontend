'use client';
// src/app/(dashboard)/layout.jsx
// Protects all dashboard routes — authentication + permission guard.

import { useEffect, useState }  from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth }              from '@/context/AuthContext';
import Sidebar                  from '@/components/layout/Sidebar';
import Topbar                   from '@/components/layout/Topbar';
import PermissionGuard          from '@/components/shared/PermissionGuard';

// Route → MP* permission key. null = always accessible when authenticated.
const ROUTE_PERMISSIONS = {
  '/dashboard':            'MPBasicMenu',
  '/add-receipt':          'MPBasicMenu',
  '/daily-report':         'MPBasicMenu',
  '/mumin-search':         'MPMuminDetails',
  '/takhmeen-not-done':    'MPMuminTakhmeen',
  '/notifications':        'MPnotifications',
  '/mumin-details':        'MPMuminDetails',
  '/mumin-takhmeen':       'MPMuminTakhmeen',
  '/due-details':          'MPMuminTakhmeen',
  '/followup':             'MPFollowupList',
  '/sabeel-statistics':    'MPSabeelStatistics',
  '/fmb-statistics':       'MPFMBStatistics',
  '/expense-report':       'MPExpense',
  '/income-expense-heads': 'MPExpense',
  '/distribution':         'MPDistributor',
  '/mohallah':             'MPMohallah',
  '/seating-layout':       'MPSeatingLayout',
  '/calendar':             'MPBooking',
  '/ohbat-majlis':         'MPOhbatMajlis',
  '/majlis':               'MPOhbatMajlis',
  '/safai-chitthi':        'MPSafaiChitthi',
  '/musaida':              'MPMusaida',
  '/fmb-daily-menu':       'MPFMBDailyMenu',
  '/access-control':       'MPManagUser',
  '/utility':              'MPUtility',
};

export default function DashboardLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const requiredPermission = Object.entries(ROUTE_PERMISSIONS)
    .find(([route]) => pathname === route || pathname.startsWith(route + '/'))
    ?.[1] ?? null;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent
                          rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarOpen ? '228px' : '0px' }}
      >
        <Topbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(v => !v)} />
        <main className="flex-1 overflow-y-auto p-6">
          <PermissionGuard permission={requiredPermission}>
            {children}
          </PermissionGuard>
        </main>
      </div>
    </div>
  );
}
