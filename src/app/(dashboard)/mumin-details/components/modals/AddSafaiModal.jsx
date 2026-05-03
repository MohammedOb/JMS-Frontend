'use client';

import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';

export default function AddSafaiModal({ open, onClose, member, safaiForm, setSafaiForm, onSave }) {
  const set = (k, v) => setSafaiForm(p => ({ ...p, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title="New Safai Chitthi" size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Issue Chitthi
          </button>
        </>
      }
    >
      <div className="bg-surface rounded-lg p-3 mb-3 text-[12px]">
        Issuing for: <strong>{member?.name}</strong> · Acc# <strong>{member?.accno}</strong>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Issue Date</label>
            <input type="date" className="form-input" value={safaiForm.issueDate}
              onChange={e => set('issueDate', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Valid Till</label>
            <input type="date" className="form-input" value={safaiForm.validTill}
              onChange={e => set('validTill', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="form-label">Reason</label>
          <input className="form-input" placeholder="e.g. Travel, Nikah, Medical" value={safaiForm.reason}
            onChange={e => set('reason', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Remarks</label>
          <textarea className="form-input h-16 py-2" placeholder="Additional remarks…" value={safaiForm.remark}
            onChange={e => set('remark', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
