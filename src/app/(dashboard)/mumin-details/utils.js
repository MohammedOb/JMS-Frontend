'use client';

import { useState, useEffect, useRef } from 'react';

export const fmt     = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
export const today   = () => new Date().toISOString().split('T')[0];

export const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const toInputDate = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

export const thaaliVariant = {
  Regular:           'green',
  Temporary:         'blue',
  'Only Amount Pay': 'amber',
  'Not Taken':       'red',
  Closed:            'navy',
  'Temp Closed':     'orange',
  'Closed with Due': 'blue',
  'N/A':             'gray',
};

export const SUB_HEADS = {
  Sabeel:   ['Sabeel Regular', 'Sabeel Mutaveteen'],
  FMB:      ['FMB Regular', 'FMB Half Thaali'],
  Vajebaat: ['Vajebaat', 'Vajebaat House', 'Sila Fitra', 'Shehrullah Niyaz', 'HIM', 'Taherabad Safar'],
  Other:    ['General', 'Other'],
};

export function ComboBox({ value, onChange, options = [], placeholder, disabled, readOnly, className }) {
  const [open, setOpen] = useState(false);
  const wrapRef         = useRef(null);

  const q        = String(value || '').toLowerCase();
  const filtered = q
    ? options.filter(o => String(o.value ?? o).toLowerCase().includes(q) || String(o.label ?? '').toLowerCase().includes(q))
    : options;

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        className={className || 'form-input'}
        value={value || ''}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete="off"
        onChange={e => { onChange(e.target.value, null); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && !readOnly && !disabled && filtered.length > 0 && (
        <ul className="absolute z-[9999] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-0.5 max-h-52 overflow-y-auto text-[12px]" style={{ top: '100%' }}>
          {filtered.slice(0, 80).map((o, i) => {
            const val = o.value ?? o;
            const lbl = o.label ?? val;
            return (
              <li key={i} className="px-3 py-2 hover:bg-blue-50 cursor-pointer" onMouseDown={() => { onChange(val, o); setOpen(false); }}>
                {lbl}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export const normalizeArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (value.recordset) return value.recordset;
  if (Array.isArray(value.recordsets?.[0])) return value.recordsets[0];
  if (Array.isArray(value.data)) return value.data;
  return [];
};

export const normalizeTakRow = (r) => ({
  id:           r.ID           || r.Id           || r.id,
  forYear:      r.ForYear      || r.forYear,
  mainHead:     r.HubMainHead  || r.mainHead,
  subHead:      r.HubSubHead   || r.subHead,
  grade:        r.Grade        || r.grade        || '',
  takhmeen:     r.Takhmeen     || r.takhmeen     || 0,
  received:     r.Received     || r.received     || 0,
  remaining:    r.Remaining    || r.remaining    || 0,
  date:         r.TakhmeenDate || r.date         || '',
  remark:       r.Remark       || r.remark       || '',
  paidin:       r.Paidin       || r.paidin       || '',
  place:        r.Place        || r.place        || '',
  vajRemark:    r.VajRemark    || r.vajRemark    || '',
  // HIM-specific
  himTotal:     r.HIMTotal     || r.himTotal     || 0,
  // Shehrullah Niyaz-specific
  niyazCount:   r.NiyazCount   || r.niyazCount   || '',
  niyazTareekh: r.NiyazTareekh || r.niyazTareekh || '',
  niyazStatus:  r.NiyazStatus  || r.niyazStatus  || '',
  // Vajebaat favor info
  favorName:       r.FavorName       || r.favorName       || '',
  favorIts:        r.FavorITS        || r.favorIts        || '',
  mouze:           r.Mouze           || r.mouze           || '',
  // Vajebaat year-over-year amounts
  lastTakhmeen:    r.LastTakhmeen    || r.lastTakhmeen    || 0,
  currentTakhmeen: r.CurrentTakhmeen || r.currentTakhmeen || 0,
  // Sila Fitra specific (kept for backwards-compat if LoadTakhmeenDetails returns these)
  sfRate:    r.SF        || r.SFRate    || r.sfRate    || 0,
  mardo:     r.M         || r.Mardo     || r.mardo     || 0,
  baira:     r.B         || r.Baira     || r.baira     || 0,
  gairBalig: r.GB        || r.GairBalig || r.gairBalig || 0,
  hamal:     r.H         || r.Hamal     || r.hamal     || 0,
  amwaat:    r.AM        || r.Amwaat    || r.amwaat    || 0,
  sfAmount:  r.SFAmount  || r.sfAmount  || 0,
});

export const normalizeSfRow = (r) => ({
  id:       r.ID  || r.Id  || r.id,
  forYear:  r.ForYear || r.forYear || '',
  sfRate:   r.SF  || r.sf  || 0,
  mardo:    r.M   || r.m   || 0,
  baira:    r.B   || r.b   || 0,
  gairBalig:r.GB  || r.gb  || 0,
  hamal:    r.H   || r.h   || 0,
  amwaat:   r.AM  || r.am  || 0,
  sfAmount: r.SFAmount || r.sfAmount || 0,
});

export const normalizeMember = (m = {}) => ({
  accno:         m.AccNo          || m.accno          || m.ACCNO          || '',
  name:          m.FullName       || m.name           || m.NAME           || '',
  itsNo:         m.ITSNo          || m.itsNo          || m.ITS            || m.its  || '',
  mobile:        m.Mobile         || m.mobile         || '',
  mobile1:       m.Mobile1        || m.mobile1        || '',
  hofIts:        m.LocalHOFITSNo  || '',
  hofName:       m.HOFName        || m.hofName        || m.HofName        || '',
  mohallah:      (m.Subsector || '') + ' - ' + (m.SubsectorName || ''),
  subsector:     String(m.Subsector     ?? ''),
  subsectorName: String(m.SubsectorName ?? ''),
  sector:        String(m.Sector        ?? ''),
  stayingIn:     m.StayingIn      || m.stayingIn      || '',
  workStatus:    m.WorkStatus     || m.workStatus     || '',
  sabeelType:    m.SabeelType     || m.sabeelType     || '',
  grade:         m.CurrentGrade   || m.grade          || m.currentGrade  || '',
  sabeelAmount:  m.SabeelAmt      || m.sabeelAmount   || '',
  sabeelRemark:  m.SabeelRemark   || m.sabeelRemark   || '',
  thaaliStatus:  m.ThaaliStatus   || m.thaaliStatus   || '',
  thaaliSize:    m.ThaaliSize     || m.thaaliSize     || '',
  distributor:   m.DistributorName|| m.distributorname|| '',
  createdDate:   m.AccountCreated || '',
  smsEligibility:m.SmsEligibility || m.smsEligibility || '',
  loginAccess:   m.LoginAccess    || m.loginAccess    || '',
  closeYear:     m.ThaliCloseYear || '',
  closeDate:     m.ThaliCloseDate || '',
  tempFrom:      m.TempFromDate   || '',
  tempTo:        m.TempToDate     || '',
  thaaliReason:  m.Reason         || m.thaaliReason   || '',
  fmbRemark:     m.FMBRemark      || m.fmbRemark      || '',
  tokenNo:       m.TokenNo        || m.tokenNo        || '',
  tokenDate:     m.TokenDate      || m.tokenDate      || '',
  favorIts:      m.FavorITS       || m.favorIts       || '',
  favorName:     m.FavorName      || m.favorName      || '',
  mouze:         m.Mouze          || m.mouze          || '',
  vajUnlock:     m.VajProfileUnlock === 'True' || m.VajProfileUnlock === true
               || m.vajUnlock     === 'True'   || m.vajUnlock       === true,
  status:        m.Status         || m.status         || m.AccountStatus  || m.accountStatus || '',
});

export const normalizeMemberPayload = (payload) => {
  if (!payload) return { member: null, takhmeen: [], receipts: [], family: [], safai: [] };

  if (Array.isArray(payload)) {
    return { member: normalizeMember(payload[0] || {}), takhmeen: [], receipts: [], family: [], safai: [] };
  }

  if (payload.recordsets) {
    return {
      member:   normalizeMember(payload.recordsets[0]?.[0] || {}),
      takhmeen: normalizeArray(payload.recordsets[1]),
      receipts: normalizeArray(payload.recordsets[2]),
      family:   normalizeArray(payload.recordsets[3]),
      safai:    normalizeArray(payload.recordsets[4]),
    };
  }

  const rawData = payload.member || payload.Member
    || (Array.isArray(payload.data) ? payload.data[0] : payload.data)
    || payload[0] || payload;

  return {
    member:   normalizeMember(rawData),
    takhmeen: normalizeArray(payload.takhmeen  || payload.Takhmeen       || payload.takhmeenList  || payload.takhmeenData  || payload.data?.takhmeen),
    receipts: normalizeArray(payload.receipts  || payload.ReceiptHistory || payload.receiptHistory|| payload.receiptsList  || payload.data?.receipts),
    family:   normalizeArray(payload.family    || payload.FamilyDetails  || payload.familyList    || payload.Family        || payload.data?.family),
    safai:    normalizeArray(payload.safai     || payload.SafaiChitthi   || payload.safaiList     || payload.Safai         || payload.data?.safai),
  };
};
