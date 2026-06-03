'use client';
import { useEffect, useState } from 'react';
import { dashboardService } from '@/services';
import { StackedBar, SectionSkeleton, fmt } from './ProgressBar';

const HUB_COLORS = {
  sabeel:   { card: 'text-blue-600 bg-blue-50 border-blue-200',       border: 'border-blue-200' },
  fmb:      { card: 'text-amber-600 bg-amber-50 border-amber-200',    border: 'border-amber-200' },
  vajebaat: { card: 'text-purple-600 bg-purple-50 border-purple-200', border: 'border-purple-200' },
  other:    { card: 'text-gray-600 bg-gray-50 border-gray-200',       border: 'border-gray-200' },
  rent:     { card: 'text-teal-600 bg-teal-50 border-teal-200',       border: 'border-teal-200' },
  laagat:   { card: 'text-rose-600 bg-rose-50 border-rose-200',       border: 'border-rose-200' },
};
const hubCard   = h => (HUB_COLORS[h?.toLowerCase()] || HUB_COLORS.other).card;
const hubBorder = h => (HUB_COLORS[h?.toLowerCase()] || HUB_COLORS.other).border;

const PIE_COLORS = ['#3b82f6','#f59e0b','#10b981','#8b5cf6','#ef4444','#06b6d4','#84cc16','#f97316','#ec4899','#6366f1','#a3a3a3'];

