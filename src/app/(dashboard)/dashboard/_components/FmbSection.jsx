'use client';
import { useEffect, useState } from 'react';
import { dashboardService }   from '@/services';
import { StackedBar, DonutChart, AmtCard, SectionSkeleton, fmt } from './ProgressBar';

// ── Items 4-7: FMB Thaali Count, Takhmeen, Received/Dues Chart, All Dues ─────
export default function FmbSection({ year }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    setLoading(true);
    dashboardService.getFmbStats(year)
      .then(r => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <SectionSkeleton />;
  if (error || !data) return null;

  const { thaaliCounts = [], excludedCounts = [], subheadBreakdown = [], yearlyTotals = {}, allDues = [] } = data;
  const maxDue = Math.max(...allDues.map(d => d.remaining || 0), 1);

  return (
    <div className="card">
      <div className="card-header">
        <span>FMB</span>
        <div className="flex items-center gap-2">
          {year && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Year {year}</span>}
          <span className="text-[11px] text-gray-400 font-normal">Running summary</span>
        </div>
      </div>

      <div className="card-body space-y-5">

        {/* Thaali count by ThaaliStatus (Not Taken / Closed shown separately) */}
        <div>
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Thaali Status
          </div>
          <div className="flex flex-wrap gap-2">
            {thaaliCounts.length === 0
              ? <span className="text-[12px] text-gray-400">No data</span>
              : thaaliCounts.map(row => (
                <div key={row.status} className="flex-1 min-w-[90px] bg-surface border border-border rounded-md px-3 py-2">
                  <div className="text-[10px] text-gray-400 font-semibold truncate">{row.status}</div>
                  <div className={`text-[20px] font-bold ${row.status?.toLowerCase() === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                    {row.cnt ?? '—'}
                  </div>
                  <div className="text-[9px] text-gray-400">thaali</div>
                </div>
              ))
            }
          </div>
          {/* Not Taken / Closed — separate */}
          {excludedCounts.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {excludedCounts.map(row => (
                <div key={row.status} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5">
                  <span className="text-[10px] text-gray-500 font-semibold">{row.status}</span>
                  <span className="text-[14px] font-bold text-gray-400">{row.cnt ?? '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Items 5 & 6 — Takhmeen Amount + Received vs Dues chart */}
        {(yearlyTotals.takhmeen > 0 || subheadBreakdown.length > 0) && (
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Running Year — Takhmeen &amp; Collections
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-center">
              {/* Donut — overall received % */}
              <DonutChart
                received={yearlyTotals.received || 0}
                total={yearlyTotals.takhmeen   || 0}
                size={96}
                label="Received"
              />
              {/* Amount summary cards */}
              <div className="grid grid-cols-3 gap-2">
                <AmtCard label="Takhmeen" value={yearlyTotals.takhmeen}  color="text-navy-900" />
                <AmtCard label="Received" value={yearlyTotals.received}  color="text-green-600" />
                <AmtCard label="Dues"     value={yearlyTotals.remaining} color="text-red-600" />
              </div>
            </div>

            {/* Subhead breakdown bars */}
            {subheadBreakdown.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-3 mb-1">
                  <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />Received</span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />Dues</span>
                </div>
                {subheadBreakdown.map(row => {
                  const total  = row.takhmeen || 0;
                  const recPct = total > 0 ? Math.round(((row.received || 0) / total) * 100) : 0;
                  const remPct = 100 - recPct;
                  return (
                    <div key={row.subhead}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-medium text-navy-900">{row.subhead}</span>
                        <span className="text-gray-400 text-[10px]">
                          {fmt(row.received)} / {fmt(total)}
                          &nbsp;·&nbsp;
                          <span className="text-green-600 font-semibold">{recPct}%</span>
                          &nbsp;
                          <span className="text-red-500 font-semibold">{remPct}%</span>
                        </span>
                      </div>
                      <StackedBar received={row.received || 0} remaining={row.remaining || 0} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Item 7 — All dues by FMB subhead */}
        {allDues.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              All Outstanding Dues (FMB)
            </div>
            <div className="space-y-2">
              {allDues.map(row => (
                <div key={row.subhead} className="flex items-center gap-3">
                  <div className="w-32 shrink-0">
                    <div className="text-[11px] font-medium text-navy-900 truncate">{row.subhead}</div>
                    <div className="text-[9px] text-gray-400">{row.memberCount} members</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-end mb-0.5">
                      <span className="text-[11px] font-semibold text-red-600">{fmt(row.remaining)}</span>
                    </div>
                    <div className="h-2 rounded bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded"
                        style={{ width: `${Math.round(((row.remaining || 0) / maxDue) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <span className="text-[11px] text-gray-500">
                Total dues:&nbsp;
                <span className="font-bold text-red-600">{fmt(allDues.reduce((s,r)=>s+(r.remaining||0),0))}</span>
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
