'use client';

import Modal from '@/components/shared/Modal';
import { PrintIcon } from '@/components/shared/Icons';
import { fmt, fmtDate } from '../../utils';

export default function PrintReceiptModal({ open, onClose, member, receipt }) {
  if (!receipt) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Receipt Preview — ${member?.name}`} size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <PrintIcon className="w-3.5 h-3.5 mr-1.5" />Print Receipt
          </button>
        </>
      }
    >
      <div className="border-2 border-navy-800 rounded-lg p-5 font-sans relative">
        {['Cancelled', 'Cancel Receipt', 'Cancel'].includes(receipt.status) && (
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
            <span className="text-red-600 font-bold text-6xl transform -rotate-45">CANCELLED</span>
          </div>
        )}
        <div className="text-center border-b-2 border-navy-800 pb-3 mb-4">
          <div className="font-display text-[16px] font-bold text-navy-800">Sagwara Jamaat — Receipt</div>
          <div className="font-display text-[13px] font-bold text-blue-500 mt-2 uppercase tracking-wider">
            Receipt No: #{receipt.receiptNo}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4 text-[12px]">
          {[
            ['Acc No.',    member?.accno],
            ['Full Name',  member?.name],
            ['Mobile',     member?.mobile],
            ['Date',       fmtDate(receipt.receivedDate)],
            ['Mode',       receipt.mode],
            ['Status',     receipt.status],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-gray-400 min-w-[80px] font-medium">{k}:</span>
              <span className="font-semibold text-navy-900">{v || '—'}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg overflow-hidden border border-border mb-4">
          <table className="w-full border-collapse text-[11.5px]">
            <thead>
              <tr>{['Main Head','Sub Head','For Year','Amount'].map(h => (
                <th key={h} className="th-navy text-[10px]">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2.5 py-1.5 border-t border-border">{receipt.mainHead}</td>
                <td className="px-2.5 py-1.5 border-t border-border">{receipt.subHead}</td>
                <td className="px-2.5 py-1.5 border-t border-border">{receipt.forYear}</td>
                <td className="px-2.5 py-1.5 border-t border-border font-semibold">{fmt(receipt.amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="text-right text-[14px] font-bold text-navy-900">
          Total Amount: {fmt(receipt.amount)}
        </div>
      </div>
    </Modal>
  );
}