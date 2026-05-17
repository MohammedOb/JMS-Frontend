'use client';

import Modal from '@/components/shared/Modal';
import ComboBox from '../ComboBox';

export default function SectionModal({ open, mode, data, onClose, onChange, onSave, sectionTypeOptions, positionOptions }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'add' ? 'Add Section' : 'Edit Section'}
      size="sm"
      footer={<>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={onSave}>Save</button>
      </>}
    >
      <div className="space-y-3">
        <div>
          <label className="form-label">Section Name *</label>
          <input
            className="form-input"
            value={data.SectionName || ''}
            onChange={e => onChange('SectionName', e.target.value)}
            placeholder="e.g. Gents Main Hall"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Type</label>
            <ComboBox
              value={data.SectionType || ''}
              onChange={val => onChange('SectionType', val)}
              options={sectionTypeOptions}
              placeholder="Type or select…"
            />
          </div>
          <div>
            <label className="form-label">Position</label>
            <ComboBox
              value={data.Position || ''}
              onChange={val => onChange('Position', val)}
              options={positionOptions}
              placeholder="Type or select…"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Rows</label>
            <input type="number" min={1} className="form-input" value={data.RowCount || 10} onChange={e => onChange('RowCount', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Columns</label>
            <input type="number" min={1} className="form-input" value={data.ColCount || 10} onChange={e => onChange('ColCount', e.target.value)} />
          </div>
        </div>
        {(data.RowCount && data.ColCount) && (
          <p className="text-xs text-blue-600 font-medium">
            Total seats: {(parseInt(data.RowCount) || 0) * (parseInt(data.ColCount) || 0)}
          </p>
        )}
      </div>
    </Modal>
  );
}