function SvgPie({ data, size = 100 }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  if (!total) return null;
  const cx = size / 2, cy = size / 2, r = size * 0.44;
  let angle = -Math.PI / 2;
  const slices = data.map(d => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle);
    return {
      ...d,
      path: `M${cx} ${cy}L${x1} ${y1}A${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${x2} ${y2}Z`,
      pct: Math.round((d.value / total) * 100),
    };
  });
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="w-full space-y-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-[10px] text-gray-600 flex-1 truncate">{s.label}</span>
            <span className="text-[10px] font-bold text-gray-800">{s.value}</span>
            <span className="text-[9px] text-gray-400 w-8 text-right">({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardWidget({ config, year }) {
  const { title, hubs = [], subheads = [], metrics = [], chartType = 'bar' } = config;
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const configKey = JSON.stringify({ hubs, subheads, metrics, year });

  useEffect(() => {
    if (metrics.length > 0) {
      setLoading(true);
      dashboardService.getWidgetData({ hubs, subheads, metrics, year })
        .then(r => setData(r.data))
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [configKey]);

  const w = m => metrics.includes(m);

  const {
    headCounts        = [],
    takhmeenStatus    = [],
    thaaliStatus      = [],
    thaaliExcluded    = [],
    mutaveetenThaali  = [],
    nonSabeelThaali   = [],
    hubBreakdownByHub = {},
    allDuesByHub      = {},
  } = data || {};

  const hubKeys     = Object.keys(hubBreakdownByHub);
  const allDuesFlat = Object.values(allDuesByHub).flat();
  const maxDue      = Math.max(...allDuesFlat.map(d => d.remaining || 0), 1);

  if (loading) return <SectionSkeleton />;
  if (error)   return null;

  const hasContent =
    (w('headCount')        && headCounts.length > 0)       ||
    (w('takhmeenStatus')   && takhmeenStatus.length > 0)   ||
    (w('thaaliStatus')     && thaaliStatus.length > 0)     ||
    (w('thaaliExcluded')   && thaaliExcluded.length > 0)   ||
    (w('mutaveetenThaali') && mutaveetenThaali.length > 0) ||
    (w('nonSabeelThaali')  && nonSabeelThaali.length > 0)  ||
    (w('receivedDues')     && hubKeys.length > 0)          ||
    (w('allDues')          && allDuesFlat.length > 0);

  if (!hasContent) return null;

  // Build pie sections — only the ones that have data
  const pieSections = [];
  if (w('headCount') && headCounts.length > 0) {
    pieSections.push({
      key: 'headCount',
      label: 'Head Count',
      data: headCounts.map((r, i) => ({ label: r.type, value: r.cnt, color: PIE_COLORS[i % PIE_COLORS.length] })),
    });
  }
  if (w('takhmeenStatus') && takhmeenStatus.length > 0) {
    const totalDone    = takhmeenStatus.reduce((s, r) => s + (r.doneCnt    || 0), 0);
    const totalNotDone = takhmeenStatus.reduce((s, r) => s + (r.notDoneCnt || 0), 0);
    pieSections.push({
      key: 'takhmeenStatus',
      label: `Takhmeen Status — ${year}`,
      data: [
        { label: 'Done',     value: totalDone,    color: '#4ade80' },
        { label: 'Not Done', value: totalNotDone, color: '#f87171' },
      ],
    });
  }
  if (w('thaaliStatus') && thaaliStatus.length > 0) {
    pieSections.push({
      key: 'thaaliStatus',
      label: 'Thaali Status',
      data: thaaliStatus.map((r, i) => ({
        label: r.status,
        value: r.cnt,
        color: r.status?.toLowerCase() === 'active' ? '#4ade80' : PIE_COLORS[(i + 2) % PIE_COLORS.length],
      })),
    });
  }
  if (w('mutaveetenThaali') && mutaveetenThaali.length > 0) {
    pieSections.push({
      key: 'mutaveetenThaali',
      label: 'Sabeel Regular — Thaali',
      data: mutaveetenThaali.map((r, i) => ({
        label: r.status,
        value: r.cnt,
        color: ['#3b82f6','#06b6d4','#6366f1','#8b5cf6','#a3a3a3'][i % 5],
      })),
    });
  }
  if (w('receivedDues') && hubKeys.length > 0) {
    hubKeys.forEach(hub => {
      const { totals } = hubBreakdownByHub[hub];
      pieSections.push({
        key: `receivedDues_${hub}`,
        label: `${hub} — Received vs Dues (${year})`,
        data: [
          { label: 'Received', value: totals.received  || 0, color: '#4ade80' },
          { label: 'Dues',     value: totals.remaining || 0, color: '#f87171' },
        ],
      });
    });
  }
  if (w('allDues') && allDuesFlat.length > 0) {
    pieSections.push({
      key: 'allDues',
      label: 'All Outstanding Dues',
      data: allDuesFlat.map((r, i) => ({
        label: r.subhead || r.hub,
        value: r.remaining || 0,
        color: PIE_COLORS[i % PIE_COLORS.length],
      })),
    });
  }

  const isPie = chartType === 'pie';

  return (
    <div className="card">
      <div className="card-header">
        <span>{title}</span>
        {year && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-navy-50 text-navy-700 border border-navy-200">
            Year {year}
          </span>
        )}
      </div>

      <div className="card-body space-y-5">

        {/* ── Pie grid layout ── */}
        {isPie && pieSections.length > 0 && (
          <div className={`grid gap-3 ${pieSections.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {pieSections.map(section => (
              <div key={section.key} className="border border-border rounded-lg p-3">
                <SectionLabel>{section.label}</SectionLabel>
                <SvgPie data={section.data} size={100} />
              </div>
            ))}
          </div>
        )}

        {/* ── Bar mode: count sections ── */}
        {!isPie && (
          <>
            {w('headCount') && headCounts.length > 0 && (
              <div>
                <SectionLabel>Head Count</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {headCounts.map(row => (
                    <div key={row.type} className="flex-1 min-w-[90px] bg-surface border border-border rounded-md px-3 py-2">
                      <div className="text-[10px] text-gray-400 font-semibold truncate">{row.type}</div>
                      <div className="text-[20px] font-bold text-blue-600">{row.cnt ?? '—'}</div>
                      <div className="text-[9px] text-gray-400">members</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {w('takhmeenStatus') && takhmeenStatus.length > 0 && (
              <div>
                <SectionLabel>Takhmeen Status — Year {year}</SectionLabel>
                <div className="space-y-2.5">
                  {takhmeenStatus.map(row => {
                    const total   = row.totalMembers || 1;
                    const donePct = Math.round(((row.doneCnt || 0) / total) * 100);
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
                          {donePct > 0       && <div className="bg-green-500 rounded-l" style={{ width: `${donePct}%` }} />}
                          {(100-donePct) > 0 && <div className="bg-red-300 rounded-r"   style={{ width: `${100-donePct}%` }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {w('thaaliStatus') && (thaaliStatus.length > 0 || thaaliExcluded.length > 0) && (
              <div>
                <SectionLabel>Thaali Status</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {thaaliStatus.map(row => (
                    <div key={row.status} className="flex-1 min-w-[90px] bg-surface border border-border rounded-md px-3 py-2">
                      <div className="text-[10px] text-gray-400 font-semibold truncate">{row.status}</div>
                      <div className={`text-[20px] font-bold ${row.status?.toLowerCase() === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                        {row.cnt ?? '—'}
                      </div>
                      <div className="text-[9px] text-gray-400">thaali</div>
                    </div>
                  ))}
                </div>
                {w('thaaliExcluded') && thaaliExcluded.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {thaaliExcluded.map(row => (
                      <div key={row.status} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5">
                        <span className="text-[10px] text-gray-500 font-semibold">{row.status}</span>
                        <span className="text-[14px] font-bold text-gray-400">{row.cnt ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {w('mutaveetenThaali') && mutaveetenThaali.length > 0 && (
              <div>
                <SectionLabel>Sabeel Regular — Thaali Breakdown</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {mutaveetenThaali.map(row => (
                    <div key={row.status} className="flex-1 min-w-[90px] bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                      <div className="text-[10px] text-blue-600 font-semibold truncate">{row.status}</div>
                      <div className="text-[20px] font-bold text-blue-700">{row.cnt ?? '—'}</div>
                      <div className="text-[9px] text-blue-400">members</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Always: Non-Sabeel with Thaali (single number, no chart type) ── */}
        {w('nonSabeelThaali') && nonSabeelThaali.length > 0 && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <div>
              <div className="text-[12px] font-semibold text-amber-800">Non-Sabeel with Thaali</div>
              <div className="text-[10px] text-amber-600 mt-0.5">ITS-registered accounts without Sabeel type</div>
            </div>
            <div className="text-[28px] font-bold text-amber-700">{nonSabeelThaali[0]?.cnt ?? '—'}</div>
          </div>
        )}

        {/* ── Bar mode: Received vs Dues ── */}
        {!isPie && w('receivedDues') && hubKeys.length > 0 && (
          <div>
            <SectionLabel>Received vs Dues — Year {year}</SectionLabel>
            <div className="space-y-2">
              {hubKeys.map(hub => {
                const { subheads: subs, totals } = hubBreakdownByHub[hub];
                const total    = totals.takhmeen || 0;
                const recPct   = total > 0 ? Math.round((totals.received / total) * 100) : 0;
                const isSabeel = hub.toLowerCase() === 'sabeel';
                return (
                  <div key={hub} className={`border rounded-lg overflow-hidden ${hubBorder(hub)}`}>
                    <div className={`px-3 py-2 flex items-center justify-between ${hubCard(hub)}`}>
                      <div>
                        <div className="text-[12px] font-bold">{hub}</div>
                        <div className="text-[9px] opacity-70">{totals.memberCount} members · {fmt(totals.takhmeen)}</div>
                      </div>
                      <span className="text-[11px] font-bold">{recPct}% received</span>
                    </div>
                    <div className="px-3 pt-1.5 pb-1.5 bg-white">
                      <StackedBar received={totals.received} remaining={totals.remaining} />
                      <div className="flex justify-between text-[9px] mt-0.5">
                        <span className="text-green-600">{fmt(totals.received)}</span>
                        <span className="text-red-500">{fmt(totals.remaining)} dues</span>
                      </div>
                    </div>
                    {subs.length > 0 && (
                      <div className="px-3 pb-2.5 bg-white space-y-1.5 pt-1 border-t border-gray-100">
                        <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">By Sub-Head</div>
                        {subs.map(sub => {
                          const subTotal  = sub.takhmeen || 0;
                          const subRecPct = subTotal > 0 ? Math.round(((sub.received||0)/subTotal)*100) : 0;
                          return (
                            <div key={sub.subhead}>
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[10px] font-medium text-gray-700 truncate max-w-[150px]">{sub.subhead}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {!isSabeel && sub.takhmeenNotDone > 0 && (
                                    <span className="text-[9px] bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded-full">
                                      {sub.takhmeenNotDone} not done
                                    </span>
                                  )}
                                  <span className="text-[9px] font-semibold text-green-600 w-7 text-right">{subRecPct}%</span>
                                </div>
                              </div>
                              <StackedBar received={sub.received||0} remaining={sub.remaining||0} height="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {hubKeys.length > 1 && (
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { label: 'Takhmeen', val: Object.values(hubBreakdownByHub).reduce((s,h)=>s+h.totals.takhmeen,0) },
                    { label: 'Received', val: Object.values(hubBreakdownByHub).reduce((s,h)=>s+h.totals.received,0),  color: 'text-green-600' },
                    { label: 'Dues',     val: Object.values(hubBreakdownByHub).reduce((s,h)=>s+h.totals.remaining,0), color: 'text-red-600' },
                  ].map(c => (
                    <div key={c.label} className="bg-surface border border-border rounded-md px-3 py-2.5">
                      <div className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">{c.label}</div>
                      <div className={`text-[13px] font-bold mt-0.5 ${c.color || 'text-navy-900'}`}>{fmt(c.val)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Bar mode: All Outstanding Dues ── */}
        {!isPie && w('allDues') && allDuesFlat.length > 0 && (
          <div>
            <SectionLabel>All Outstanding Dues <span className="font-normal">(all years)</span></SectionLabel>
            <div className="space-y-2">
              {allDuesFlat.map((row, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-32 shrink-0">
                    <div className="text-[11px] font-medium text-navy-900 truncate">{row.subhead || row.hub}</div>
                    <div className="text-[9px] text-gray-400">{row.hub !== row.subhead ? row.hub + ' · ' : ''}{row.memberCount} members</div>
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
            <div className="mt-2 flex justify-end text-[11px] text-gray-500">
              Total:&nbsp;<span className="font-bold text-red-600">{fmt(allDuesFlat.reduce((s,r)=>s+(r.remaining||0),0))}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{children}</div>
  );
}
