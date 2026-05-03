'use client';

import { EditIcon, PrintIcon } from '@/components/shared/Icons';
import { StatusBadge } from '@/components/shared/Badge';
import { fmt, fmtDate } from '../../utils';

export default function ReceiptsTab({ receipts, permissions, onAddReceipt, onEditReceipt, onPrintReceipt }) {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[11px] text-gray-400">{receipts.length} receipts found</span>
        {permissions.MDNewInsert && (
          <button className="btn btn-primary btn-sm" onClick={onAddReceipt}>+ New Receipt</button>
        )}
      </div>
      <div className="rounded-lg overflow-hidden border border-border">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              {['Receipt#','Date','Type','Sub Type','For Year','Amount','Mode','Trans Type','Status','Actions'].map(h => (
                <th key={h} className="th-navy">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {receipts.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">No receipts found</td></tr>
            ) : receipts.map((r, i) => (
              <tr key={i} className={r.status === 'Cancelled' ? 'bg-red-50' : 'hover:bg-blue-500/[0.025]'}>
                <td className="px-3 py-2 border-t border-border text-blue-500 font-semibold">#{r.receiptNo}</td>
                <td className="px-3 py-2 border-t border-border whitespace-nowrap">{fmtDate(r.date)}</td>
                <td className="px-3 py-2 border-t border-border">{r.mainHead}</td>
                <td className="px-3 py-2 border-t border-border">{r.subHead}</td>
                <td className="px-3 py-2 border-t border-border">{r.forYear}</td>
                <td className="px-3 py-2 border-t border-border font-semibold">{fmt(r.amount)}</td>
                <td className="px-3 py-2 border-t border-border">{r.mode}</td>
                <td className="px-3 py-2 border-t border-border">{r.transType}</td>
                <td className="px-3 py-2 border-t border-border"><StatusBadge status={r.status} /></td>
                <td className="px-3 py-2 border-t border-border whitespace-nowrap">
                  {r.status !== 'Cancelled' && permissions.MDEditReceipt && (
                    <>
                      <button className="btn btn-secondary btn-sm mr-1" onClick={() => onEditReceipt(r)}>
                        <EditIcon className="w-3.5 h-3.5" />
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => onPrintReceipt(r)}>
                        <PrintIcon className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
