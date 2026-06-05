'use client';

import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';

const EMPTY = { DistributorName: '', Mobile: '' };

export default function DistributorFormModal({ open, onClose, form, setForm, onSave, isEdit }) {
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Distributor' : 'Add Distributor'}
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />{isEdit ? 'Update' : 'Save'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="form-label">Distributor Name <span className="text-red-500">*</span></label>
          <input
            className="form-input"
            placeholder="Full name of distributor"
            value={form.DistributorName}
            onChange={e => set('DistributorName', e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Mobile</label>
          <input
            className="form-input"
            placeholder="Mobile number"
            value={form.Mobile}
            onChange={e => set('Mobile', e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

DistributorFormModal.EMPTY = EMPTY;
