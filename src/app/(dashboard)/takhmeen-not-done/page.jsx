'use client';

import { useState, useCallback } from 'react';
import { useAuth }           from '@/context/AuthContext';
import { takhmeenService }   from '@/services';
import { useRouter }         from 'next/navigation';
import toast                 from 'react-hot-toast';
import PageHeader            from '@/components/shared/PageHeader';
import { MessageIcon, DownloadIcon, RefreshIcon } from '@/components/shared/Icons';

export default function TakhmeenNotDonePage() {
  const { permissions } = useAuth();
  const router = useRouter();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ mainHead: '', subHead: '', mohallah: '', year: permissions.ForYearAll || '' });

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await takhmeenService.getNotDone(filters);
      setRows(res.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filters]);

  useState(() => { load(); }, []);

  return (
    <div>
      <PageHeader title="Takhmeen Not Done" subtitle="Members who haven't completed their annual takhmeen">
        <button className="btn btn-secondary btn-sm"><MessageIcon className="w-3.5 h-3.5 mr-1.5" />Send Bulk SMS</button>
        <button className="btn btn-secondary btn-sm"><DownloadIcon className="w-3.5 h-3.5 mr-1.5" />Export Excel</button>
        <button className="btn btn-primary btn-sm" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : <><RefreshIcon className="w-3.5 h-3.5 mr-1.5" />Refresh</>}
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="bg-white border border-border rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="form-label">Hub Type</label>
          <select className="form-select w-[130px]" value={filters.mainHead} onChange={e => setF('mainHead', e.target.value)}>
            <option value="">All</option>
            {['Sabeel','FMB','Vajebaat'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Sub Type</label>
          <select className="form-select w-[160px]" value={filters.subHead} onChange={e => setF('subHead', e.target.value)}>
            <option value="">All</option>
            {['Sabeel Regular','Sabeel Mutaveteen','FMB Regular'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Mohallah</label>
          <select className="form-select w-[140px]" value={filters.mohallah} onChange={e => setF('mohallah', e.target.value)}>
            <option value="">All</option>
          </select>
        </div>
        <div>
          <label className="form-label">For Year</label>
          <input className="form-input w-[100px]" value={filters.year} onChange={e => setF('year', e.target.value)} placeholder="1446-47" />
        </div>
        <button className="btn btn-primary" onClick={load}>Search</button>
      </div>

      <div className="card">
        <div className="card-header">
          Members with Takhmeen Not Done
          {rows.length > 0 && <span className="text-[11px] text-gray-400 font-normal">{rows.length} members</span>}
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {['Acc#','Name','Mobile','Mohallah','Missing Year','Type','Action'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No records found</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border text-blue-500 font-semibold">{r.accno}</td>
                  <td className="px-3 py-2.5 border-t border-border font-medium">{r.name}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.mobile || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.mohallah || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border font-semibold text-red-600">{r.missingYear}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.type}</td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <button className="btn btn-primary btn-sm" onClick={() => router.push(`/mumin-details?accno=${r.accno}`)}>View Profile</button>
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
