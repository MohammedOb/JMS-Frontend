'use client';

import Modal from '@/components/shared/Modal';
import ComboBox from '@/components/shared/ComboBox';
import { SaveIcon } from '@/components/shared/Icons';

export default function EditMohallahModal({
  open,
  mode,
  form,
  setForm,
  onClose,
  onSave,
  saving,
  sectorOptions,
  subsectorOptions,
}) {
  const title = mode === 'edit' ? 'Edit Mohallah' : 'Add Mohallah';

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving...' : mode === 'edit' ? 'Update' : 'Add'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="form-label">Sector</label>
          <ComboBox
            value={form.Sector || ''}
            options={sectorOptions}
            placeholder="Type or select sector..."
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                Sector: value,
                Subsector: '',
                MohallaDescription: mode === 'add' ? '' : prev.MohallaDescription,
              }))
            }
          />
        </div>
        <div>
          <label className="form-label">Subsector</label>
          <ComboBox
            value={form.Subsector || ''}
            options={subsectorOptions}
            placeholder="Type or select subsector..."
            onChange={(value, option) =>
              setForm((prev) => ({
                ...prev,
                Subsector: value,
                Sector: option?.sector ?? prev.Sector,
                MohallaDescription: option?.mohallahDescription ?? prev.MohallaDescription,
              }))
            }
          />
        </div>
        <div className="md:col-span-2">
          <label className="form-label">Mohalla Description</label>
          <input
            className="form-input"
            value={form.MohallaDescription || ''}
            onChange={(e) => set('MohallaDescription', e.target.value)}
            placeholder="Enter mohallah description"
          />
        </div>
      </div>
    </Modal>
  );
}
