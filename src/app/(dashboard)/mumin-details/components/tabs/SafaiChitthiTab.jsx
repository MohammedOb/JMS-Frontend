'use client';

import { EditIcon, PrintIcon } from '@/components/shared/Icons';
import { StatusBadge } from '@/components/shared/Badge';
import { fmtDate } from '../../utils';

export default function SafaiChitthiTab({ safaiList, onAdd, onEdit, onPrint }) {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">Clearance certificates issued to this member</span>
          <span className="text-[12px] font-medium text-navy-800 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 whitespace-nowrap">
            {safaiList.length} record{safaiList.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onAdd}>+ New Safai Chitthi</button>
      </div>
      <div className="rounded-lg overflow-hidden border border-border">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              {['Sr#','Date','Reason','Issued By','Valid Till','Status','Actions'].map(h => (
                <th key={h} className="th-navy">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safaiList.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No safai chitthi records</td></tr>
            ) : safaiList.map((s, i) => (
              <tr key={i} className="hover:bg-blue-500/[0.025]">
                <td className="px-3 py-2 border-t border-border">{s.chitthiNo}</td>
                <td className="px-3 py-2 border-t border-border">{fmtDate(s.issueDate)}</td>
                <td className="px-3 py-2 border-t border-border">{s.reason}</td>
                <td className="px-3 py-2 border-t border-border">{s.issuedBy}</td>
                <td className="px-3 py-2 border-t border-border">{fmtDate(s.validTill)}</td>
                <td className="px-3 py-2 border-t border-border"><StatusBadge status={s.status} /></td>
                <td className="px-3 py-2 border-t border-border whitespace-nowrap">
                  <button className="btn btn-secondary btn-sm mr-1" onClick={() => onEdit(s)}>
                    <EditIcon className="w-3.5 h-3.5" />
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => onPrint(s)}>
                    <PrintIcon className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
