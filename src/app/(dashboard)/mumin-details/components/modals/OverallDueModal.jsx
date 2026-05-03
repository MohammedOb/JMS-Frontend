'use client';

import clsx from 'clsx';
import Modal from '@/components/shared/Modal';
import { PrintIcon } from '@/components/shared/Icons';
import { fmt } from '../../utils';

export default function OverallDueModal({ open, onClose, member, due, takhmeen }) {
  const totalRemaining = takhmeen.filter(t => t.remaining > 0).reduce((s, t) => s + (Number(t.remaining) || 0), 0);

  return (
    <Modal open={open} onClose={onClose}
      title={`Overall Due Report — ${member?.name} (${member?.accno})`}
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <PrintIcon className="w-3.5 h-3.5 mr-1.5" />Print Overall Due
          </button>
        </>
      }
    >
      <div className="grid grid-cols-5 gap-2 mb-4">
        {[
          { label: 'Sabeel Due', val: due?.sabeelDue },
          { label: 'FMB Due',    val: due?.fmbDue },
          { label: 'S. Niyaz',   val: due?.sniyazDue },
          { label: 'HIM Due',    val: due?.himDue },
          { label: 'Vajebaat',   val: due?.vajebaatDue },
        ].map(d => (
          <div key={d.label} className="bg-white border border-border rounded-lg p-2.5 text-center">
            <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{d.label}</div>
            <div className={clsx('font-display text-[16px] font-bold', d.val > 0 ? 'text-red-600' : 'text-green-600')}>
              {fmt(d.val)}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg overflow-hidden border border-border">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>{['Type','For Year','Takhmeen','Received','Remaining'].map(h => <th key={h} className="th-navy">{h}</th>)}</tr>
          </thead>
          <tbody>
            {takhmeen.filter(t => t.remaining > 0).map((t, i) => (
              <tr key={i} className="hover:bg-blue-500/[0.025]">
                <td className="px-3 py-2 border-t border-border">{t.subHead}</td>
                <td className="px-3 py-2 border-t border-border">{t.forYear}</td>
                <td className="px-3 py-2 border-t border-border">{fmt(t.takhmeen)}</td>
                <td className="px-3 py-2 border-t border-border">{fmt(t.received)}</td>
                <td className="px-3 py-2 border-t border-border font-bold text-red-600">{fmt(t.remaining)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-red-50">
              <td colSpan={4} className="px-3 py-2.5 font-semibold text-red-800">Total Remaining</td>
              <td className="px-3 py-2.5 font-bold text-red-600 text-[14px]">{fmt(totalRemaining)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Modal>
  );
}
