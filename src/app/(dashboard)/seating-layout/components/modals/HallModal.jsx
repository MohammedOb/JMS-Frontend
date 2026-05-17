'use client';

import Modal from '@/components/shared/Modal';
import ComboBox from '../ComboBox';

export default function HallModal({ open, mode, data, onClose, onChange, onSave, venueTypeOptions }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'add' ? 'Add Venue' : 'Edit Venue'}
      size="sm"
      footer={<>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={onSave}>Save</button>
      </>}
    >
      <div className="space-y-3">
        <div>
          <label className="form-label">Venue Name *</label>
          <input
            className="form-input"
            value={data.HallName || ''}
            onChange={e => onChange('HallName', e.target.value)}
            placeholder="e.g. Qutbi Masjid"
          />
        </div>
        <div>
          <label className="form-label">Type</label>
          <ComboBox
            value={data.HallType || ''}
            onChange={val => onChange('HallType', val)}
            options={venueTypeOptions}
            placeholder="Type or select…"
          />
        </div>
        <div>
          <label className="form-label">Description</label>
          <input
            className="form-input"
            value={data.Description || ''}
            onChange={e => onChange('Description', e.target.value)}
            placeholder="Optional description"
          />
        </div>
      </div>
    </Modal>
  );
}
