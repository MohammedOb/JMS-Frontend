'use client';

import { useState, useCallback } from 'react';
import { useAuth }       from '@/context/AuthContext';
import { dueService }    from '@/services';
import { useRouter }     from 'next/navigation';
import toast             from 'react-hot-toast';
import PageHeader        from '@/components/shared/PageHeader';
import { MessageIcon, DownloadIcon, SearchIcon } from '@/components/shared/Icons';

const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

export default function DueDetailsPage() {
  const { permissions } = useAuth();
  const router = useRouter();

  const [filters, setFilters] = useState({
    fromYear: '', tillYear: '', sabeelType: '', hubType: '',
    mohallah: '', thaaliStatus: '', minReceived: '',
  });
  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched,setSearched]= useState(false);

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dueService.getGeneralDue(filters);
      setRows(res.data.rows);
      setTotal(res.data.total);
      setSearched(true);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filters]);

  const sendBulkSMS = async () => {
    const ids = rows.map(r => r.accno);
    if (ids.length === 0) return;
    try {
      await dueService.sendBulkSMS(ids);
      toast.success(`SMS sent to ${ids.length} members`);
    } catch { toast.error('SMS failed'); }
  };

  return (
    <div>
      <PageHeader title="General Due Details" subtitle="SP: GeneralDue">
        <button className="btn btn-secondary btn-sm" onClick={sendBulkSMS}><MessageIcon className="w-3.5 h-3.5 mr-1.5" />Send Bulk SMS</button>
        <button className="btn btn-secondary btn-sm"><DownloadIcon className="w-3.5 h-3.5 mr-1.5" />Export Excel</button>
        <button className="btn btn-primary btn-sm" onClick={search} disabled={loading}>
          {loading ? 'Loading…' : <><SearchIcon className="w-3.5 h-3.5 mr-1.5" />Search</>}
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="bg-white border border-border rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="form-label">From Year</label>
          <select className="form-select w-[100px]" value={filters.fromYear} onChange={e => setF('fromYear', e.target.value)}>
            <option value="">All</option>
            <option>1444</option><option>1445</option><option>1446</option>
          </select>
        </div>
        <div>
          <label className="form-label">Till Year</label>
          <select className="form-select w-[100px]" value={filters.tillYear} onChange={e => setF('tillYear', e.target.value)}>
            <option value="">All</option>
            <option>1446</option><option>1447</option>
          </select>
        </div>
        <div>
          <label className="form-label">Sabeel Type</label>
          <select className="form-select w-[130px]" value={filters.sabeelType} onChange={e => setF('sabeelType', e.target.value)}>
            <option value="">All</option>
            <option>Regular</option><option>Mutaveteen</option>
          </select>
        </div>
        <div>
          <label className="form-label">Hub Type</label>
          <select className="form-select w-[110px]" value={filters.hubType} onChange={e => setF('hubType', e.target.value)}>
            <option value="">All</option>
            {['Sabeel','FMB','Vajebaat','Other'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Mohallah</label>
          <select className="form-select w-[140px]" value={filters.mohallah} onChange={e => setF('mohallah', e.target.value)}>
            <option value="">All</option>
          </select>
        </div>
        <div>
          <label className="form-label">Thaali Status</label>
          <select className="form-select w-[130px]" value={filters.thaaliStatus} onChange={e => setF('thaaliStatus', e.target.value)}>
            <option value="">All</option>
            <option>Active</option><option>Inactive</option>
          </select>
        </div>
        <div>
          <label className="form-label">Min Remaining</label>
          <input className="form-input w-[90px]" placeholder="₹ amount" value={filters.minReceived} onChange={e => setF('minReceived', e.target.value)} />
        </div>
      </div>

      {/* Summary */}
      {searched && (
        <div className="flex items-center gap-4 mb-4 text-[12px]">
          <span className="text-gray-400">Total Entries:</span>
          <strong className="text-navy-900">{rows.length} members</strong>
          <span className="text-gray-300">|</span>
          <span className="text-gray-400">Total Remaining:</span>
          <strong className="text-red-600 text-[14px]">{fmt(total)}</strong>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          Due Report
          {searched && <span className="text-[11px] text-gray-400 font-normal">{rows.length} records</span>}
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {['Acc#','Member Name','Mobile','Mohallah','Type','Sub Type','Year','Takhmeen','Received','Remaining'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400">Apply filters and click Search</td></tr>
              ) : loading ? (
                <tr><td colSpan={10} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-gray-400">No dues found</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025] cursor-pointer" onClick={() => router.push(`/mumin-details?accno=${r.accno}`)}>
                  <td className="px-3 py-2.5 border-t border-border text-blue-500 font-semibold">{r.accno}</td>
                  <td className="px-3 py-2.5 border-t border-border font-medium text-blue-500">{r.name}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.mobile || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.mohallah || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.mainHead}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.subHead}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.forYear}</td>
                  <td className="px-3 py-2.5 border-t border-border">{fmt(r.takhmeen)}</td>
                  <td className="px-3 py-2.5 border-t border-border">{fmt(r.received)}</td>
                  <td className="px-3 py-2.5 border-t border-border font-bold text-red-600">{fmt(r.remaining)}</td>
                </tr>
              ))}
            </tbody>
            {searched && rows.length > 0 && (
              <tfoot>
                <tr className="bg-red-50">
                  <td colSpan={9} className="px-3 py-2.5 font-semibold text-red-800">Total Remaining</td>
                  <td className="px-3 py-2.5 font-bold text-red-600 text-[14px]">{fmt(total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
