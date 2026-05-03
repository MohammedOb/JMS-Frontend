'use client';

import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';

export default function EditVajInfoModal({ open, onClose, member, vajInfoForm, setVF, onSave }) {
  return (
    <Modal open={open} onClose={onClose} title={`Edit Vajebaat Info — ${member?.name}`} size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save Vajebaat Info
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Token No.</label>
            <input className="form-input" placeholder="Token number" value={vajInfoForm.LocalTokenNo}
              onChange={e => setVF('LocalTokenNo', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Token Date</label>
            <input type="date" className="form-input" value={vajInfoForm.LocalTokenDate}
              onChange={e => setVF('LocalTokenDate', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Favor Name</label>
            <input className="form-input" placeholder="Favor name" value={vajInfoForm.FavorName}
              onChange={e => setVF('FavorName', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Favor ITS</label>
            <input className="form-input" placeholder="Favor ITS No." value={vajInfoForm.FavorITS}
              onChange={e => setVF('FavorITS', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Mouze</label>
            <input className="form-input" placeholder="Mouze" value={vajInfoForm.Mouze}
              onChange={e => setVF('Mouze', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Vajebaat Remark</label>
            <input className="form-input" placeholder="Optional remark" value={vajInfoForm.VajebaatRemark}
              onChange={e => setVF('VajebaatRemark', e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2.5 text-[12.5px] text-navy-900 cursor-pointer p-3 bg-surface rounded-lg border border-border">
          <input type="checkbox" className="accent-blue-500 w-4 h-4"
            checked={vajInfoForm.VajProfileUnlock}
            onChange={e => setVF('VajProfileUnlock', e.target.checked)} />
          Vajebaat Profile Unlock
        </label>
      </div>
    </Modal>
  );
}
