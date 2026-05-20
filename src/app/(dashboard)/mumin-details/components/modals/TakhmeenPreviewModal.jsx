'use client';

import clsx from 'clsx';
import Modal from '@/components/shared/Modal';
import { PrintIcon } from '@/components/shared/Icons';
import { fmt } from '../../utils';
import { useAuth } from '@/context/AuthContext';

export default function TakhmeenPreviewModal({ open, onClose, member, takhmeen }) {
  const { user } = useAuth();
  const totalRemaining = takhmeen.reduce((s, t) => s + (Number(t.remaining) || 0), 0);

  return (
    <Modal open={open} onClose={onClose} title={`Takhmeen Form Preview — ${member?.name}`} size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <PrintIcon className="w-3.5 h-3.5 mr-1.5" />Print Takhmeen Form
          </button>
        </>
      }
    >
      <div className="border-2 border-navy-800 rounded-lg p-5 font-sans">
        <div className="text-center border-b-2 border-navy-800 pb-3 mb-4">
          <div className="font-display text-[16px] font-bold text-navy-800">Sagwara Jamaat — Takhmeen Form</div>
          <div className="text-[11px] text-gray-400 mt-1">Annual Contribution Statement</div>
          <div className="font-display text-[13px] font-bold text-blue-500 mt-2 uppercase tracking-wider">
            Year: {user?.ForYearAll} H
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4 text-[12px]">
          {[
            ['Acc No.',    member?.accno],
            ['Full Name',  member?.name],
            ['ITS No.',    member?.itsNo],
            ['Mohallah',   member?.mohallah],
            ['Mobile',     member?.mobile],
            ['Date',       new Date().toLocaleDateString('en-GB')],
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
              <tr>{['Type','For Year','Grade','Takhmeen','Received','Remaining'].map(h => (
                <th key={h} className="th-navy text-[9px]">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {takhmeen.map((t, i) => (
                <tr key={i}>
                  <td className="px-2.5 py-1.5 border-t border-border">{t.subHead}</td>
                  <td className="px-2.5 py-1.5 border-t border-border">{t.forYear}</td>
                  <td className="px-2.5 py-1.5 border-t border-border">{t.grade || '—'}</td>
                  <td className="px-2.5 py-1.5 border-t border-border">{fmt(t.takhmeen)}</td>
                  <td className="px-2.5 py-1.5 border-t border-border">{fmt(t.received)}</td>
                  <td className={clsx('px-2.5 py-1.5 border-t border-border font-bold',
                    t.remaining === 0 ? 'text-green-600' : 'text-red-600'
                  )}>{fmt(t.remaining)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-right space-y-1 text-[12px] font-semibold">
          <div>Total Takhmeen: {fmt(takhmeen.reduce((s, t) => s + (t.takhmeen || 0), 0))}</div>
          <div className="text-green-600">Total Received: {fmt(takhmeen.reduce((s, t) => s + (t.received || 0), 0))}</div>
          <div className="text-red-600 text-[15px]">Total Remaining: {fmt(totalRemaining)}</div>
        </div>
      </div>
    </Modal>
  );
}
