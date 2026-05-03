'use client';

import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';

export default function HimTakhmeenModal({ open, onClose, member, permissions, himForm, setHimForm, onSave }) {
  return (
    <Modal open={open} onClose={onClose} title={`HIM Takhmeen — ${member?.name}`} size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save HIM Takhmeen
          </button>
        </>
      }
    >
      <div className="bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 rounded-md p-3 text-[12px] text-amber-800 mb-3">
        ⚠ HIM Takhmeen not yet entered for year {permissions?.ForYearFMB}
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">For Year</label>
            <input className="form-input bg-surface" value={permissions?.ForYearFMB} readOnly />
          </div>
          <div>
            <label className="form-label">HIM Total (auto-calc)</label>
            <input className="form-input bg-surface" placeholder="System will calculate" readOnly />
          </div>
        </div>
        <div>
          <label className="form-label">Manual Takhmeen Override</label>
          <input type="number" className="form-input" placeholder="Enter if different from HIM total"
            value={himForm.override}
            onChange={e => setHimForm(p => ({ ...p, override: e.target.value }))} />
        </div>
        <div className="bg-blue-50 border border-blue-100 border-l-4 border-l-blue-500 rounded-md p-3 text-[12px] text-blue-800">
          ℹ This will insert into TakhmeenDetail with HubMainHead=Vajebaat, HubSubHead=HIM
        </div>
      </div>
    </Modal>
  );
}
