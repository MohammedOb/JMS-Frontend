'use client';
import { useEffect, useState } from 'react';
import { dashboardService }   from '@/services';
import { StackedBar, AmtCard, SectionSkeleton, fmt } from './ProgressBar';

export default function SabeelSection({ year }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    setLoading(true);
    dashboardService.getSabeelStats(year)
      .then(r => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <SectionSkeleton />;
  if (error || !data) return null;

  const { headCounts = [], yearlyData = [], allDues = [], takhmeenStatus = [] } = data;
  const maxRemaining = Math.max(...allDues.map(d => d.remaining || 0), 1);

  return (
    <div className="card">
      <div className="card-header">
        <span>Sabeel</span>
        <div className="flex items-center gap-2">
          {year && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">Year {year}</span>}
          <span className="text-[11px] text-gray-400 font-normal">Running summary</span>
        </div>
      </div>

      <div className="card-body space-y-5">

        {/* Head Count by SabeelType */}
        <div>
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Head Count</div>
          <div className="flex flex-wrap gap-2">
            {headCounts.length === 0
              ? <span className="text-[12px] text-gray-400">No data</span>
              : headCounts.map(row => (
                <div key={row.type} className="flex-1 min-w-[90px] bg-surface border border-border rounded-md px-3 py-2">
                  <div className="text-[10px] text-gray-400 font-semibold truncate">{row.type}</div>
                  <div className="text-[20px] font-bold text-blue-600">{row.cnt ?? '—'}</div>
                  <div className="text-[9px] text-gray-400">members</div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Takhmeen Done / Not Done for running year (all SabeelTypes from DB) */}
        {takhmeenStatus.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Takhmeen Status — Year {year}
            </div>
            <div className="space-y-2.5">
              {takhmeenStatus.map(row => {
                const total      = row.totalMembers || 1;
                const donePct    = Math.round(((row.doneCnt || 0) / total) * 100);
                const notDonePct = 100 - donePct;
                return (
                  <div key={row.type}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-medium text-navy-900">{row.type}</span>
                      <span className="text-[10px] text-gray-400">
                        <span className="text-green-600 font-semibold">{row.doneCnt ?? 0} done</span>
                        &nbsp;·&nbsp;
                        <span className="text-red-500 font-semibold">{row.notDoneCnt ?? 0} not done</span>
                        &nbsp;·&nbsp;{row.totalMembers} total
                      </span>
                    </div>
                    <div className="flex h-2.5 w-full rounded overflow-hidden gap-px">
                      {donePct > 0    && <div className="bg-green-500 rounded-l" style={{ width: `${donePct}%` }}    title={`Done ${donePct}%`} />}
                      {notDonePct > 0 && <div className="bg-red-300 rounded-r"  style={{ width: `${notDonePct}%` }} title={`Not done ${notDonePct}%`} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Running-Year Received vs Dues */}
        {yearlyData.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Received vs Dues — Year {year}
            </div>
            <div className="flex gap-3 mb-2">
              <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />Received</span>
              <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />Dues</span>
            </div>
            <div className="space-y-2">
              {yearlyData.map(row => {
                const total  = row.takhmeen || 0;
                const recPct = total > 0 ? Math.round(((row.received || 0) / total) * 100) : 0;
                return (
                  <div key={row.type}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-medium text-navy-900">{row.type}</span>
                      <span className="text-gray-400 text-[10px]">
                        {fmt(row.received)} / {fmt(total)}
                        &nbsp;·&nbsp;
                        <span className="text-green-600 font-semibold">{recPct}%</span>
                        &nbsp;
                        <span className="text-red-500 font-semibold">{100 - recPct}%</span>
                      </span>
                    </div>
                    <StackedBar received={row.received || 0} remaining={row.remaining || 0} />
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <AmtCard label="Takhmeen" value={yearlyData.reduce((s,r)=>s+(r.takhmeen||0),0)} color="text-navy-900" />
              <AmtCard label="Received" value={yearlyData.reduce((s,r)=>s+(r.received||0),0)} color="text-green-600" />
              <AmtCard label="Dues"     value={yearlyData.reduce((s,r)=>s+(r.remaining||0),0)} color="text-red-600" />
            </div>
          </div>
        )}

        {/* All Dues — All Years */}
        {allDues.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              All Outstanding Dues <span className="font-normal">(all years)</span>
            </div>
            <div className="space-y-2">
              {allDues.map(row => (
                <div key={row.type} className="flex items-center gap-3">
                  <div className="w-28 shrink-0">
                    <div className="text-[11px] font-medium text-navy-900 truncate">{row.type}</div>
                    <div className="text-[9px] text-gray-400">{row.memberCount} members</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-end mb-0.5">
                      <span className="text-[11px] font-semibold text-red-600">{fmt(row.remaining)}</span>
                    </div>
                    <div className="h-2 rounded bg-gray-100 overflow-hidden">
                      <div className="h-full bg-red-400 rounded" style={{ width: `${Math.round(((row.remaining||0)/maxRemaining)*100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <span className="text-[11px] text-gray-500">
                Total:&nbsp;<span className="font-bold text-red-600">{fmt(allDues.reduce((s,r)=>s+(r.remaining||0),0))}</span>
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
