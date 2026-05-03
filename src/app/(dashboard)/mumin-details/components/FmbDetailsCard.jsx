'use client';

import { EditIcon, PrintIcon } from '@/components/shared/Icons';
import { fmtDate } from '../utils';

export default function FmbDetailsCard({ member, onEdit }) {
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="bg-surface border-b border-border px-3.5 py-2.5 text-[11px] font-bold text-navy-900 uppercase tracking-[.5px]">
        FMB Details
      </div>
      <div className="p-3.5 space-y-0">
        {[
          ['Close Year', member.closeYear          || '—'],
          ['Close Date', fmtDate(member.closeDate)        ],
          ['Temp From',  fmtDate(member.tempFrom)         ],
          ['Temp To',    fmtDate(member.tempTo)           ],
          ['Reason',     member.thaaliReason|| '—'],
          ['FMB Remark', member.fmbRemark   || '—'],
        ].map(([l, v]) => (
          <div key={l} className="flex gap-2 py-1.5 border-b border-surface-2 last:border-0">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[.4px] min-w-[88px] flex-shrink-0 pt-0.5">{l}</span>
            <span className="text-[12.5px] text-navy-900 font-medium">{v}</span>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border flex gap-2">
        <button className="btn btn-primary btn-sm flex-1 justify-center" onClick={onEdit}>
          <EditIcon className="w-3.5 h-3.5 mr-1.5" />Edit FMB
        </button>
        <button className="btn btn-secondary btn-sm flex-1 justify-center" onClick={() => window.print()}>
          <PrintIcon className="w-3.5 h-3.5 mr-1.5" />Print
        </button>
      </div>
    </div>
  );
}
