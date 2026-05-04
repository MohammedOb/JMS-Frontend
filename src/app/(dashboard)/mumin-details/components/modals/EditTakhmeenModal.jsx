'use client';

import { useRef } from 'react';
import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { fmt, SUB_HEADS } from '../../utils';

export default function EditTakhmeenModal({ open, onClose, member, editTakRow, setEditTakRow, onSave }) {
  const set = (k, v) => setEditTakRow(p => ({ ...p, [k]: v }));

  const mainHeadRef = useRef(null);
  const subHeadRef  = useRef(null);
  const forYearRef  = useRef(null);
  const takhmeenRef = useRef(null);
  const dateRef     = useRef(null);

  const focusField = (ref) => {
    ref.current?.focus();
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSave = () => {
    if (!editTakRow?.mainHead)                                              { focusField(mainHeadRef); return; }
    if (!editTakRow?.subHead)                                               { focusField(subHeadRef);  return; }
    if (!editTakRow?.forYear)                                               { focusField(forYearRef);  return; }
    if (editTakRow?.takhmeen === '' || editTakRow?.takhmeen == null)        { focusField(takhmeenRef); return; }
    if (!editTakRow?.date)                                                  { focusField(dateRef);     return; }
    onSave();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Edit Takhmeen — ID #${editTakRow?.id}`} size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Update Takhmeen
          </button>
        </>
      }
    >
      {editTakRow && (
        <div className="space-y-3">
          <div className="bg-surface rounded-lg p-3 text-[12px] text-navy-900">
            Member: <strong>{member?.name}</strong> · Acc# <strong>{member?.accno}</strong>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Hub Main Head</label>
              <select ref={mainHeadRef} className="form-select" value={editTakRow.mainHead || ''}
                onChange={e => { set('mainHead', e.target.value); set('subHead', ''); }}>
                <option value="">-- Select --</option>
                {Object.keys(SUB_HEADS).map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Hub Sub Head</label>
              <select ref={subHeadRef} className="form-select" value={editTakRow.subHead || ''}
                onChange={e => set('subHead', e.target.value)}>
                <option value="">-- Select --</option>
                {(SUB_HEADS[editTakRow.mainHead] || []).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">For Year</label>
              <input ref={forYearRef} className="form-input" value={editTakRow.forYear || ''}
                onChange={e => set('forYear', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Grade</label>
              <input className="form-input" placeholder="e.g. A, B, C" value={editTakRow.grade || ''}
                onChange={e => set('grade', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">Takhmeen (₹)</label>
              <input ref={takhmeenRef} type="number" className="form-input"
                value={editTakRow.takhmeen ?? ''}
                onChange={e => set('takhmeen', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Received (₹)</label>
              <input type="number" className="form-input" value={editTakRow.received ?? ''}
                onChange={e => set('received', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Remaining (auto)</label>
              <input className="form-input bg-surface" value={fmt(Number(editTakRow.takhmeen || 0) - Number(editTakRow.received || 0))} readOnly />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Takhmeen Date</label>
              <input ref={dateRef} type="date" className="form-input" value={editTakRow.date || ''}
                onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Place</label>
              <input className="form-input" placeholder="e.g. Office, Home" value={editTakRow.place || ''}
                onChange={e => set('place', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Remark</label>
              <input className="form-input" placeholder="Optional remark" value={editTakRow.remark || ''}
                onChange={e => set('remark', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Vajebaat Remark</label>
              <input className="form-input" placeholder="Optional vajebaat remark" value={editTakRow.vajRemark || ''}
                onChange={e => set('vajRemark', e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
