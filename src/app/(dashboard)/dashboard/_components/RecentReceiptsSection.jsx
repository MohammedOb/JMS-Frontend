'use client';
import { useEffect, useState } from 'react';
import { dashboardService } from '@/services';
import { SectionSkeleton, fmt } from './ProgressBar';
import { StatusBadge } from '@/components/shared/Badge';

export default function RecentReceiptsSection({ widgets }) {
  const [receipts, setReceipts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Union of all widget hub/subhead scopes.
  // If any widget has an empty array (= unrestricted), the union is also unrestricted.
  const hasUnrestrictedHub = widgets.some(w => w.hubs.length === 0);
  const allHubs     = hasUnrestrictedHub ? [] : [...new Set(widgets.flatMap(w => w.hubs))];
  const hasUnrestrictedSub = widgets.some(w => w.subheads.length === 0);
  const allSubheads = hasUnrestrictedSub ? [] : [...new Set(widgets.flatMap(w => w.subheads))];

  const scopeKey = `${allHubs.join(',')}|${allSubheads.join(',')}`;

  useEffect(() => {
    setLoading(true);
    dashboardService.getWidgetRecent({ hubs: allHubs, subheads: allSubheads, limit: 10 })
      .then(r => setReceipts(Array.isArray(r.data) ? r.data : []))
      .catch(() => setReceipts([]))
      .finally(() => setLoading(false));
  }, [scopeKey]);

  if (loading) return <SectionSkeleton />;

  return (
    <div className="card">
      <div className="card-header">
        <span>Recent Receipts</span>
        <span className="text-[10px] font-normal text-gray-400">last 10 transactions</span>
      </div>
      <div className="card-body p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px] min-w-max">
            <thead>
              <tr>
                {['Receipt#', 'Member', 'Hub / Sub-Head', 'Amount', 'Mode', 'Date', 'Status'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!receipts.length ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                    No recent transactions
                  </td>
                </tr>
              ) : receipts.map((r, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border text-blue-500 font-semibold">
                    #{r.receiptNo}
                  </td>
                  <td className="px-3 py-2.5 border-t border-border">{r.memberName}</td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <div className="text-[11px] font-medium text-navy-900">{r.hub}</div>
                    {r.subhead && (
                      <div className="text-[9px] text-gray-400">{r.subhead}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 border-t border-border font-semibold">{fmt(r.amount)}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.mode}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.date}</td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
