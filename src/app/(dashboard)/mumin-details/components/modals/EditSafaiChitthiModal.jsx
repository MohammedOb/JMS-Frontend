'use client';

import { useState, useMemo } from 'react';
import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';

// ── Hijri conversion (anchor: 15 Jun 2026 = 1 Muharram 1448) ────────────────
const HIJRI_ANCHOR = { gYear: 2026, gMonth: 6, gDay: 15, hYear: 1448, hMonth: 1, hDay: 1 };
const HIJRI_MONTHS = [
  'محرم', 'صفر', 'ربيع الاول', 'ربيع الاخر',
  'جمادى الاولى', 'جمادى الاخرى', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذي القعدة', 'ذي الحجة',
];
let _hijriAdj = null;

function _islamicRaw(date, adj = 0) {
  const s = new Date(date.getFullYear(), date.getMonth(), date.getDate() + adj);
  let [day, m, y] = [s.getDate(), s.getMonth() + 1, s.getFullYear()];
  if (m < 3) { y--; m += 12; }
  const a = Math.floor(y / 100);
  const b = y >= 1583 ? 2 - a + Math.floor(a / 4) : 0;
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;
  let z = jd - 1948084;
  const cyc = Math.floor(z / 10631);
  z -= 10631 * cyc;
  const j = Math.floor((z - 8.01 / 60) / (10631 / 30));
  z -= Math.floor(j * (10631 / 30) + 8.01 / 60);
  let im = Math.floor((z + 28.5001) / 29.5);
  if (im === 13) im = 12;
  return { day: z - Math.floor(29.5001 * im - 29), month: im - 1, year: 30 * cyc + j };
}

function _hijriCorrection() {
  if (_hijriAdj !== null) return _hijriAdj;
  const anc = new Date(HIJRI_ANCHOR.gYear, HIJRI_ANCHOR.gMonth - 1, HIJRI_ANCHOR.gDay);
  for (let s = -60; s <= 60; s++) {
    const p = _islamicRaw(anc, s);
    if (p.day === HIJRI_ANCHOR.hDay && p.month === HIJRI_ANCHOR.hMonth - 1 && p.year === HIJRI_ANCHOR.hYear)
      return (_hijriAdj = s);
  }
  return (_hijriAdj = HIJRI_ANCHOR.hDay - _islamicRaw(anc, 0).day);
}

function toHijriString(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  const date = new Date(y, m - 1, d);
  const anc  = new Date(HIJRI_ANCHOR.gYear, HIJRI_ANCHOR.gMonth - 1, HIJRI_ANCHOR.gDay);
  const h = _islamicRaw(date, date < anc ? _hijriCorrection() - 1 : _hijriCorrection());
  return `${h.year}-${HIJRI_MONTHS[h.month]}-${h.day}`;
}
// ─────────────────────────────────────────────────────────────────────────────


const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString('en-GB').replace(/\//g, '-');
};

function statusBadge(status) {
  if (status === 'Raza Done')     return 'bg-green-600 text-white';
  if (status === 'Raza Approved') return 'bg-green-600 text-white';
  if (status === 'Raza Rejected') return 'bg-red-400 text-white';
  return 'bg-red-600 text-white'; // Raza Pending
}

