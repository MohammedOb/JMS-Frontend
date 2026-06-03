'use client';

import { useState, useEffect } from 'react';
import Link                  from 'next/link';
import { useAuth }           from '@/context/AuthContext';
import { dashboardService }  from '@/services';
import DashboardWidget       from './_components/DashboardWidget';
import RecentReceiptsSection from './_components/RecentReceiptsSection';
import { ReceiptIcon, FileTextIcon, CoinsIcon, UserIcon } from '@/components/shared/Icons';

const QUICK_ACTIONS = [
  { label: 'Add Receipt',    desc: 'Record a new payment',       href: '/add-receipt',   icon: ReceiptIcon,  perm: 'receipt_quick.create' },
  { label: 'Daily Report',   desc: "View today's transactions",  href: '/daily-report',  icon: FileTextIcon, perm: 'daily_report.view'    },
  { label: 'Due Details',    desc: 'Check pending dues',         href: '/due-details',   icon: CoinsIcon,    perm: 'due.view'             },
  { label: 'Member Profile', desc: 'View member details',        href: '/mumin-search',  icon: UserIcon,     perm: 'members.view'         },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const [widgets,      setWidgets]      = useState([]);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [dbHubScope,   setDbHubScope]   = useState(null);
  const [chartType,    setChartType]    = useState(() => {
    try { return localStorage.getItem('dash_chart_type') || 'bar'; } catch { return 'bar'; }
  });

  const isSuperAdmin = user?.roles?.includes('super_admin');

  // Use DB scopes (returned with config) if available; fall back to JWT scopes
  const hubScope         = (dbHubScope ?? user?.scopes?.HubMainHead ?? []).map(h => h.toLowerCase());
  const noHubRestriction = isSuperAdmin || hubScope.length === 0;
  const canViewHub       = (h) => noHubRestriction || hubScope.includes(h.toLowerCase());

  const forYearAll = user?.ForYearAll || '';
  const forYearFMB = user?.ForYearFMB || '';

  // Load config from DB on mount — no fallback to defaults; empty = no widgets
  useEffect(() => {
    dashboardService.getDashboardConfig()
      .then(r => {
        setWidgets(Array.isArray(r.data?.widgets) ? r.data.widgets : []);
        if (Array.isArray(r.data?.scopes?.HubMainHead)) setDbHubScope(r.data.scopes.HubMainHead);
      })
      .catch(() => { setWidgets([]); })
      .finally(() => setConfigLoaded(true));
  }, []);

  const visibleWidgets = widgets.filter(w =>
    w.hubs.length === 0 || w.hubs.some(h => canViewHub(h))
  );

  const yearFor = (w) => {
    const lower = w.hubs.map(h => h.toLowerCase());
    return lower.length === 1 && lower[0] === 'fmb' ? forYearFMB : forYearAll;
  };

  if (!configLoaded) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Loading dashboard…
      </div>
    );
  }

  const quickActions = QUICK_ACTIONS.filter(a => user?.permissions?.includes(a.perm));

  const setChart = (type) => {
    setChartType(type);
    try { localStorage.setItem('dash_chart_type', type); } catch {}
  };

  return (
    <div className="space-y-4">

      {/* Quick actions */}
      {quickActions.length > 0 && (
        <div className={`grid gap-3 grid-cols-2 sm:grid-cols-${Math.min(quickActions.length, 4)}`}>
          {quickActions.map(({ label, desc, href, icon: Icon }) => (
            <Link key={href} href={href}
              className="card card-body flex flex-col items-center justify-center gap-2 py-6 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group text-center">
              <Icon className="w-7 h-7 text-navy-800 group-hover:text-blue-600 transition-colors" />
              <div>
                <div className="text-[13px] font-semibold text-navy-900 group-hover:text-blue-700">{label}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Chart type toggle — shown only when there are widgets */}
      {visibleWidgets.length > 0 && (
        <div className="flex items-center justify-end gap-1.5">
          <span className="text-[10px] text-gray-400 mr-1">View as</span>
          {[
            { v: 'bar', label: 'Bar' },
            { v: 'pie', label: 'Pie' },
          ].map(({ v, label }) => (
            <button
              key={v}
              onClick={() => setChart(v)}
              className={`text-[11px] px-3 py-1 rounded-full border transition-colors ${
                chartType === v
                  ? 'bg-navy-800 text-white border-navy-800'
                  : 'bg-white text-gray-500 border-border hover:border-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {visibleWidgets.length === 0 && (
        <div className="card card-body text-center text-gray-400 text-sm py-12">
          No dashboard configured. Contact your administrator.
        </div>
      )}

      {/* Widgets */}
      {visibleWidgets.map(w => (
        <DashboardWidget key={w.id} config={{ ...w, chartType }} year={yearFor(w)} />
      ))}

      {/* Single generic recent receipts — scoped to union of all visible widget hubs/subheads */}
      {visibleWidgets.length > 0 && (
        <RecentReceiptsSection widgets={visibleWidgets} />
      )}

    </div>
  );
}
