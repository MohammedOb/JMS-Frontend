'use client';

import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';

export default function SniyazTakhmeenModal({ open, onClose, sniyazForm, setSniyazForm, onSave }) {
  const set = (k, v) => setSniyazForm(p => ({ ...p, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title="Shehrullah Niyaz Takhmeen" size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save S. Niyaz Takhmeen
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">For Year</label>
            <input className="form-input" placeholder="e.g. 1446" value={sniyazForm.forYear}
              onChange={e => set('forYear', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Niyaz Count</label>
            <input type="number" className="form-input" value={sniyazForm.count}
              onChange={e => set('count', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Niyaz Tareekh</label>
            <input className="form-input" placeholder="e.g. 27 Ramadhan" value={sniyazForm.tareekh}
              onChange={e => set('tareekh', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Niyaz Status</label>
            <select className="form-select" value={sniyazForm.status}
              onChange={e => set('status', e.target.value)}>
              {['Done','Pending','Cancelled'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="form-label">Takhmeen Amount (₹)</label>
          <input type="number" className="form-input" placeholder="0" value={sniyazForm.amount}
            onChange={e => set('amount', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
