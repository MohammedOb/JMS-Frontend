'use client';

import clsx from 'clsx';
import { fmt, toInputDate } from '../../../utils';

const byYearDesc = (a, b) => (parseInt(b.forYear) || 0) - (parseInt(a.forYear) || 0);

export default function VajebaatTakhmeenSection({
  vajebaat, onAddVaj, onVajForm, onEditVaj, onDeleteVaj, onPrintVaj,
}) {
  const sorted = [...vajebaat].sort(byYearDesc);
  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex-1">
          <span>Vajebaat Takhmeen Details</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="flex gap-2">
          {onVajForm && (
            <button className="btn btn-secondary btn-sm" onClick={onVajForm}>Vajebaat Takhmeen Form</button>
          )}
          {onAddVaj && (
            <button className="btn btn-primary btn-sm" onClick={onAddVaj}>+ Add Vajebaat</button>
          )}
        </div>
      </div>
      <div className="rounded-lg overflow-hidden border border-border mb-4">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              {['Actions', 'For Year', 'Last Takhmeen', 'Current Takhmeen', 'Takhmeen', 'Paid In', 'Paid Place'].map(h => (
                <th key={h} className="th-navy">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-6 text-gray-400">No vajebaat records</td></tr>
            ) : sorted.map((v, i) => (
              <tr key={i} className="hover:bg-blue-500/[0.025]">
                <td className="px-3 py-2 border-t border-border whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {onPrintVaj && (
                      <button
                        title="Print"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors"
                        onClick={() => onPrintVaj(v)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 6 2 18 2 18 9"/>
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                          <rect x="6" y="14" width="12" height="8"/>
                        </svg>
                      </button>
                    )}
                    {onEditVaj && (
                      <button
                        title="Edit"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors"
                        onClick={() => onEditVaj({ ...v, date: toInputDate(v.date) })}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    )}
                    {onDeleteVaj && (
                      <button
                        title="Delete"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                        onClick={() => onDeleteVaj(v.id)}
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
                <td className="px-3 py-2 border-t border-border">{v.forYear}</td>
                <td className="px-3 py-2 border-t border-border">{fmt(v.lastTakhmeen)}</td>
                <td className="px-3 py-2 border-t border-border">{fmt(v.currentTakhmeen)}</td>
                <td className="px-3 py-2 border-t border-border font-semibold">{fmt(v.takhmeen)}</td>
                <td className="px-3 py-2 border-t border-border">{v.paidin || '—'}</td>
                <td className="px-3 py-2 border-t border-border">{v.place || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
