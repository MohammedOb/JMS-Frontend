'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PAGE_SIZES = [25, 50, 100, 200, 500, 'All'];

export default function DistributionTable({ rows, loading }) {
  const router = useRouter();
  const [pageSize, setPageSize] = useState(25);
  const [page,     setPage]     = useState(0);

  useEffect(() => setPage(0), [rows]);

  const total      = rows.length;
  const pageCount  = pageSize === 'All' ? 1 : Math.ceil(total / pageSize);
  const visible    = pageSize === 'All' ? rows : rows.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div>
      <div className="overflow-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              {['S No','Acc No','Full Name','Mobile','Sector','Subsector','MohallaDescription','Thaali Size','Distributor Name','Action'].map(h => (
                <th key={h} className="th-navy">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-10 text-gray-400">Loading…</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-10 text-gray-400">No records found.</td></tr>
            ) : visible.map((r, i) => (
              <tr key={`${r.AccNo}-${i}`} className="hover:bg-blue-500/[0.025]">
                <td className="px-3 py-2.5 border-t border-border text-gray-400">
                  {pageSize === 'All' ? i + 1 : page * pageSize + i + 1}
                </td>
                <td className="px-3 py-2.5 border-t border-border font-mono">{r.AccNo}</td>
                <td className="px-3 py-2.5 border-t border-border font-medium">{r.FullName}</td>
                <td className="px-3 py-2.5 border-t border-border">{r.Mobile || '—'}</td>
                <td className="px-3 py-2.5 border-t border-border">{r.Sector || '—'}</td>
                <td className="px-3 py-2.5 border-t border-border">{r.Subsector || '—'}</td>
                <td className="px-3 py-2.5 border-t border-border">{r.MohallaDescription || '—'}</td>
                <td className="px-3 py-2.5 border-t border-border">{r.ThaaliSize || '—'}</td>
                <td className="px-3 py-2.5 border-t border-border font-medium text-blue-700">{r.DistributorName || '—'}</td>
                <td className="px-3 py-2.5 border-t border-border">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => router.push(`/mumin-details?accno=${r.AccNo}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination bar */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-gray-50/50 text-[11px] text-gray-500">
          <span>{total} total record{total !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                className="form-input py-0.5 px-1.5 text-[11px] w-auto"
                value={pageSize}
                onChange={e => {
                  const v = e.target.value === 'All' ? 'All' : Number(e.target.value);
                  setPageSize(v);
                  setPage(0);
                }}
              >
                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {pageSize !== 'All' && (
              <div className="flex items-center gap-1">
                <button
                  className="px-2 py-0.5 rounded border border-border hover:bg-gray-100 disabled:opacity-40"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >‹</button>
                <span className="min-w-[60px] text-center">
                  {page + 1} / {pageCount}
                </span>
                <button
                  className="px-2 py-0.5 rounded border border-border hover:bg-gray-100 disabled:opacity-40"
                  onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                  disabled={page >= pageCount - 1}
                >›</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
