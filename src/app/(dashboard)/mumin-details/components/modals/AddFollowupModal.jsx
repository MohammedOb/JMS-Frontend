'use client';

import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';

export default function AddFollowupModal({ open, onClose, followupForm, setFollowupForm, onSave }) {
  const set = (k, v) => setFollowupForm(p => ({ ...p, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title="Add Follow-up Note" size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save Follow-up
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="form-label">Follow-up Date</label>
          <input type="date" className="form-input" value={followupForm.date}
            onChange={e => set('date', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Reason / Note</label>
          <input className="form-input" placeholder="e.g. Called — no response" value={followupForm.note}
            onChange={e => set('note', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Next Action</label>
          <select className="form-select" value={followupForm.action}
            onChange={e => set('action', e.target.value)}>
            {['Call Again','Visit','Send SMS','Mark as Done'].map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}
