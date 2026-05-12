'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { toHijriString } from '../utils/hijri';
import { memberService, safaiService } from '@/services';
import toast from 'react-hot-toast';

function parseOpts(raw) {
  const payload = raw?.data ?? raw;
  const arr = Array.isArray(payload) ? payload
    : Array.isArray(payload?.data) ? payload.data
    : Array.isArray(payload?.recordset) ? payload.recordset
    : Array.isArray(payload?.recordsets?.[0]) ? payload.recordsets[0]
    : [];
  return arr.map(item => {
    if (typeof item === 'string') return item.trim();
    const val = item?.Value ?? item?.value ?? item?.Name ?? item?.name
      ?? item?.Razafor ?? item?.Place ?? item?.EventTime
      ?? Object.values(item).find(v => v !== null && typeof v === 'string');
    return String(val ?? '').trim();
  }).filter(Boolean);
}

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
            <li
              key={i}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
              onMouseDown={e => { e.preventDefault(); onChange(s); setOpen(false); }}
            >
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

export default function AddEventModal({ open, onClose, form, onChange, onSave, saving }) {
  const [accNo, setAccNo] = useState('');
  const [accLoading, setAccLoading] = useState(false);
  const [venueOpts, setVenueOpts] = useState([]);
  const [razaOpts, setRazaOpts] = useState([]);
  const [timeOpts, setTimeOpts] = useState([]);
  const accTimer = useRef(null);
  const optsLoaded = useRef(false);

  useEffect(() => {
    if (!open) return;
    setAccNo('');
    if (optsLoaded.current) return;
    optsLoaded.current = true;
    Promise.allSettled([
      safaiService.loadRazaDropdownDetails({ Razafor: 'All' }),
      safaiService.loadRazaDropdownDetails({ Place: 'All' }),
      safaiService.loadRazaDropdownDetails({ EventTime: 'All' }),
    ]).then(([rfRes, plRes, tmRes]) => {
      if (rfRes.status === 'fulfilled') setRazaOpts(parseOpts(rfRes.value.data));
      if (plRes.status === 'fulfilled') setVenueOpts(parseOpts(plRes.value.data));
      if (tmRes.status === 'fulfilled') setTimeOpts(parseOpts(tmRes.value.data));
    });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDate = (val) => {
    onChange('date', val);
    onChange('hijriDate', toHijriString(val));
  };

  const onAccNoChange = (val) => {
    setAccNo(val);
    clearTimeout(accTimer.current);
    if (!val) return;
    accTimer.current = setTimeout(async () => {
      setAccLoading(true);
      try {
        const res = await memberService.loadMuminDetails({ Search: val });
        const d = res.data;
        let list = [];
        if (Array.isArray(d?.recordsets?.[0])) list = d.recordsets[0];
        else if (Array.isArray(d?.recordset)) list = d.recordset;
        else if (Array.isArray(d?.data)) list = d.data;
        else if (Array.isArray(d)) list = d;
        const exact = list.find(r => String(r?.AccNo || r?.accno || '') === String(val));
        const raw = exact ?? list[0];
        if (raw && (raw.AccNo || raw.accno || raw.FullName)) {
          const subsector = [
            raw.Subsector,
            raw.MohallaDescription || raw.SubsectorName,
          ].filter(Boolean).join(' - ');
          onChange('accNo', raw.AccNo || raw.accno || val);
          onChange('fullName', raw.FullName || raw.fullName || '');
          onChange('itsNo', String(raw.ITSNo || raw.itsNo || ''));
          onChange('mobile', String(raw.Mobile || raw.mobile || ''));
          onChange('mobile1', String(raw.Mobile1 || raw.mobile1 || ''));
          onChange('address', subsector || raw.Address || raw.address || '');
        } else {
          toast.error(`No member found for Acc# ${val}`);
        }
      } catch { toast.error('Failed to look up member'); }
      finally { setAccLoading(false); }
    }, 700);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Event"
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <style>{`@font-face{font-family:'AL-KANZ';src:url('/fonts/AL-KANZ.ttf') format('truetype');font-display:swap}`}</style>
      <div className="space-y-4 text-[13px]">

        {/* 1. Member Info */}
        <div>
          <SectionLabel>Member Info</SectionLabel>
          <div className="mb-3">
            <label className="form-label flex items-center gap-2">
              Acc No
              {accLoading && <span className="text-[10px] text-blue-400 animate-pulse">Looking up…</span>}
            </label>
            <input
              className="form-input"
              placeholder="Type Acc No to auto-fill member details"
              value={accNo}
              onChange={e => onAccNoChange(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Full name" value={form.fullName} onChange={e => onChange('fullName', e.target.value)} />
            </div>
            <div>
              <label className="form-label">ITS No</label>
              <input className="form-input" placeholder="ITS number" value={form.itsNo} onChange={e => onChange('itsNo', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Mobile</label>
              <input className="form-input" placeholder="Mobile" value={form.mobile} onChange={e => onChange('mobile', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Mobile 1</label>
              <input className="form-input" placeholder="Alternate mobile" value={form.mobile1} onChange={e => onChange('mobile1', e.target.value)} />
            </div>
          </div>
        </div>

        {/* 2. Event Details */}
        <div>
          <SectionLabel>Event Details</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Event Date <span className="text-red-500">*</span></label>
              <input type="date" className="form-input" value={form.date} onChange={e => handleDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Hijri Date</label>
              <div
                className="form-input bg-gray-50 border-gray-200 text-gray-700 min-h-[36px] flex items-center justify-end"
                style={{ fontFamily: "'AL-KANZ', serif", direction: 'rtl', fontSize: '14px' }}
              >
                {form.hijriDate || (
                  <span className="text-gray-300 text-[12px]" style={{ fontFamily: 'inherit' }}>— auto calculated —</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <label className="form-label">Event Name / Raza For <span className="text-red-500">*</span></label>
            <SuggestInput
              value={form.eventName}
              onChange={v => onChange('eventName', v)}
              options={razaOpts}
              placeholder="e.g. Darees, Ohbat Majlis, Aqiqa, Shadi Jaman"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="form-label">Event Time</label>
              <SuggestInput
                value={form.eventTime}
                onChange={v => onChange('eventTime', v)}
                options={timeOpts}
                placeholder="e.g. 01:45 PM"
              />
            </div>
            <div>
              <label className="form-label">Thaal (Count)</label>
              <input type="number" className="form-input" placeholder="No. of thaals" value={form.thaal} onChange={e => onChange('thaal', e.target.value)} min={0} />
            </div>
          </div>
        </div>

        {/* 3. Location */}
        <div>
          <SectionLabel>Location</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Address / Mohalla</label>
              <input className="form-input" placeholder="Mohalla / Area" value={form.address} onChange={e => onChange('address', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Venue / Place</label>
              <SuggestInput
                value={form.venue}
                onChange={v => onChange('venue', v)}
                options={venueOpts}
                placeholder="e.g. Jumaat Khana, Ghare, Hall"
              />
            </div>
          </div>
        </div>

        {/* 4. Request Info */}
        <div>
          <SectionLabel>Request Info</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Requested By</label>
              <input className="form-input" placeholder="Name of requester" value={form.requestBy} onChange={e => onChange('requestBy', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Created By</label>
              <input className="form-input bg-gray-50 text-gray-500" value={form.createdBy} readOnly placeholder="Auto-filled from login" />
            </div>
          </div>
        </div>

        <div>
          <label className="form-label">Remark</label>
          <textarea
            className="form-input py-2 resize-y"
            rows={3}
            placeholder="Additional remarks…"
            value={form.remark}
            onChange={e => onChange('remark', e.target.value)}
          />
        </div>

      </div>
    </Modal>
  );
}
