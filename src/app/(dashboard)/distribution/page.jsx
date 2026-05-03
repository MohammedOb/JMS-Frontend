'use client';

import { useState, useEffect } from 'react';
import { distributionService } from '@/services';
import { useRouter }           from 'next/navigation';
import toast                   from 'react-hot-toast';
import PageHeader              from '@/components/shared/PageHeader';
import { StatusBadge }         from '@/components/shared/Badge';
import { PrintIcon } from '@/components/shared/Icons';

export default function DistributionPage() {
  const router = useRouter();
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    distributionService.getAll()
      .then(r => setRows(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = rows.filter(r =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.accno?.includes(search)
  );

  return (
    <div>
      <PageHeader title="Distribution List" subtitle="FMB Thaali distribution management">
        <button className="btn btn-secondary btn-sm"><PrintIcon className="w-3.5 h-3.5 mr-1.5" />Print List</button>
      </PageHeader>

      <div className="mb-4">
        <input className="form-input max-w-xs" placeholder="Search by name or Acc No." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div className="card-header">
          Distribution Members
          {filtered.length > 0 && <span className="text-[11px] text-gray-400 font-normal">{filtered.length} members</span>}
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>{['Acc#','Member Name','Mohallah','Address','Thaali Count','Distributor','Status','Action'].map(h => <th key={h} className="th-navy">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No records</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border">{r.accno}</td>
                  <td className="px-3 py-2.5 border-t border-border font-medium">{r.name}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.mohallah}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.address}</td>
                  <td className="px-3 py-2.5 border-t border-border font-semibold">{r.thaaliCount}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.distributor || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border"><StatusBadge status={r.status || 'Active'} /></td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/mumin-details?accno=${r.accno}`)}>View</button>
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
