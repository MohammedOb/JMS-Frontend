'use client';
import { useState, useCallback, useMemo } from 'react';
import { majlisService } from '@/services';
import toast from 'react-hot-toast';
import { PrintIcon } from '@/components/shared/Icons';
import { StatusPill, td, th } from './ui';
import FilterBar from './FilterBar';

export default function ReportTab() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    ForYear: '', MajlisDateFrom: '', MajlisDateTo: '',
    SlotType: '', MajlisType: '', MajlisStatus: 'Done', Sadar: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const active = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const res = await majlisService.load(active);
      const list = res?.data?.data ?? res?.data;
      setRows(Array.isArray(list) ? list : []);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  }, [filters]);

  // Group by Date + Sadar to match the old report layout
  const groups = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const key = `${r.MajlisDate || ''}|||${r.Sadar || '(Unassigned)'}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          date:     r.MajlisDate,
          sadar:    r.Sadar || '(Unassigned)',
          zakereen: r.Zakereen,
          tazeen:   r.Tazeen,
          bgi:      r.BGI,
          slotType: r.SlotType,
          rows:     [],
        });
      }
      map.get(key).rows.push(r);
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.date > b.date) return -1;
      if (a.date < b.date) return 1;
      return a.sadar.localeCompare(b.sadar);
    });
  }, [rows]);

  const stats = useMemo(() => ({
    total:   rows.length,
    done:    rows.filter(r => r.MajlisStatus === 'Done').length,
    notDone: rows.filter(r => r.MajlisStatus === 'Not Done').length,
    sadars:  groups.length,
  }), [rows, groups]);

  const fmtDate = (d) => d
    ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div>
      {/* Filters (hidden in print) */}
      <div className="print:hidden">
        <FilterBar filters={filters} onChange={setFilters} onSearch={load} loading={loading} />
      </div>

      {/* Toolbar */}
      {rows.length > 0 && (
        <div className="flex items-center justify-between mb-4 print:hidden">
          <p className="text-[13px] text-gray-500 font-medium">
            {stats.total} registration{stats.total !== 1 ? 's' : ''} across {stats.sadars} sadar group{stats.sadars !== 1 ? 's' : ''}
          </p>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <PrintIcon className="w-3.5 h-3.5 mr-1.5" />Print Report
          </button>
        </div>
      )}

      {/* Stats cards */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 print:hidden">
          {[
            { label: 'Total',        value: stats.total,   bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-100'    },
            { label: 'Done',         value: stats.done,    bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
            { label: 'Not Done',     value: stats.notDone, bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-100'     },
            { label: 'Sadar Groups', value: stats.sadars,  bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-100'  },
          ].map(s => (
            <div key={s.label} className={`rounded-lg border ${s.border} ${s.bg} px-4 py-4 text-center`}>
              <div className={`text-3xl font-bold ${s.text}`}>{s.value}</div>
              <div className="text-[11px] text-gray-500 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Report body */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading report…</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-lg">
          Set filters and click Search to load the Sadar-wise report
        </div>
      ) : groups.map((g, gi) => (
        <div key={gi} className="rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4 print:mb-6 print:break-inside-avoid">

          {/* Sadar header */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Date + slot badges */}
              <div className="flex items-center gap-2 mb-1.5">
                {g.date && (
                  <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded">
                    {fmtDate(g.date)}
                  </span>
                )}
                {g.slotType && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    g.slotType === 'Night' ? 'bg-indigo-500 text-white' : 'bg-amber-500 text-white'
                  }`}>{g.slotType}</span>
                )}
              </div>
              {/* Sadar name */}
              <div className="text-white font-bold text-[16px] leading-tight">{g.sadar}</div>
              {/* Team info */}
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                {g.zakereen && (
                  <span className="text-slate-300 text-[11.5px]">
                    Zakereen: <strong className="text-white">{g.zakereen}</strong>
                  </span>
                )}
                {g.tazeen && (
                  <span className="text-slate-300 text-[11.5px]">
                    Tazeen: <strong className="text-white">{g.tazeen}</strong>
                  </span>
                )}
                {g.bgi && (
                  <span className="text-slate-300 text-[11.5px]">
                    BGI: <strong className="text-white">{g.bgi}</strong>
                  </span>
                )}
              </div>
            </div>
            <span className="shrink-0 bg-white/20 text-white text-[12px] font-bold px-3 py-1.5 rounded-full">
              {g.rows.length} member{g.rows.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Members table */}
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {['S.No','AccNo','Full Name','Mobile','Sector (Masjid)','Subsector','Mohalla Name','Date','Time','Care Taker','Status'].map(h => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {g.rows.map((r, i) => (
                <tr key={i} className={`
                  ${r.MajlisStatus === 'Done'     ? 'bg-emerald-50' :
                    r.MajlisStatus === 'Not Done' ? 'bg-red-50'     : ''}
                  hover:bg-slate-50
                `}>
                  <td className={`${td} text-gray-400`}>{i + 1}</td>
                  <td className={`${td} font-semibold text-blue-600`}>{r.AccNo}</td>
                  <td className={`${td} font-medium text-gray-800`}>{r.FullName}</td>
                  <td className={td}>{r.Mobile || '—'}</td>
                  <td className={td}>{r.Sector || '—'}</td>
                  <td className={td}>{r.Subsector || '—'}</td>
                  <td className={td}>{r.MohallaDescription || '—'}</td>
                  <td className={td}>{r.MajlisDate ? fmtDate(r.MajlisDate) : '—'}</td>
                  <td className={td}>{r.MajlisTime || '—'}</td>
                  <td className={td}>{r.CareTaker || '—'}</td>
                  <td className={td}><StatusPill status={r.MajlisStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
