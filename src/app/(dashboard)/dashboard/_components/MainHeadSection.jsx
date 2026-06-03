'use client';
import { useEffect, useState } from 'react';
import { dashboardService }   from '@/services';
import { StackedBar, SectionSkeleton, fmt } from './ProgressBar';
import { StatusBadge } from '@/components/shared/Badge';

const HUB_COLORS = {
  sabeel:   { card: 'text-blue-600   bg-blue-50   border-blue-200',   bar: 'border-blue-200' },
  fmb:      { card: 'text-amber-600  bg-amber-50  border-amber-200',  bar: 'border-amber-200' },
  vajebaat: { card: 'text-purple-600 bg-purple-50 border-purple-200', bar: 'border-purple-200' },
  other:    { card: 'text-gray-600   bg-gray-50   border-gray-200',   bar: 'border-gray-200' },
  rent:     { card: 'text-teal-600   bg-teal-50   border-teal-200',   bar: 'border-teal-200' },
  laagat:   { card: 'text-rose-600   bg-rose-50   border-rose-200',   bar: 'border-rose-200' },
};
const hubColor = (head) => (HUB_COLORS[(head || '').toLowerCase()] || HUB_COLORS.other).card;
const hubBorder = (head) => (HUB_COLORS[(head || '').toLowerCase()] || HUB_COLORS.other).bar;

export default function MainHeadSection({ year, recent, recentLoading }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    setLoading(true);
    dashboardService.getMainHeadStats(year)
      .then(r => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <SectionSkeleton />;
  if (error || !data) return null;

  const { mainHeads = [], allDues = [], subheadMap = {} } = data;
  const maxDue = Math.max(...allDues.map(d => d.remaining || 0), 1);

  return (
    <div className="space-y-3">

      {/* Running-year overview */}
      <div className="card">
        <div className="card-header">
          <span>Main Head Overview</span>
          <div className="flex items-center gap-2">
            {year && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-navy-50 text-navy-700 border border-navy-200">Year {year}</span>}
            <span className="text-[11px] text-gray-400 font-normal">Running year</span>
          </div>
        </div>

        <div className="card-body space-y-4">
          {mainHeads.length === 0
            ? <p className="text-sm text-gray-400">No data for year {year}</p>
            : (
              <>
                {/* Per-hub: summary card + subhead breakdown */}
                <div className="space-y-3">
                  {mainHeads.map(row => {
                    const total    = row.takhmeen || 0;
                    const recPct   = total > 0 ? Math.round(((row.received || 0) / total) * 100) : 0;
                    const isSabeel = row.head?.toLowerCase() === 'sabeel';
                    const subs     = subheadMap[row.head] || [];

                    return (
                      <div key={row.head} className={`border rounded-lg overflow-hidden ${hubBorder(row.head)}`}>
                        {/* Hub header */}
                        <div className={`px-3 py-2.5 flex items-center justify-between ${hubColor(row.head)}`}>
                          <div>
                            <div className="text-[13px] font-bold">{row.head}</div>
                            <div className="text-[9px] opacity-70">{row.memberCount} members · {fmt(row.takhmeen)}</div>
                          </div>
                          <span className="text-[12px] font-bold">{recPct}% received</span>
                        </div>

                        {/* Overall bar */}
                        <div className="px-3 pt-2 pb-1 bg-white">
                          <StackedBar received={row.received || 0} remaining={row.remaining || 0} />
                          <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                            <span className="text-green-600">{fmt(row.received)}</span>
                            <span className="text-red-500">{fmt(row.remaining)} dues</span>
                          </div>
                        </div>

                        {/* Subhead breakdown */}
                        {subs.length > 0 && (
                          <div className="px-3 pb-2.5 bg-white space-y-1.5 pt-1 border-t border-gray-100">
                            <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">By Sub-Head</div>
                            {subs.map(sub => {
                              const subTotal  = sub.takhmeen || 0;
                              const subRecPct = subTotal > 0 ? Math.round(((sub.received || 0) / subTotal) * 100) : 0;
                              return (
                                <div key={sub.subhead}>
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[10px] font-medium text-gray-700 truncate max-w-[140px]">{sub.subhead}</span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {!isSabeel && sub.takhmeenNotDone > 0 && (
                                        <span className="text-[9px] bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full">
                                          {sub.takhmeenNotDone} not done
                                        </span>
                                      )}
                                      <span className="text-[9px] font-semibold text-green-600 w-7 text-right">{subRecPct}%</span>
                                    </div>
                                  </div>
                                  <StackedBar received={sub.received || 0} remaining={sub.remaining || 0} height="h-2" />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Grand totals */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Total Takhmeen', val: mainHeads.reduce((s,r)=>s+(r.takhmeen||0),0) },
                    { label: 'Total Received', val: mainHeads.reduce((s,r)=>s+(r.received||0),0), color: 'text-green-600' },
                    { label: 'Total Dues',     val: mainHeads.reduce((s,r)=>s+(r.remaining||0),0), color: 'text-red-600' },
                  ].map(c => (
                    <div key={c.label} className="bg-surface border border-border rounded-md px-3 py-2.5">
                      <div className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">{c.label}</div>
                      <div className={`text-[13px] font-bold mt-0.5 ${c.color || 'text-navy-900'}`}>{fmt(c.val)}</div>
                    </div>
                  ))}
                </div>
              </>
            )
          }

          {/* All Outstanding Dues (all years) */}
          {allDues.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                All Outstanding Dues <span className="font-normal">(all years)</span>
              </div>
              <div className="space-y-2">
                {allDues.map(row => (
                  <div key={row.head} className="flex items-center gap-3">
                    <div className="w-24 shrink-0">
                      <div className="text-[11px] font-medium text-navy-900">{row.head}</div>
                      <div className="text-[9px] text-gray-400">{row.memberCount} members</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-end mb-0.5">
                        <span className="text-[11px] font-semibold text-red-600">{fmt(row.remaining)}</span>
                      </div>
                      <div className="h-2 rounded bg-gray-100 overflow-hidden">
                        <div className="h-full bg-red-400 rounded" style={{ width: `${Math.round(((row.remaining||0)/maxDue)*100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-end">
                <span className="text-[11px] text-gray-500">
                  Total:&nbsp;<span className="font-bold text-red-600">{fmt(allDues.reduce((s,r)=>s+(r.remaining||0),0))}</span>
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Recent Receipts */}
      <div className="card">
        <div className="card-header">
          Recent Receipts
          <span className="text-[11px] text-gray-400 font-normal">Last 5 entries</span>
        </div>
        <div className="overflow-x-auto rounded-b-lg">
          <table className="w-full border-collapse text-[12.5px] min-w-max">
            <thead>
              <tr>
                {['Receipt#','Member','Hub','Amount','Mode','Date','Status'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">Loading…</td></tr>
              ) : !recent?.length ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">No transactions found</td></tr>
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

    </div>
  );
}
