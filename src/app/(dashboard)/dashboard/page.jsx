'use client';

import { useEffect, useState } from 'react';
import { useAuth }             from '@/context/AuthContext';
import { dashboardService }    from '@/services';
import { useRouter }           from 'next/navigation';
import { StatusBadge }         from '@/components/shared/Badge';
import { ReceiptIcon, BarChartIcon, AlertCircleIcon, UsersIcon, BellIcon } from '@/components/shared/Icons';
import toast                   from 'react-hot-toast';

const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

export default function DashboardPage() {
  const { user, permissions } = useAuth();
  const router = useRouter();
  const [stats,  setStats]  = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardService.getStats(),
      dashboardService.getRecentTransactions(5),
    ])
      .then(([s, r]) => {
        setStats(s.data);
        setRecent(r.data);
      })
      .catch(() => {}) // silently ignore — stat cards show — if API not ready
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const STAT_CARDS = [
    { label: 'Total Members',       value: stats?.totalMembers,       sub: 'Active', color: 'text-blue-500' },
    { label: "Today's Collections", value: stats?.todayCollection,    sub: '+vs yesterday', color: 'text-green-600', money: true },
    { label: 'Pending Dues',        value: stats?.pendingDues,        sub: `${stats?.dueCount ?? '—'} members`, color: 'text-red-600', money: true },
    { label: 'FMB Subscriptions',   value: stats?.fmbSubscriptions,   sub: 'Thaali Active', color: 'text-amber-600' },
  ];

  const QUICK = [
    { icon: ReceiptIcon,     label: 'Add Receipt',    sub: 'Record a new payment',      href: '/add-receipt' },
    { icon: BarChartIcon,    label: 'Daily Report',   sub: "View today's transactions",  href: '/daily-report' },
    { icon: AlertCircleIcon, label: 'Due Details',    sub: 'Check pending dues',         href: '/due-details' },
    { icon: UsersIcon,       label: 'Member Profile', sub: 'View member details',        href: '/mumin-details' },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="font-display text-[18px] font-bold text-navy-900">Dashboard</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Welcome back, {user?.username} &nbsp;·&nbsp; {today}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm"><BellIcon className="w-3.5 h-3.5 mr-1.5" />Notifications</button>
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/add-receipt')}>
            + Add Receipt
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="card">
            <div className="card-body">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{s.label}</div>
              <div className={`font-display text-[22px] font-bold ${s.color}`}>
                {loading ? '—' : s.money ? fmt(s.value) : (s.value ?? '—')}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {QUICK.map(q => (
          <button
            key={q.href}
            onClick={() => router.push(q.href)}
            className="card p-4 text-center cursor-pointer hover:border-blue-500 hover:shadow-[0_0_0_3px_rgba(29,107,243,.07)]
                       hover:-translate-y-0.5 transition-all duration-150 w-full"
          >
            <div className="mb-1.5 flex justify-center">{(() => { const Icon = q.icon; return <Icon className="w-6 h-6 text-navy-700" />; })()}</div>
            <div className="text-[12px] font-semibold text-navy-900">{q.label}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{q.sub}</div>
          </button>
        ))}
      </div>

      {/* Recent transactions + mini chart */}
      <div className="grid grid-cols-[1fr_280px] gap-3">
        {/* Recent transactions */}
        <div className="card">
          <div className="card-header">
            Recent Transactions
            <span className="text-[11px] text-gray-400 font-normal">Last 5 entries</span>
          </div>
          <div className="overflow-hidden rounded-b-lg">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr>
                  {['Receipt#','Member','Type','Amount','Mode','Date','Status'].map(h => (
                    <th key={h} className="th-navy">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">Loading…</td></tr>
                ) : recent.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">No transactions today</td></tr>
                ) : recent.map((r, i) => (
                  <tr key={i} className="hover:bg-blue-500/[0.025]">
                    <td className="px-3 py-2.5 border-t border-border text-blue-500 font-semibold">#{r.receiptNo}</td>
                    <td className="px-3 py-2.5 border-t border-border">{r.memberName}</td>
                    <td className="px-3 py-2.5 border-t border-border">{r.type}</td>
                    <td className="px-3 py-2.5 border-t border-border font-semibold">{fmt(r.amount)}</td>
                    <td className="px-3 py-2.5 border-t border-border">{r.mode}</td>
                    <td className="px-3 py-2.5 border-t border-border">{r.date}</td>
                    <td className="px-3 py-2.5 border-t border-border"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly collections summary */}
        <div className="card">
          <div className="card-header">This Month's Collections</div>
          <div className="card-body">
            {/* Mini bar chart */}
            <div className="flex items-end gap-1 h-14 mb-4">
              {(stats?.monthlyBars || Array(12).fill(0)).map((v, i) => {
                const max = Math.max(...(stats?.monthlyBars || [1])) || 1;
                const h = Math.round((v / max) * 100);
                return (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500/80 rounded-t hover:bg-blue-500 transition-opacity"
                    style={{ height: `${h || 8}%` }}
                    title={fmt(v)}
                  />
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Sabeel',   value: stats?.monthSabeel },
                { label: 'FMB',      value: stats?.monthFMB },
                { label: 'Vajebaat', value: stats?.monthVajebaat },
                { label: 'Other',    value: stats?.monthOther },
              ].map(m => (
                <div key={m.label} className="bg-surface border border-border rounded-md p-2.5">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{m.label}</div>
                  <div className="text-[13px] font-semibold text-navy-900 mt-0.5">
                    {loading ? '—' : fmt(m.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
