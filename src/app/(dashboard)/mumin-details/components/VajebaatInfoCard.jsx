'use client';

import { EditIcon } from '@/components/shared/Icons';
import { fmtDate } from '../utils';

export default function VajebaatInfoCard({ member, onEdit }) {
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="bg-surface border-b border-border px-3.5 py-2.5 text-[11px] font-bold text-navy-900 uppercase tracking-[.5px]">
        Vajebaat Info
      </div>
      <div className="p-3.5 space-y-0">
        {[
          ['Token No.',  member.tokenNo   || '—'],
          ['Token Date', fmtDate(member.tokenDate)],
          ['Favor ITS',  member.favorIts  || '—'],
          ['Favor Name', member.favorName || '—'],
          ['Mouze',      member.mouze     || '—'],
        ].map(([l, v]) => (
          <div key={l} className="flex gap-2 py-1.5 border-b border-surface-2 last:border-0">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[.4px] min-w-[88px] flex-shrink-0 pt-0.5">{l}</span>
            <span className="text-[12.5px] text-navy-900 font-medium">{v}</span>
          </div>
        ))}
        <div className="flex gap-2 py-1.5">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[.4px] min-w-[88px] flex-shrink-0 pt-0.5">Vaj Unlock</span>
          <input type="checkbox" className="accent-blue-500" checked={!!member.vajUnlock} readOnly />
        </div>
      </div>
      <div className="p-3 border-t border-border">
        <button className="btn btn-primary btn-sm w-full justify-center" onClick={onEdit}>
          <EditIcon className="w-3.5 h-3.5 mr-1.5" />Edit Vajebaat Info
        </button>
      </div>
    </div>
  );
}
