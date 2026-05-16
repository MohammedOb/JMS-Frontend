'use client';

import Modal from '@/components/shared/Modal';
import ComboBox from '@/components/shared/ComboBox';
import { SaveIcon } from '@/components/shared/Icons';

export default function EditMohallahMemberModal({
  open,
  onClose,
  saving,
  member,
  form,
  setForm,
  sectorOptions,
  subsectorOptions,
  onSave,
}) {
  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Change Mohallah - Acc# ${member?.accno || ''}`}
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving...' : 'Update'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Acc No</label>
            <input className="form-input bg-surface" value={member?.accno || ''} readOnly />
          </div>
          <div>
            <label className="form-label">ITS No</label>
            <input className="form-input bg-surface" value={member?.itsNo || ''} readOnly />
          </div>
        </div>

        <div>
          <label className="form-label">Full Name</label>
          <input className="form-input bg-surface" value={member?.name || ''} readOnly />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Sector</label>
            <ComboBox
              value={form.sector || ''}
              options={sectorOptions}
              placeholder="Type or select sector..."
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  sector: value,
                  subsector: '',
                  mohallahDescription: '',
                }))
              }
            />
          </div>
          <div>
            <label className="form-label">Subsector</label>
            <ComboBox
              value={form.subsector || ''}
              options={subsectorOptions}
              placeholder="Type or select subsector..."
              onChange={(value, option) =>
                setForm((prev) => ({
                  ...prev,
                  subsector: value,
                  mohallahDescription:
                    option?.mohallahDescription ?? prev.mohallahDescription,
                  sector: option?.sector ?? prev.sector,
                }))
              }
            />
          </div>
        </div>

        <div>
          <label className="form-label">Mohalla Description</label>
          <input className="form-input bg-surface" value={form.mohallahDescription || ''} readOnly />
        </div>
      </div>
    </Modal>
  );
}
