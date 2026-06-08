'use client';

import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { fmt, fmtDate, SUB_HEADS, ComboBox, normalizeArray } from '../../utils';
import { takhmeenService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function TakhmeenModal({
  open, onClose,
  mode = 'add',
  member,
  row, setRow,
  onSave,
}) {
  const { user } = useAuth();
  const [headOptions,  setHeadOptions]  = useState([]);
  const [gradeOptions, setGradeOptions] = useState([]);
  const [history,      setHistory]      = useState([]);
  const [histLoading,  setHistLoading]  = useState(false);

  // Load all HubSubHead options from API, fall back to static SUB_HEADS
  useEffect(() => {
    if (!open) { setHeadOptions([]); setGradeOptions([]); setHistory([]); return; }
    takhmeenService.loadHubHeadDetails({ IsActive: 1 })
      .then(res => {
        const rows = normalizeArray(res?.data);
        const seen = new Set();
        const opts = [];
        for (const r of rows) {
          const key = `${r.HubMainHead}||${r.HubSubHead}`;
          if (!seen.has(key)) { seen.add(key); opts.push({ mainHead: r.HubMainHead, subHead: r.HubSubHead }); }
        }
        if (opts.length) {
          setHeadOptions(opts);
        } else {
          setHeadOptions(Object.entries(SUB_HEADS).flatMap(([mh, subs]) => subs.map(sh => ({ mainHead: mh, subHead: sh }))));
        }
      })
      .catch(() => {
        setHeadOptions(Object.entries(SUB_HEADS).flatMap(([mh, subs]) => subs.map(sh => ({ mainHead: mh, subHead: sh }))));
      });
  }, [open]);

  // When subHead changes, auto-resolve mainHead silently
  useEffect(() => {
    if (!row?.subHead || !headOptions.length) return;
    const match = headOptions.find(o => o.subHead === row.subHead);
    if (match && match.mainHead !== row.mainHead) {
      setRow(p => ({ ...p, mainHead: match.mainHead }));
    }
  }, [row?.subHead, headOptions]);

  // Load Grade suggestions from API
  useEffect(() => {
    if (!row?.mainHead || !row?.subHead) { setGradeOptions([]); return; }
    const t = setTimeout(() => {
      takhmeenService.loadGradeDetails({
        HubMainHead: row.mainHead,
        HubSubHead:  row.subHead,
        Grade:       row.grade || '',
      })
        .then(res => {
          const rows = normalizeArray(res?.data);
          setGradeOptions(rows.map(r => ({
            value:  r.Grade,
            label:  `${r.Grade}  ·  ₹${Number(r.Amount).toLocaleString('en-IN')}`,
            amount: r.Amount,
          })));
        })
        .catch(() => setGradeOptions([]));
    }, 300);
    return () => clearTimeout(t);
  }, [row?.mainHead, row?.subHead, row?.grade]);

  // Load history for this mumin + subHead
  useEffect(() => {
    if (!open || !member?.accno || !row?.subHead) { setHistory([]); return; }
    setHistLoading(true);
    takhmeenService.loadDetails({ AccNo: member.accno, HubSubHead: row.subHead })
      .then(res => {
        const rows = normalizeArray(res?.data);
        const norm = rows.map(r => ({
          forYear:  r.ForYear      || r.forYear   || '',
          takhmeen: r.Takhmeen     || r.takhmeen  || 0,
          grade:    r.Grade        || r.grade     || '',
          date:     r.TakhmeenDate || r.date      || '',
        }));
        norm.sort((a, b) => String(b.forYear).localeCompare(String(a.forYear)));
        setHistory(norm.slice(0, 5));
      })
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));
  }, [open, member?.accno, row?.subHead]);

  const subHeadRef  = useRef(null);
  const forYearRef  = useRef(null);
  const takhmeenRef = useRef(null);
  const receivedRef = useRef(null);
  const dateRef     = useRef(null);

  if (!row) return null;

  const set = (k, v) => setRow(p => ({ ...p, [k]: v }));
  const remaining  = Number(row.takhmeen || 0) - Number(row.received || 0);
  const isVajebaat = row.mainHead === 'Vajebaat';
  const isEdit     = mode === 'edit';

  // All sub heads from API (no main head filter needed in UI)
  const subHeadOpts = [...new Set(headOptions.map(o => o.subHead).filter(Boolean))];

  const handleSave = () => {
    const checks = [
      { test: !row.subHead,                                    ref: subHeadRef,  label: 'Hub Sub Head' },
      { test: !row.forYear,                                    ref: forYearRef,  label: 'For Year' },
      { test: row.takhmeen === '' || row.takhmeen == null,     ref: takhmeenRef, label: 'Takhmeen amount' },
      { test: row.received  === '' || row.received  == null,   ref: receivedRef, label: 'Received amount' },
      { test: !row.date,                                       ref: dateRef,     label: 'Takhmeen Date' },
    ];
    for (const { test, ref, label } of checks) {
      if (test) {
        toast.error(`${label} is required`);
        ref.current?.focus();
        return;
      }
    }
    onSave();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Takhmeen — ${row.subHead}  ·  ${row.forYear}` : 'Add Takhmeen Entry'}
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
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

        {/* Hub Sub Head + For Year */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Hub Sub Head *</label>
            <ComboBox
              inputRef={subHeadRef}
              value={row.subHead || ''}
              options={subHeadOpts}
              placeholder="Type or select..."
              onChange={(v) => { set('subHead', v); set('grade', ''); setGradeOptions([]); }}
            />
          </div>
          <div>
            <label className="form-label">For Year</label>
            <input ref={forYearRef} className="form-input" placeholder={user?.ForYearAll} value={row.forYear || ''}
              onChange={e => set('forYear', e.target.value)} />
          </div>
        </div>

        {/* History grid — shows when subHead selected */}
        {row.subHead && (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="bg-navy-900 text-white text-[10px] font-semibold px-3 py-1.5 uppercase tracking-wider">
              Last entries — {row.subHead}
            </div>
            {histLoading ? (
              <div className="text-[11px] text-gray-400 px-3 py-2">Loading history…</div>
            ) : history.length === 0 ? (
              <div className="text-[11px] text-gray-400 px-3 py-2">No history found</div>
            ) : (
              <table className="w-full text-[11px]">
                <thead>
                  <tr>
                    {['Year','Takhmeen','Grade','Date'].map(h => (
                      <th key={h} className="th-navy text-[10px] py-1 px-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} className="hover:bg-blue-50/40">
                      <td className="px-2 py-1 border-t border-border">{h.forYear}</td>
                      <td className="px-2 py-1 border-t border-border">{fmt(h.takhmeen)}</td>
                      <td className="px-2 py-1 border-t border-border">{h.grade || '—'}</td>
                      <td className="px-2 py-1 border-t border-border">{fmtDate(h.date) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Grade */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Grade</label>
            <ComboBox
              value={row.grade || ''}
              options={gradeOptions}
              placeholder="e.g. A, B, C+"
              onChange={(v, o) => { set('grade', v); if (o?.amount != null) set('takhmeen', o.amount); }}
            />
          </div>
        </div>

        {/* Takhmeen + Received + Remaining */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Takhmeen (₹) *</label>
            <input ref={takhmeenRef} type="number" className="form-input" placeholder="0" value={row.takhmeen || 0}
              onChange={e => set('takhmeen', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Received (₹)</label>
            <input ref={receivedRef} type="number" className="form-input" placeholder="0" value={row.received || 0}
              onChange={e => set('received', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Remaining (auto)</label>
            <input className="form-input bg-surface font-semibold text-right" value={fmt(remaining)} readOnly />
          </div>
        </div>

        {/* Takhmeen Date + Remark */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Takhmeen Date</label>
            <input ref={dateRef} type="date" className="form-input" value={row.date || ''}
              onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Remark</label>
            <input className="form-input" placeholder="Optional remark" value={row.remark || ''}
              onChange={e => set('remark', e.target.value)} />
          </div>
        </div>

        {/* Vajebaat-only fields */}
        {isVajebaat && (
          <>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider whitespace-nowrap">
                Vajebaat Fields
              </span>
              <div className="flex-1 h-px bg-blue-100" />
            </div>

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
