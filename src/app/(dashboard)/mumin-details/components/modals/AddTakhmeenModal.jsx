'use client';

import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { SUB_HEADS } from '../../utils';

export default function AddTakhmeenModal({ open, onClose, member, permissions, takForm, setTakForm, onSave }) {
  const set = (k, v) => setTakForm(p => ({ ...p, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title="Add Takhmeen Entry" size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save Takhmeen
          </button>
        </>
      }
    >
      <div className="bg-surface rounded-lg p-3 mb-4 text-[12px] text-navy-900">
        Member: <strong>{member?.name}</strong> · Acc# <strong>{member?.accno}</strong>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="form-label">Hub Main Head</label>
          <select className="form-select" value={takForm.mainHead}
            onChange={e => set('mainHead', e.target.value) || set('subHead', '')}>
            <option value="">-- Select --</option>
            {Object.keys(SUB_HEADS).map(k => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Hub Sub Head</label>
          <select className="form-select" value={takForm.subHead}
            onChange={e => set('subHead', e.target.value)}>
            <option value="">-- Select Main Head First --</option>
            {(SUB_HEADS[takForm.mainHead] || []).map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="form-label">For Year</label>
          <input className="form-input" placeholder={permissions?.ForYearAll} value={takForm.forYear}
            onChange={e => set('forYear', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Grade</label>
          <input className="form-input" placeholder="e.g. A, B, C" value={takForm.grade}
            onChange={e => set('grade', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="form-label">Takhmeen (₹) *</label>
          <input type="number" className="form-input" placeholder="0" value={takForm.takhmeen}
            onChange={e => set('takhmeen', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Paid In (₹)</label>
          <input type="number" className="form-input" placeholder="0" value={takForm.paidin}
            onChange={e => set('paidin', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Takhmeen Date</label>
          <input type="date" className="form-input" value={takForm.date}
            onChange={e => set('date', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="form-label">Place</label>
          <input className="form-input" placeholder="e.g. Office, Home" value={takForm.place}
            onChange={e => set('place', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Remark</label>
          <input className="form-input" placeholder="Optional remark" value={takForm.remark}
            onChange={e => set('remark', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="form-label">Vajebaat Remark</label>
        <input className="form-input" placeholder="Optional vajebaat remark" value={takForm.vajRemark}
          onChange={e => set('vajRemark', e.target.value)} />
      </div>
    </Modal>
  );
}
