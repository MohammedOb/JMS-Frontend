'use client';

import { EditIcon } from '@/components/shared/Icons';
import { fmtDate } from '../../../utils';

export default function VajebaatInfoSection({ member, onEdit }) {
  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden mb-4">
      <div className="bg-surface border-b border-border px-4 py-2.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Vajebaat Info</span>
        {onEdit && (
          <button className="btn btn-primary btn-sm" onClick={onEdit}>
            <EditIcon className="w-3.5 h-3.5 mr-1.5" />Edit
          </button>
        )}
      </div>
      <div className="p-4 grid grid-cols-3 gap-x-6 gap-y-3">
        {[
          ['Token No.',  member?.tokenNo   || '—'],
          ['Token Date', fmtDate(member?.tokenDate)],
          ['Favor ITS',  member?.favorIts  || '—'],
          ['Favor Name', member?.favorName || '—'],
          ['Mouze',      member?.mouze     || '—'],
        ].map(([l, v]) => (
          <div key={l}>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{l}</div>
            <div className="text-[12.5px] text-navy-900 font-medium">{v}</div>
          </div>
        ))}
        <div>
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Vaj Unlock</div>
          <input type="checkbox" className="accent-blue-500 mt-1" checked={!!member?.vajUnlock} readOnly />
        </div>
      </div>
    </div>
  );
}
