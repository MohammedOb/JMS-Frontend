'use client';

import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { fmt, SUB_HEADS } from '../../utils';

export default function TakhmeenModal({
  open, onClose,
  mode = 'add',
  member, permissions,
  row, setRow,
  onSave,
}) {
  if (!row) return null;

  const set = (k, v) => setRow(p => ({ ...p, [k]: v }));
  const remaining = Number(row.takhmeen || 0) - Number(row.received || 0);
  const isVajebaat = row.mainHead === 'Vajebaat';
  const isEdit = mode === 'edit';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Takhmeen — ${row.subHead}  ·  ${row.forYear} ` : 'Add Takhmeen Entry'}
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />
            {isEdit ? 'Update Takhmeen' : 'Save Takhmeen'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="bg-surface rounded-lg p-3 text-[12px] text-navy-900">
          Member: <strong>{member?.name}</strong> · Acc# <strong>{member?.accno}</strong>
        </div>

        {/* Hub Main Head + Hub Sub Head */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Hub Main Head *</label>
            <select className="form-select" value={row.mainHead || ''}
              onChange={e => { set('mainHead', e.target.value); set('subHead', ''); }}>
              <option value="">-- Select --</option>
              {Object.keys(SUB_HEADS).map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Hub Sub Head</label>
            <select className="form-select" value={row.subHead || ''}
              onChange={e => set('subHead', e.target.value)}>
              <option value="">-- Select Main Head First --</option>
              {(SUB_HEADS[row.mainHead] || []).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* For Year + Grade */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">For Year</label>
            <input className="form-input" placeholder={permissions?.ForYearAll} value={row.forYear || ''}
              onChange={e => set('forYear', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Grade</label>
            <input className="form-input" placeholder="e.g. A, B, C" value={row.grade || ''}
              onChange={e => set('grade', e.target.value)} />
          </div>
        </div>

        {/* Takhmeen + Received + Remaining */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="form-label">Takhmeen (₹) *</label>
            <input type="number" className="form-input" placeholder="0" value={row.takhmeen || 0}
              onChange={e => set('takhmeen', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Received (₹)</label>
            <input type="number" className="form-input" placeholder="0" value={row.received || 0}
              onChange={e => set('received', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Remaining (auto)</label>
            <input
              className="form-input bg-surface font-semibold text-right"
              value={fmt(remaining)}
              readOnly
            />
          </div>
        </div>

        {/* Takhmeen Date + Remark */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Takhmeen Date</label>
            <input type="date" className="form-input" value={row.date || ''}
              onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Remark</label>
            <input className="form-input" placeholder="Optional remark" value={row.remark || ''}
              onChange={e => set('remark', e.target.value)} />
          </div>
        </div>

        {/* ── Vajebaat-only fields ───────────────────────────────────────── */}
        {isVajebaat && (
          <>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider whitespace-nowrap">
                Vajebaat Fields
              </span>
              <div className="flex-1 h-px bg-blue-100" />
            </div>

            {/* Last Takhmeen + Current Takhmeen */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Last Takhmeen (₹)</label>
                <input type="number" className="form-input" placeholder="0" value={row.lastTakhmeen || ''}
                  onChange={e => set('lastTakhmeen', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Current Takhmeen (₹)</label>
                <input type="number" className="form-input" placeholder="0" value={row.currentTakhmeen || ''}
                  onChange={e => set('currentTakhmeen', e.target.value)} />
              </div>
            </div>

            {/* Paid In + Paid In Place */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Paid In</label>
                <input className="form-input" placeholder="e.g. Cash, Cheque" value={row.paidin || ''}
                  onChange={e => set('paidin', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Paid In Place</label>
                <input className="form-input" placeholder="e.g. Office, Home" value={row.place || ''}
                  onChange={e => set('place', e.target.value)} />
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
