'use client';
// src/components/layout/Sidebar.jsx
// Permission-based sidebar nav — mirrors BootStrapSidebarMaster.cs MainMenuVisible()
// Each nav item only renders if the user has the corresponding permission.

import Link              from 'next/link';
import { usePathname }   from 'next/navigation';
import { useAuth }       from '@/context/AuthContext';
import clsx              from 'clsx';
import {
  DashboardIcon, ReceiptIcon, BarChartIcon, SearchIcon, AlertTriangleIcon,
  BellIcon, UsersIcon, CoinsIcon, AlertCircleIcon, ClipboardListIcon,
  TrendingUpIcon, TrendingDownIcon, CreditCardIcon, FileTextIcon, TruckIcon,
  MapPinIcon, CalendarIcon, StarIcon, ListIcon, MailIcon, GiftIcon,
  UtensilsIcon, UserCogIcon, SettingsIcon, MosqueIcon, LogoutIcon,
  ChevronRightIcon,
} from '@/components/shared/Icons';

// ── Nav config — mirrors LinkButton visibility rules in Master.cs ─────────
// permission: key from permissions object (null = always visible)
const NAV_SECTIONS = [
  {
    label: 'Core',
    items: [
      { label: 'Dashboard',         href: '/dashboard',           icon: DashboardIcon,      permission: null },
      { label: 'Add Receipt',        href: '/add-receipt',         icon: ReceiptIcon,        permission: 'MPBasicMenu' },
      { label: 'Daily Report',       href: '/daily-report',        icon: BarChartIcon,       permission: 'MPBasicMenu' },
      { label: 'Member Search',      href: '/mumin-search',        icon: SearchIcon,         permission: 'MPBasicMenu' },
      { label: 'Takhmeen Not Done',  href: '/takhmeen-not-done',   icon: AlertTriangleIcon,  permission: 'MPBasicMenu' },
      { label: 'Notifications',      href: '/notifications',       icon: BellIcon,           permission: 'MPBasicMenu' },
    ],
  },
  {
    label: 'Members',
    items: [
      { label: 'Mumin Details',     href: '/mumin-details',      icon: UsersIcon,    permission: 'MPMuminDetails' },
      { label: 'Mumin Takhmeen',    href: '/mumin-takhmeen',     icon: CoinsIcon,    permission: 'MPMuminTakhmeen' },
    ],
  },
  {
    label: 'Reports & Due',
    items: [
      { label: 'Due Details',        href: '/due-details',        icon: AlertCircleIcon,  permission: 'MPDueDetails' },
      { label: 'Follow Up List',     href: '/followup',           icon: ClipboardListIcon, permission: 'MPFollowupList' },
      { label: 'Sabeel Statistics',  href: '/sabeel-statistics',  icon: TrendingUpIcon,   permission: 'MPSabeelStatistics' },
      { label: 'FMB Statistics',     href: '/fmb-statistics',     icon: TrendingDownIcon, permission: 'MPFMBStatistics' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Expenses',          href: '/expenses',           icon: CreditCardIcon, permission: 'MPExpense' },
      { label: 'Expense Report',    href: '/expense-report',     icon: FileTextIcon,   permission: 'MPExpense' },
      { label: 'Distribution List', href: '/distribution',       icon: TruckIcon,      permission: 'MPDistributor' },
    ],
  },
  {
    label: 'Community',
    items: [
      { label: 'Mohallah Details',  href: '/mohallah',           icon: MapPinIcon,    permission: 'MPMohallah' },
      { label: 'Bookings',          href: '/calendar',            icon: CalendarIcon,  permission: 'MPBooking' },
      { label: 'Ohbat Majlis',      href: '/ohbat-majlis',       icon: StarIcon,      permission: 'MPOhbatMajlis' },
      { label: 'Majlis List',       href: '/majlis',             icon: ListIcon,      permission: 'MPOhbatMajlis' },
      { label: 'Safai Chitthi',     href: '/safai-chitthi',      icon: MailIcon,      permission: 'MPSafaiChitthi' },
      { label: 'Musaida List',      href: '/musaida',            icon: GiftIcon,      permission: null },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'FMB Daily Menu',    href: '/fmb-daily-menu',     icon: UtensilsIcon,  permission: 'MPFMBDailyMenu' },
      { label: 'Manage Users',      href: '/manage-users',       icon: UserCogIcon,   permission: 'MPManagUser' },
      { label: 'Utility',           href: '/utility',            icon: SettingsIcon,  permission: 'MPUtility' },
    ],
  },
];

