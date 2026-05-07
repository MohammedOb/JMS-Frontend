'use client';

import { useRef, useState, useEffect } from 'react';
import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { ComboBox, SUB_HEADS, normalizeArray } from '../../utils';
import { takhmeenService } from '@/services';

export default function AddTakhmeenModal({ open, onClose, member, permissions, takForm, setTakForm, onSave }) {
  const set = (k, v) => setTakForm(p => ({ ...p, [k]: v }));

  const mainHeadRef = useRef(null);
  const subHeadRef  = useRef(null);
  const forYearRef  = useRef(null);
  const takhmeenRef = useRef(null);
  const dateRef     = useRef(null);

  const [headOptions,  setHeadOptions]  = useState([]);
  const [gradeOptions, setGradeOptions] = useState([]);

  const mainHeadOptions = [...new Set(headOptions.map(o => o.mainHead).filter(Boolean))];
  const subHeadOptions  = [...new Set(headOptions.filter(o => o.mainHead === takForm.mainHead).map(o => o.subHead).filter(Boolean))];

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
    if (!takForm.mainHead || !takForm.subHead) { setGradeOptions([]); return; }
    const t = setTimeout(() => {
      takhmeenService.loadGradeDetails({
        HubMainHead: takForm.mainHead,
        HubSubHead:  takForm.subHead,
        Grade:       takForm.grade || '',
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
  }, [takForm.mainHead, takForm.subHead, takForm.grade]);

  const focusField = (ref) => {
    (ref.current?.querySelector('input') || ref.current)?.focus();
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSave = () => {
    if (!takForm.mainHead)                                   { focusField(mainHeadRef); return; }
    if (!takForm.subHead)                                    { focusField(subHeadRef);  return; }
    if (!takForm.forYear)                                    { focusField(forYearRef);  return; }
    if (takForm.takhmeen === '' || takForm.takhmeen == null) { focusField(takhmeenRef); return; }
    if (!takForm.date)                                       { focusField(dateRef);     return; }
    onSave();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Takhmeen Entry" size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save Takhmeen
          </button>
        </>
      }
    >
      <div className="bg-surface rounded-lg p-3 mb-4 text-[12px] text-navy-900">
        Member: <strong>{member?.name}</strong> · Acc# <strong>{member?.accno}</strong>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div ref={mainHeadRef}>
          <label className="form-label">Hub Main Head</label>
          <ComboBox
            value={takForm.mainHead}
            options={mainHeadOptions}
            placeholder="Type or select..."
            onChange={(v) => { set('mainHead', v); set('subHead', ''); set('grade', ''); setGradeOptions([]); }}
          />
        </div>
        <div ref={subHeadRef}>
          <label className="form-label">Hub Sub Head</label>
          <ComboBox
            value={takForm.subHead}
            options={subHeadOptions}
            placeholder={takForm.mainHead ? 'Type or select...' : 'Select Main Head first'}
            disabled={!takForm.mainHead}
            onChange={(v) => { set('subHead', v); set('grade', ''); setGradeOptions([]); }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="form-label">For Year</label>
          <input ref={forYearRef} className="form-input" placeholder={permissions?.ForYearAll}
            value={takForm.forYear} onChange={e => set('forYear', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Grade</label>
          <ComboBox
            value={takForm.grade}
            options={gradeOptions}
            placeholder="e.g. A, B, C+"
            onChange={(v, o) => { set('grade', v); if (o?.amount != null) set('takhmeen', o.amount); }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="form-label">Takhmeen (₹) *</label>
          <input ref={takhmeenRef} type="number" className="form-input" placeholder="enter value 0 and above"
            value={takForm.takhmeen ?? ''} onChange={e => set('takhmeen', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Paid In (₹)</label>
          <input type="number" className="form-input" placeholder="enter value 0 and above"
            value={takForm.paidin} onChange={e => set('paidin', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Takhmeen Date</label>
          <input ref={dateRef} type="date" className="form-input"
            value={takForm.date} onChange={e => set('date', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="form-label">Place</label>
          <input className="form-input" placeholder="e.g. Office, Home"
            value={takForm.place} onChange={e => set('place', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Remark</label>
          <input className="form-input" placeholder="Optional remark"
            value={takForm.remark} onChange={e => set('remark', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="form-label">Vajebaat Remark</label>
        <input className="form-input" placeholder="Optional vajebaat remark"
          value={takForm.vajRemark} onChange={e => set('vajRemark', e.target.value)} />
      </div>
    </Modal>
  );
}
