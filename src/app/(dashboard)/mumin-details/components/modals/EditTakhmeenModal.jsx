'use client';

import { useRef, useState, useEffect } from 'react';
import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { fmt, ComboBox, SUB_HEADS, normalizeArray } from '../../utils';
import { takhmeenService } from '@/services';

function fmtDateTime(val) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return String(val); }
}

export default function EditTakhmeenModal({ open, onClose, member, editTakRow, setEditTakRow, onSave }) {
  const set = (k, v) => setEditTakRow(p => ({ ...p, [k]: v }));

  const mainHeadRef     = useRef(null);
  const subHeadRef      = useRef(null);
  const forYearRef      = useRef(null);
  const takhmeenRef     = useRef(null);
  const dateRef         = useRef(null);
  const updateReasonRef = useRef(null);

  const [headOptions,  setHeadOptions]  = useState([]);
  const [gradeOptions, setGradeOptions] = useState([]);

  const mainHeadOptions = [...new Set(headOptions.map(o => o.mainHead).filter(Boolean))];
  const subHeadOptions  = [...new Set(headOptions.filter(o => o.mainHead === editTakRow?.mainHead).map(o => o.subHead).filter(Boolean))];

  useEffect(() => {
    if (!open) { setHeadOptions([]); setGradeOptions([]); return; }
    takhmeenService.loadHubHeadDetails({})
      .then(res => {
        const rows = normalizeArray(res?.data);
        const seen = new Set();
        const opts = [];
        for (const r of rows) {
          const key = `${r.HubMainHead}||${r.HubSubHead}`;
          if (!seen.has(key)) { seen.add(key); opts.push({ mainHead: r.HubMainHead, subHead: r.HubSubHead }); }
        }
        setHeadOptions(opts.length ? opts : Object.entries(SUB_HEADS).flatMap(([mh, subs]) => subs.map(sh => ({ mainHead: mh, subHead: sh }))));
      })
      .catch(() => setHeadOptions(Object.entries(SUB_HEADS).flatMap(([mh, subs]) => subs.map(sh => ({ mainHead: mh, subHead: sh })))));
  }, [open]);

  useEffect(() => {
    if (!editTakRow?.mainHead || !editTakRow?.subHead) { setGradeOptions([]); return; }
    const t = setTimeout(() => {
      takhmeenService.loadGradeDetails({
        HubMainHead: editTakRow.mainHead,
        HubSubHead:  editTakRow.subHead,
        Grade:       editTakRow.grade || '',
      }).then(res => {
        const rows = normalizeArray(res?.data);
        setGradeOptions(rows.map(r => ({
          value:  r.Grade,
          label:  `${r.Grade}  ·  ₹${Number(r.Amount).toLocaleString('en-IN')}`,
          amount: r.Amount,
        })));
      }).catch(() => setGradeOptions([]));
    }, 300);
    return () => clearTimeout(t);
  }, [editTakRow?.mainHead, editTakRow?.subHead, editTakRow?.grade]);

  const focusField = (ref) => {
    (ref.current?.querySelector('input') || ref.current)?.focus();
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSave = () => {
    if (!editTakRow?.mainHead)                                              { focusField(mainHeadRef);     return; }
    if (!editTakRow?.subHead)                                               { focusField(subHeadRef);      return; }
    if (!editTakRow?.forYear)                                               { focusField(forYearRef);      return; }
    if (editTakRow?.takhmeen === '' || editTakRow?.takhmeen == null)        { focusField(takhmeenRef);     return; }
    if (!editTakRow?.date)                                                  { focusField(dateRef);         return; }
    if (!editTakRow?.updateReason?.trim())                                  { focusField(updateReasonRef); return; }
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
            <div ref={mainHeadRef}>
              <label className="form-label">Hub Main Head</label>
              <ComboBox
                value={editTakRow.mainHead || ''}
                options={mainHeadOptions}
                placeholder="Type or select..."
                onChange={(v) => { set('mainHead', v); set('subHead', ''); set('grade', ''); setGradeOptions([]); }}
              />
            </div>
            <div ref={subHeadRef}>
              <label className="form-label">Hub Sub Head</label>
              <ComboBox
                value={editTakRow.subHead || ''}
                options={subHeadOptions}
                placeholder={editTakRow.mainHead ? 'Type or select...' : 'Select Main Head first'}
                disabled={!editTakRow.mainHead}
                onChange={(v) => { set('subHead', v); set('grade', ''); setGradeOptions([]); }}
              />
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
              <ComboBox
                value={editTakRow.grade || ''}
                options={gradeOptions}
                placeholder="e.g. A, B, C+"
                onChange={(v, o) => { set('grade', v); if (o?.amount != null) set('takhmeen', o.amount); }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="form-label">Takhmeen (₹)</label>
              <input ref={takhmeenRef} type="number" className="form-input"
                value={editTakRow.takhmeen ?? ''} onChange={e => set('takhmeen', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Received (₹)</label>
              <input type="number" className="form-input" value={editTakRow.received ?? ''}
                onChange={e => set('received', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Remaining (auto)</label>
              <input className="form-input bg-surface"
                value={fmt(Number(editTakRow.takhmeen || 0) - Number(editTakRow.received || 0))} readOnly />
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

          {/* ── Update Record ─────────────────────────────────────────────── */}
          <div className="border border-amber-200 bg-amber-50/40 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-2.5">
              Update Record
            </div>

            {(editTakRow.recordUpdateReason || editTakRow.recordUpdateDate) && (
              <div className="flex items-start gap-6 mb-3 pb-3 border-b border-amber-200">
                <div className="flex-1 min-w-0">
                  <label className="form-label text-gray-400">Last Update Reason</label>
                  <p className="text-[12px] text-gray-600 leading-relaxed">{editTakRow.recordUpdateReason || '—'}</p>
                </div>
                <div className="shrink-0">
                  <label className="form-label text-gray-400">Last Update Date</label>
                  <p className="text-[12px] text-gray-600 whitespace-nowrap">{fmtDateTime(editTakRow.recordUpdateDate)}</p>
                </div>
              </div>
            )}

            <div ref={updateReasonRef}>
              <label className="form-label">
                Reason for this Update <span className="text-red-500">*</span>
              </label>
              <input
                className="form-input"
                placeholder="Enter reason for this change…"
                value={editTakRow.updateReason || ''}
                onChange={e => set('updateReason', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