function NavItem({ item, active }) {
  const IconComp = item.icon;
  return (
    <Link
      href={item.href}
      className={clsx(
        'flex items-center gap-2.5 px-2.5 py-[7px] mx-2 rounded-md text-[12.5px] transition-all duration-150 group',
        active
          ? 'bg-blue-500/20 text-white'
          : 'text-white/60 hover:bg-white/[0.06] hover:text-white/80'
      )}
    >
      <span className={clsx(
        'w-4 h-4 flex-shrink-0 transition-colors flex items-center justify-center',
        active ? 'text-blue-300' : 'text-white/30 group-hover:text-white/50'
      )}>
        <IconComp className="w-4 h-4" />
      </span>
      <span className="truncate leading-none">{item.label}</span>

      {/* Active indicator bar */}
      {active && (
        <span className="ml-auto w-1 h-4 bg-blue-400 rounded-full flex-shrink-0" />
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, permissions, logout } = useAuth();

  // Initials from username
  const initials = (user?.username || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
<<<<<<< HEAD
    <>
      {/* Mobile backdrop — tap outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile pull ribbon — hidden on md+ */}
      <button
        className={clsx(
          'fixed top-1/2 -translate-y-1/2 z-[51] md:hidden',
          'w-5 h-14 bg-navy-800 rounded-r-lg',
          'border border-l-0 border-blue-500/40',
          'flex items-center justify-center shadow-lg',
          'text-blue-300 transition-all duration-300 ease-in-out',
          isOpen ? 'left-[228px]' : 'left-0'
        )}
        onClick={() => setIsOpen(v => !v)}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <ChevronRightIcon className={clsx('w-3.5 h-3.5 transition-transform duration-300', isOpen && 'rotate-180')} />
      </button>

      <aside
        className={clsx(
          'fixed left-0 top-0 bottom-0 w-[228px] bg-navy-800 flex flex-col z-50',
          'shadow-[4px_0_24px_rgba(6,15,30,0.3)]',
          'border-r border-blue-500/20',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:-translate-x-[220px]'
        )}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
=======
    <aside className="fixed left-0 top-0 bottom-0 w-[228px] bg-navy-800 flex flex-col z-50
                      shadow-[4px_0_24px_rgba(6,15,30,0.3)]">
>>>>>>> parent of 9c097b08 (yes)

      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/[0.06] flex-shrink-0 h-[52px]">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center
                        text-white flex-shrink-0 shadow-md">
          <MosqueIcon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
        </div>
        <div>
          <div className="font-display text-[14px] font-bold text-white tracking-tight leading-none">
            JMS
          </div>
          <div className="text-[9px] text-white/25 uppercase tracking-widest mt-0.5">
            Jamaat System
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2
                      scrollbar-thin scrollbar-thumb-white/10">
        {NAV_SECTIONS.map((section) => {
          // Filter items by permission
          const visible = section.items.filter(item => {
            if (!item.permission) return true;
            return permissions[item.permission] === true;
          });

          if (visible.length === 0) return null;

          return (
            <div key={section.label} className="mb-1">
              {/* Section label */}
              <div className="px-4 pt-3 pb-1 text-[9px] font-semibold tracking-[1.1px]
                              uppercase text-white/22">
                {section.label}
              </div>
              {visible.map(item => (
                <NavItem
                  key={item.href}
                  item={item}
                  active={pathname === item.href || pathname.startsWith(item.href + '/')}
                />
              ))}
            </div>
          );
        })}
      </nav>

      {/* User / Logout footer */}
      <div className="border-t border-white/[0.06] px-3 py-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-navy-700 border border-white/10
                          flex items-center justify-center text-blue-300 text-xs
                          font-semibold font-display flex-shrink-0">
            {initials}
          </div>
          {/* Name */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-white/28 uppercase tracking-wide">Logged in</div>
            <div className="text-[12px] font-medium text-white/75 truncate">
              {user?.username || 'User'}
            </div>
          </div>
          {/* Logout */}
          <button
            onClick={logout}
            title="Sign out"
            className="w-7 h-7 flex items-center justify-center rounded-md
                       bg-white/[0.06] text-white/38
                       hover:bg-red-500/20 hover:text-red-400 transition-all"
          >
            <LogoutIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
