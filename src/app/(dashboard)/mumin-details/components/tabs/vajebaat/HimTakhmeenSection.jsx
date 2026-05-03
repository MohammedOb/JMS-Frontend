'use client';

import clsx from 'clsx';
import { fmt, toInputDate } from '../../../utils';

const byYearDesc = (a, b) => (parseInt(b.forYear) || 0) - (parseInt(a.forYear) || 0);

export default function HimTakhmeenSection({ himList, onAddHim, onHimForm, onEditHim, onDeleteHim }) {
  const sorted = [...himList].sort(byYearDesc);
  return (
    <>
      <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        <span>HIM Takhmeen</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="flex gap-2 mb-2">
        {onHimForm && (
          <button className="btn btn-secondary btn-sm" onClick={onHimForm}>HIM Takhmeen Form</button>
        )}
        <button className="btn btn-primary btn-sm" onClick={onAddHim}>+ Add HIM Entry</button>
      </div>
      <div className="rounded-lg overflow-hidden border border-border mb-4">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              {['Actions', 'For Year', 'Takhmeen', 'Received', 'Remaining'].map(h => (
                <th key={h} className="th-navy">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-6 text-gray-400">No HIM records</td></tr>
            ) : sorted.map((h, i) => (
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
                {/* <td className="px-3 py-2 border-t border-border">{fmt(h.himTotal)}</td> */}
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
    </>
  );
}
