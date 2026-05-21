'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { fmt, toInputDate } from '../../../utils';

const byYearDesc = (a, b) => (parseInt(b.forYear) || 0) - (parseInt(a.forYear) || 0);

export default function HimTakhmeenSection({ himList, onAddHim, onHimForm, onEditHim, onDeleteHim }) {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const sorted = [...himList].sort(byYearDesc);
  const paginated = pageSize === 'all' ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(sorted.length / pageSize);

  function handlePageSize(val) {
    setPageSize(val === 'all' ? 'all' : Number(val));
    setPage(1);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex-1 min-w-0">
          <span>HIM Takhmeen</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="text-[11px] border border-border rounded px-1.5 py-1 bg-white text-gray-600"
            value={pageSize === 'all' ? 'all' : pageSize}
            onChange={e => handlePageSize(e.target.value)}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value="all">All</option>
          </select>
          {onHimForm && (
            <button className="btn btn-secondary btn-sm" onClick={onHimForm}>HIM Takhmeen Form</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={onAddHim}>+ Add HIM Entry</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border mb-4">
        <table className="w-full border-collapse text-[12px] min-w-[360px]">
          <thead>
            <tr>
              {['Actions', 'For Year', 'Takhmeen', 'Received', 'Remaining'].map(h => (
                <th key={h} className="th-navy">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-6 text-gray-400">No HIM records</td></tr>
            ) : paginated.map((h, i) => (
              <tr key={i} className="hover:bg-blue-500/[0.025]">
                <td className="px-3 py-2 border-t border-border whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {onEditHim && (
                      <button
                        title="Edit"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors"
                        onClick={() => onEditHim({ ...h, date: toInputDate(h.date) })}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    )}
                    {onDeleteHim && (
                      <button
                        title="Delete"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                        onClick={() => onDeleteHim(h.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 border-t border-border">{h.forYear}</td>
                <td className="px-3 py-2 border-t border-border">{fmt(h.takhmeen)}</td>
                <td className="px-3 py-2 border-t border-border">{fmt(h.received)}</td>
                <td className={clsx('px-3 py-2 border-t border-border font-bold',
                  Number(h.remaining) > 0 ? 'bg-red-500 text-white' : 'text-green-600'
                )}>{fmt(h.remaining)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1 mb-4 text-[11px]">
          <button
            className="px-2 py-1 rounded border border-border text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={clsx('px-2 py-1 rounded border text-gray-600', page === p ? 'border-blue-500 bg-blue-50 text-blue-600 font-semibold' : 'border-border hover:bg-gray-50')}
              onClick={() => setPage(p)}
            >{p}</button>
          ))}
          <button
            className="px-2 py-1 rounded border border-border text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >›</button>
        </div>
      )}
    </>
  );
}
