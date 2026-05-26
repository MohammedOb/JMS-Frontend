'use client';
// src/app/(dashboard)/layout.jsx
// Protects all dashboard routes — authentication + permission guard.

import { useEffect, useState }  from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth }              from '@/context/AuthContext';
import Sidebar                  from '@/components/layout/Sidebar';
import Topbar                   from '@/components/layout/Topbar';
import PermissionGuard          from '@/components/shared/PermissionGuard';

// Route → can() code(s). null = always accessible when authenticated.
// Arrays use OR logic (any match grants access).
const ROUTE_PERMISSIONS = {
  '/dashboard':            ['member_search.view', 'receipt_quick.create', 'daily_report.view'],
  '/add-receipt':          'receipt_quick.create',
  '/daily-report':         'daily_report.view',
  '/mumin-search':         'members.view',
  '/takhmeen-not-done':    'takhmeen.report_view',
  '/notifications':        'notifications.view',
  '/mumin-details':        'members.view',
  '/mumin-takhmeen':       'takhmeen.report_view',
  '/due-details':          'due.view',
  '/followup':             'followup.view',
  '/sabeel-statistics':    'sabeel_stats.view',
  '/fmb-statistics':       'fmb_stats.view',
  '/expense-report':       'expenses.view',
  '/income-expense-heads': 'expenses.view',
  '/distribution':         'distribution.view',
  '/mohallah':             'mohallah.view',
  '/seating-layout':       'seating.view',
  '/calendar':             ['bookings.view', 'seating.view'],
  '/ohbat-majlis':         ['ohbat_majlis.view', 'majlis.view'],
  '/majlis':               ['ohbat_majlis.view', 'majlis.view'],
  '/event-forms':          'forms.view',
  '/safai-chitthi':        'safai.view',
  '/musaida':              'musaida.view',
  '/fmb-daily-menu':       'fmb_menu.view',
  '/access-control':       'users.view',
  '/system-variables':     'utility.view',
  '/utility':              'utility.view',
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
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          <PermissionGuard permission={requiredPermission}>
            {children}
          </PermissionGuard>
        </main>
      </div>
    </div>
  );
}
