'use client';
import { useState, useCallback } from 'react';
import { majlisService } from '@/services';
import toast from 'react-hot-toast';
import { RefreshIcon, EditIcon, TrashIcon } from '@/components/shared/Icons';
import { StatusPill, td, th } from './ui';
import FilterBar from './FilterBar';
import EditModal from './EditModal';
import { cleanDate } from './RegistrationModal';

const QUICK_FILTERS = [
  { label: 'All',      value: '',         activeCls: 'bg-gray-700 text-white',     idleCls: 'bg-gray-100 text-gray-600 hover:bg-gray-200'       },
  { label: 'Done',     value: 'Done',     activeCls: 'bg-emerald-600 text-white',  idleCls: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  { label: 'Not Done', value: 'Not Done', activeCls: 'bg-red-600 text-white',      idleCls: 'bg-red-50 text-red-700 hover:bg-red-100'             },
  { label: 'Pending',  value: 'Pending',  activeCls: 'bg-amber-500 text-white',    idleCls: 'bg-amber-50 text-amber-700 hover:bg-amber-100'       },
];

export default function ListTab() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [filters, setFilters] = useState({
    ForYear: '', MajlisDateFrom: '', MajlisDateTo: '',
    SlotType: '', MajlisType: '', MajlisStatus: '', Sadar: '',
  });

  const load = useCallback(async (overrideFilters) => {
    setLoading(true);
    try {
      const active = Object.fromEntries(
        Object.entries(overrideFilters ?? filters).filter(([, v]) => v)
      );
      const res = await majlisService.load(active);
      const list = res?.data?.data ?? res?.data;
      setRows(Array.isArray(list) ? list : []);
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  }, [filters]);

  const applyQuickFilter = (status) => {
    const updated = { ...filters, MajlisStatus: status };
    setFilters(updated);
    load(updated);
  };

  const deleteRow = async (r) => {
    if (!confirm(`Delete registration for ${r.FullName}?`)) return;
    try {
      await majlisService.delete({ ID: r.ID });
      toast.success('Deleted');
      setRows(p => p.filter(x => x.ID !== r.ID));
    } catch { toast.error('Failed to delete'); }
  };

  const counts = {
    total:   rows.length,
    done:    rows.filter(r => r.MajlisStatus === 'Done').length,
    notDone: rows.filter(r => r.MajlisStatus === 'Not Done').length,
    pending: rows.filter(r => r.MajlisStatus === 'Pending').length,
  };

  const countFor = (val) => {
    if (val === '')         return counts.total;
    if (val === 'Done')     return counts.done;
    if (val === 'Not Done') return counts.notDone;
    return counts.pending;
  };

  return (
    <div>
      <FilterBar filters={filters} onChange={setFilters} onSearch={() => load()} loading={loading} />

      {/* Quick filter pills + Refresh */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {QUICK_FILTERS.map(qf => (
          <button
            key={qf.value}
            onClick={() => applyQuickFilter(qf.value)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
              filters.MajlisStatus === qf.value ? qf.activeCls : qf.idleCls
            }`}
          >
            {qf.label}
            {rows.length > 0 && (
              <span className="ml-1.5 opacity-80">({countFor(qf.value)})</span>
            )}
          </button>
        ))}
        <div className="ml-auto">
          <button className="btn btn-secondary btn-sm" onClick={() => load()} disabled={loading}>
            <RefreshIcon className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {['#','Reg No','AccNo','Name','Sector','Mohalla','Date','Slot','Time','Type','Sadar','Zakereen','Clearance','Status',''].map(h => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={15} className="text-center py-14 text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={15} className="text-center py-14 text-gray-400">
                    No records — use filters above and click Search
                  </td>
                </tr>
              ) : rows.map((r, i) => {
                const rowBg =
                  r.MajlisStatus === 'Done'     ? 'bg-emerald-50 hover:bg-emerald-100/60' :
                  r.MajlisStatus === 'Not Done' ? 'bg-red-50 hover:bg-red-100/60'         :
                  'hover:bg-blue-500/[0.025]';
                return (
                  <tr key={i} className={rowBg}>
                    <td className={`${td} text-gray-400`}>{i + 1}</td>
                    <td className={`${td} font-mono text-[11px] text-blue-600 font-semibold`}>{r.RegistrationNo || '—'}</td>
                    <td className={`${td} text-blue-600 font-semibold`}>{r.AccNo}</td>
                    <td className={`${td} font-medium`}>{r.FullName}</td>
                    <td className={td}>{r.Sector || '—'}</td>
                    <td className={td}>{r.MohallaDescription || r.Subsector || '—'}</td>
                    <td className={td}>{r.MajlisDate || '—'}</td>
                    <td className={td}>{r.SlotType || '—'}</td>
                    <td className={td}>{r.MajlisTime || '—'}</td>
                    <td className={td}>{r.MajlisType || '—'}</td>
                    <td className={`${td} font-medium`}>{r.Sadar || '—'}</td>
                    <td className={td}>{r.Zakereen || '—'}</td>
                    <td className={td}>
                      {r.ClearanceStatus
                        ? <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            r.ClearanceStatus === 'Cleared' ? 'bg-emerald-100 text-emerald-700' :
                            r.ClearanceStatus === 'Not Cleared' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{r.ClearanceStatus}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className={td}><StatusPill status={r.MajlisStatus} /></td>
                    <td className={td}>
                      <div className="flex items-center gap-1">
                        <button className="btn btn-secondary btn-sm" title="Edit" onClick={() => setEditRow({ ...r, MajlisDate: cleanDate(r.MajlisDate) })}>
                          <EditIcon className="w-3 h-3" />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm text-red-500 hover:text-red-700"
                          title="Delete"
                          onClick={() => deleteRow(r)}
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editRow && (
        <EditModal
          row={editRow}
          onClose={() => setEditRow(null)}
          onSave={async (updated) => {
            try {
              await majlisService.update(updated);
              toast.success('Updated successfully');
              setEditRow(null);
              load();
            } catch { toast.error('Failed to update'); }
          }}
        />
      )}
    </div>
  );
}