// ── Autocomplete input ────────────────────────────────────────────────────────
function SuggestInput({ value, onChange, options = [], placeholder, className }) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    if (!options.length) return [];
    const q = (value || '').toLowerCase();
    return q ? options.filter(s => s.toLowerCase().includes(q)) : options;
  }, [value, options]);

  return (
    <div className="relative">
      <input
        className={className || 'form-input'}
        value={value || ''}
        autoComplete="off"
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-[9999] left-0 right-0 mt-0.5 bg-white border border-gray-200 rounded-lg shadow-xl max-h-44 overflow-y-auto text-[12px]">
          {filtered.map((s, i) => (
            <li key={i}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
              onMouseDown={e => { e.preventDefault(); onChange(s); setOpen(false); }}>
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{children}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function InfoChip({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">{label}</span>
      <div className="text-[13px] font-medium text-gray-700 leading-snug">{value || '—'}</div>
    </div>
  );
}

// ── Edit Safai Chitthi Modal ───────────────────────────────────────────────────
export default function EditSafaiChitthiModal({
  open, onClose,
  editTarget, form, set,
  saving, onSave,
  razaOpts, placeOpts, timeOpts,
}) {
  const handleEventDate = (val) => {
    set('EventDate', val);
    set('HijriDate', toHijriString(val));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit Safai Chitthi — ${editTarget?.FullName || ''} (Acc# ${editTarget?.AccNo || ''})`}
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />{saving ? 'Updating…' : 'Update'}
          </button>
        </>
      }
    >
      <style>{`@font-face{font-family:'AL-KANZ';src:url('/fonts/AL-KANZ.ttf') format('truetype');font-display:swap}`}</style>

      <div className="space-y-4 text-[13px]">

        {/* ── Info block ────────────────────────────────────────────────────── */}
        <div className="rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50 px-4 py-3">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <InfoChip
              label="Serial No"
              value={<span className="font-bold text-red-600 text-[14px]">{editTarget?.SerialNo}</span>}
            />
            <InfoChip label="Request Date" value={fmtDate(form.RequestDate)} />
            <InfoChip
              label="Raza Status"
              value={
                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge(form.RazaStatus)}`}>
                  {form.RazaStatus}
                </span>
              }
            />
            <InfoChip label="Requested By" value={form.Requestby} />
          </div>
        </div>

        {/* ── Contact ───────────────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Contact</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Mobile</label>
              <input className="form-input" value={form.Mobile}
                onChange={e => set('Mobile', e.target.value)} placeholder="Mobile" />
            </div>
            <div>
              <label className="form-label">Mobile 1</label>
              <input className="form-input" value={form.Mobile1}
                onChange={e => set('Mobile1', e.target.value)} placeholder="Mobile 1" />
            </div>
          </div>
        </div>

        {/* ── Location ──────────────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Location</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Address</label>
              <input className="form-input" value={form.Address}
                onChange={e => set('Address', e.target.value)} placeholder="Address" />
            </div>
            <div>
              <label className="form-label">Place</label>
              <SuggestInput value={form.Place} onChange={v => set('Place', v)}
                options={placeOpts} placeholder="e.g. Jumaat Khana, Ghare" />
            </div>
          </div>
        </div>

        {/* ── Event Details ─────────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Event Details</SectionLabel>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Event Date <span className="text-red-500">*</span></label>
                <input type="date" className="form-input" value={form.EventDate}
                  onChange={e => handleEventDate(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Hijri Date</label>
                <div
                  className="form-input bg-gray-50 border-gray-200 text-gray-700 min-h-[36px] flex items-center justify-end"
                  style={{ fontFamily: "'AL-KANZ', serif", direction: 'rtl', fontSize: '14px' }}
                >
                  {form.HijriDate || (
                    <span className="text-gray-300 text-[12px]" style={{ fontFamily: 'inherit' }}>— auto calculated —</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="form-label">Raza For <span className="text-red-500">*</span></label>
              <SuggestInput value={form.Razafor} onChange={v => set('Razafor', v)}
                options={razaOpts} placeholder="e.g. Aqiqa, Waras Jaman, Mithi Shitabi" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Event Time</label>
                <SuggestInput value={form.EventTime} onChange={v => set('EventTime', v)}
                  options={timeOpts} placeholder="e.g. 01:45 PM" />
              </div>
              <div>
                <label className="form-label">Thaal (Count)</label>
                <input type="number" className="form-input" value={form.Thaal}
                  onChange={e => set('Thaal', e.target.value)} placeholder="No. of thaals" min={0} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Remark ────────────────────────────────────────────────────────── */}
        <div>
          <label className="form-label">Remark</label>
          <textarea className="form-input py-2 resize-y" rows={3} value={form.Remark}
            onChange={e => set('Remark', e.target.value)} placeholder="Additional remarks…" />
        </div>

      </div>
    </Modal>
  );
}
