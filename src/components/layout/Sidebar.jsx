'use client';
// src/components/layout/Sidebar.jsx

import Link             from 'next/link';
import Image            from 'next/image';
import { useState }     from 'react';
import { usePathname }  from 'next/navigation';
import { useAuth }      from '@/context/AuthContext';
import clsx             from 'clsx';
import {
  DashboardIcon, ReceiptIcon, BarChartIcon, SearchIcon, AlertTriangleIcon,
  BellIcon, UsersIcon, CoinsIcon, AlertCircleIcon, ClipboardListIcon,
  CreditCardIcon, FileTextIcon, TruckIcon,
  MapPinIcon, CalendarIcon, ListIcon, MailIcon,
  UtensilsIcon, UserCogIcon, SettingsIcon, LogoutIcon, LayersIcon, TableIcon,
  MessageIcon, SmartphoneIcon, ZapIcon, InboxIcon, ChevronDownIcon, SendIcon,
  DatabaseIcon, PaletteIcon, PrintIcon,
} from '@/components/shared/Icons';

// ── Nav config ─────────────────────────────────────────────────────────────
// permission: string | string[] (OR logic) | null (always visible)
// Sections can use flat `items[]` OR grouped `groups[]`
const NAV_SECTIONS = [
  {
    label: 'Core',
    items: [
      { label: 'Dashboard',         href: '/dashboard',         icon: DashboardIcon,     permission: ['member_search.view', 'receipt_quick.create', 'daily_report.view'] },
      { label: 'Add Receipt',       href: '/add-receipt',       icon: ReceiptIcon,       permission: 'receipt_quick.create' },
      { label: 'Daily Report',      href: '/daily-report',      icon: BarChartIcon,      permission: 'daily_report.view' },
      { label: 'Member Search',     href: '/mumin-search',      icon: SearchIcon,        permission: 'members.view' },
      { label: 'Takhmeen Not Done', href: '/takhmeen-not-done', icon: AlertTriangleIcon, permission: 'takhmeen.report_view' },
    ],
  },
  {
    label: 'Members',
    items: [
      { label: 'Mumin Details',    href: '/mumin-details',    icon: UsersIcon,    permission: 'members.view' },
      { label: 'ITS Data',         href: '/its-data',         icon: DatabaseIcon, permission: 'members.view' },
      { label: 'Mumin Takhmeen',   href: '/mumin-takhmeen',   icon: CoinsIcon,    permission: 'takhmeen.report_view' },
      { label: 'Takhmeen Form',    href: '/takhmeen-form',    icon: FileTextIcon, permission: 'takhmeen.edit' },
      { label: 'Print Templates',  href: '/print-templates',  icon: PrintIcon,    permission: 'takhmeen.edit' },
    ],
  },
  {
    label: 'Reports & Due',
    items: [
      { label: 'Due Details',       href: '/due-details',       icon: AlertCircleIcon,   permission: 'due.view' },
      { label: 'Follow Up List',    href: '/followup',          icon: ClipboardListIcon, permission: 'followup.view' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Expense Report',         href: '/expense-report',       icon: FileTextIcon, permission: 'expenses.view' },
      { label: 'Income & Expense Heads', href: '/income-expense-heads', icon: LayersIcon,   permission: 'expenses.view' },
      { label: 'Distribution List',      href: '/distribution',         icon: TruckIcon,    permission: 'distribution.view' },
    ],
  },
  {
    label: 'Community',
    items: [
      { label: 'Mohallah Details', href: '/mohallah',       icon: MapPinIcon,   permission: 'mohallah.view' },
      { label: 'Seating Layout',   href: '/seating-layout', icon: TableIcon,    permission: 'seating.view' },
      { label: 'Bookings',         href: '/calendar',       icon: CalendarIcon, permission: ['bookings.view', 'seating.view'] },
      { label: 'Majlis List',      href: '/majlis',         icon: ListIcon,     permission: 'majlis.view' },
      { label: 'Event Forms',      href: '/event-forms',    icon: FileTextIcon, permission: 'eventform.view' },
      { label: 'Safai Chitthi',    href: '/safai-chitthi',  icon: MailIcon,     permission: 'safai.view' },
    ],
  },
  // ── Messaging ────────────────────────────────────────────────────────────
  {
    label: 'Messaging',
    groups: [
      {
        label: 'WhatsApp',
        icon: MessageIcon,
        defaultOpen: true,
        items: [
          { label: 'WA Status',        href: '/whatsapp-status',        icon: ZapIcon,      permission: 'utility.view' },
          { label: 'WA Templates',     href: '/whatsapp-templates',    icon: FileTextIcon, permission: 'utility.view' },
          { label: 'WA Queue',         href: '/messaging/wa-queue',    icon: InboxIcon,    permission: 'utility.view' },
          { label: 'Bulk Messaging',   href: '/messaging/wa-bulk',     icon: SendIcon,     permission: 'utility.view' },
        ],
      },
      {
        label: 'App Notifications',
        icon: SmartphoneIcon,
        defaultOpen: false,
        items: [
          { label: 'Push Notifications', href: '/messaging/app-notifications', icon: BellIcon, permission: null },
        ],
      },
    ],
  },
  // ── System ───────────────────────────────────────────────────────────────
  {
    label: 'System',
    items: [
      { label: 'FMB Daily Menu',    href: '/fmb-daily-menu',    icon: UtensilsIcon, permission: 'fmb_menu.view' },
      { label: 'Access Control',    href: '/access-control',    icon: UserCogIcon,  permission: 'users.view' },
      { label: 'System Variables',  href: '/system-variables',  icon: SettingsIcon, permission: 'utility.view' },
      { label: 'Theme Settings',    href: '/theme-settings',    icon: PaletteIcon,  permission: 'utility.view' },
      { label: 'Utility',           href: '/utility',           icon: SettingsIcon, permission: 'utility.view' },
    ],
  },
];

// ── Permission check helper ────────────────────────────────────────────────
function isVisible(permission, can) {
  if (!permission) return true;
  return [].concat(permission).some(code => can(code));
}

// ── Flat nav item ──────────────────────────────────────────────────────────
function NavItem({ item, active, onNavigate, indent = false }) {
  const IconComp = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={clsx(
        'flex items-center gap-2.5 py-[7px] rounded-md text-[12.5px] transition-all duration-150 group',
        indent ? 'px-2 mx-2' : 'px-2.5 mx-2',
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
      {active && (
        <span className="ml-auto w-1 h-4 bg-blue-400 rounded-full flex-shrink-0" />
      )}
    </Link>
  );
}

// ── Collapsible group (used in Messaging section) ──────────────────────────
function NavGroup({ group, can, pathname, onNavigate }) {
  const [open, setOpen] = useState(group.defaultOpen ?? true);
  const GroupIcon = group.icon;

  const visibleItems = group.items.filter(item => isVisible(item.permission, can));
  if (!visibleItems.length) return null;

  const hasActive = visibleItems.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  return (
    <div>
      {/* Group header */}
      <button
        onClick={() => setOpen(v => !v)}
        className={clsx(
          'w-[calc(100%-16px)] mx-2 flex items-center gap-2.5 px-2.5 py-[6px] rounded-md text-[12px]',
          'transition-all duration-150',
          hasActive ? 'text-white/85' : 'text-white/45 hover:text-white/65'
        )}
      >
        <span className={clsx(
          'w-4 h-4 flex-shrink-0 flex items-center justify-center',
          hasActive ? 'text-blue-300' : 'text-white/25'
        )}>
          <GroupIcon className="w-4 h-4" />
        </span>
        <span className="flex-1 text-left truncate leading-none font-medium">
          {group.label}
        </span>
        <ChevronDownIcon className={clsx(
          'w-3 h-3 flex-shrink-0 transition-transform duration-200 text-white/25',
          open ? 'rotate-180' : ''
        )} />
      </button>

      {/* Indented items */}
      {open && (
        <div className="ml-3 border-l border-white/[0.07] pl-0.5 mb-0.5">
          {visibleItems.map(item => (
            <NavItem
              key={item.href}
              item={item}
              active={pathname === item.href || pathname.startsWith(item.href + '/')}
              onNavigate={onNavigate}
              indent
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const { user, can, logout } = useAuth();

  const initials = (user?.username || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  function renderSection(section) {
    // Grouped section (e.g. Messaging)
    if (section.groups) {
      const hasAnyVisible = section.groups.some(g =>
        g.items.some(item => isVisible(item.permission, can))
      );
      if (!hasAnyVisible) return null;

      return (
        <div key={section.label} className="mb-1">
          <div className="px-4 pt-3 pb-1 text-[9px] font-semibold tracking-[1.1px] uppercase text-white/22">
            {section.label}
          </div>
          {section.groups.map(group => (
            <NavGroup
              key={group.label}
              group={group}
              can={can}
              pathname={pathname}
              onNavigate={() => setIsOpen(false)}
            />
          ))}
        </div>
      );
    }

    // Flat items section
    const visible = section.items.filter(item => isVisible(item.permission, can));
    if (!visible.length) return null;

    return (
      <div key={section.label} className="mb-1">
        <div className="px-4 pt-3 pb-1 text-[9px] font-semibold tracking-[1.1px] uppercase text-white/22">
          {section.label}
        </div>
        {visible.map(item => (
          <NavItem
            key={item.href}
            item={item}
            active={pathname === item.href || pathname.startsWith(item.href + '/')}
            onNavigate={() => setIsOpen(false)}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={clsx(
        'fixed left-0 top-0 bottom-0 w-[228px] bg-shell flex flex-col z-50',
        'shadow-[4px_0_24px_rgba(6,15,30,0.3)]',
        'border-r border-blue-500/20',
        'transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>

        {/* Brand */}
        <div className="flex items-center justify-center px-4 py-2 border-b border-white/[0.06] flex-shrink-0 h-[52px]">
          <Image
            src="/jmsoptimuslogo1.png"
            alt="JMS Optimus"
            width={972}
            height={213}
            className="object-contain h-9 w-auto"
            priority
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2
                        scrollbar-thin scrollbar-thumb-white/10">
          {NAV_SECTIONS.map(section => renderSection(section))}
        </nav>

        {/* User / Logout footer */}
        <div className="border-t border-white/[0.06] px-3 py-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-navy-800/70 border border-white/10
                            flex items-center justify-center text-blue-300 text-xs
                            font-semibold font-display flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-white/28 uppercase tracking-wide">Logged in</div>
              <div className="text-[12px] font-medium text-white/75 truncate">
                {user?.username || 'User'}
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="w-7 h-7 flex items-center justify-center rounded-md
                         bg-white/[0.06] text-white/70
                         hover:bg-red-500/20 hover:text-red-400 transition-all"
            >
              <LogoutIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
