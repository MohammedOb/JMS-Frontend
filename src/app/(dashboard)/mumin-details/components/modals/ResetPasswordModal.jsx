'use client';

import Modal from '@/components/shared/Modal';
import { KeyIcon } from '@/components/shared/Icons';

export default function ResetPasswordModal({ open, onClose, member, onReset }) {
  return (
    <Modal open={open} onClose={onClose} title="Reset Member Password" size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onReset}>
            <KeyIcon className="w-3.5 h-3.5 mr-1.5" />Reset Password
          </button>
        </>
      }
    >
      <div className="bg-blue-50 border border-blue-100 border-l-4 border-l-blue-500 rounded-md p-3 text-[12px] text-blue-800 mb-3">
        ℹ Password will be reset to ITS No. (if available) or Acc No.
      </div>
      <div className="bg-surface border border-border rounded-md p-3 text-[12px] space-y-1">
        <div>Member: <strong>{member?.name}</strong></div>
        <div>ITS No.: <strong>{member?.itsNo}</strong> → New password: <strong>{member?.itsNo || member?.accno}</strong></div>
      </div>
    </Modal>
  );
}
