'use client';
// src/components/layout/Topbar.jsx

import { usePathname } from 'next/navigation';
import { useAuth }     from '@/context/AuthContext';

// Map routes to page titles
const PAGE_TITLES = {
  '/dashboard':        'Dashboard',
  '/add-receipt':      'Add Receipt',
  '/daily-report':     'Daily Report',
  '/mumin-search':     'Member Search',
  '/mumin-details':    'Mumin Details',
  '/mumin-takhmeen':   'Mumin Takhmeen',
  '/takhmeen-not-done':'Takhmeen Not Done',
  '/due-details':      'Due Details',
  '/followup':         'Follow Up List',
  '/sabeel-statistics':'Sabeel Statistics',
  '/fmb-statistics':   'FMB Statistics',
  '/expenses':         'Expenses',
  '/expense-report':   'Expense Report',
  '/distribution':     'Distribution List',
  '/mohallah':         'Mohallah Details',
  '/calendar':         'Bookings & Calendar',
  '/ohbat-majlis':     'Ohbat Majlis',
  '/majlis':           'Majlis List',
  '/safai-chitthi':    'Safai Chitthi',
  '/musaida':          'Musaida List',
  '/fmb-daily-menu':   'FMB Daily Menu',
  '/manage-users':     'Manage Users',
  '/utility':           'Utility',
  '/notifications':     'Notifications',
  '/system-variables':  'System Variables',
};

export default function Topbar({ sidebarOpen, onToggleSidebar }) {
  const pathname  = usePathname();
  const { user } = useAuth();

  const pageTitle = PAGE_TITLES[pathname] || 'JMS';

  return (
    <header className="h-[52px] bg-white border-b border-border flex items-center
                       px-4 gap-3 flex-shrink-0 shadow-sm z-40">

      {/* Sidebar toggle button */}
      <button
        onClick={onToggleSidebar}
        className="w-8 h-8 flex items-center justify-center rounded-md
                   text-gray-400 hover:text-navy-900 hover:bg-surface
                   transition-colors flex-shrink-0"
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {sidebarOpen ? (
          // X icon
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          // Hamburger icon
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        )}
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="font-display text-[13px] font-bold text-navy-900 flex items-center gap-1.5">
          🕌 JMS
        </span>
        <span className="text-slate-200 text-lg font-light">/</span>
        <span className="text-[12.5px] text-gray-400">{pageTitle}</span>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">

        {/* Running Year indicator */}
        {user?.ForYearAll && (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-500
                          bg-surface border border-border rounded-full px-3 py-1">
            <span className="text-gray-400">Year:</span>
            <span className="font-semibold text-navy-900">{user.ForYearAll}</span>
            {user.ForYearFMB && user.ForYearFMB !== user.ForYearAll && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-gray-400">FMB:</span>
                <span className="font-semibold text-navy-900">{user.ForYearFMB}</span>
              </>
            )}
          </div>
        )}

        {/* Connected status */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500
                        bg-surface border border-border rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500
                           shadow-[0_0_0_2px_rgba(34,197,94,0.2)] animate-pulse" />
          Connected
        </div>

        {/* Username */}
        <div className="text-[12px] text-gray-500 font-medium hidden md:block">
          {user?.username}
        </div>
      </div>
    </header>
  );
}
