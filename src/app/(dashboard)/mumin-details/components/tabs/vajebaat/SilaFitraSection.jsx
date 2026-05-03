'use client';

import clsx from 'clsx';
import { fmt } from '../../../utils';

const byYearDesc = (a, b) => (parseInt(b.forYear) || 0) - (parseInt(a.forYear) || 0);

export default function SilaFitraSection({ silaFitra }) {
  const sorted = [...silaFitra].sort(byYearDesc);
  return (
    <>
      <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        <span>Sila Fitra Details</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="rounded-lg overflow-hidden border border-border">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              {['For Year', 'Takhmeen', 'Received', 'Remaining', 'Date', 'Remark'].map(h => (
                <th key={h} className="th-navy">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-6 text-gray-400">No Sila Fitra records</td></tr>
            ) : sorted.map((s, i) => (
              <tr key={i} className="hover:bg-blue-500/[0.025]">
                <td className="px-3 py-2 border-t border-border font-semibold">{s.forYear}</td>
                <td className="px-3 py-2 border-t border-border">{fmt(s.takhmeen)}</td>
                <td className="px-3 py-2 border-t border-border text-green-600">{fmt(s.received)}</td>
                <td className={clsx('px-3 py-2 border-t border-border font-bold',
                  Number(s.remaining) > 0 ? 'bg-red-500 text-white' : 'text-green-600'
                )}>{fmt(s.remaining)}</td>
                <td className="px-3 py-2 border-t border-border text-gray-500">
                  {s.date ? new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td className="px-3 py-2 border-t border-border text-gray-500">{s.remark || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
