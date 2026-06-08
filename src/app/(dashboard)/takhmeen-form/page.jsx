'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { memberService, takhmeenService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import ComboBox from '@/components/shared/ComboBox';
import toast from 'react-hot-toast';

// ── Page sizes (must match print-templates) ────────────────────────────────────
const PAGE_SIZES = {
  'A4-portrait':  { w: 794,  h: 1123 },
  'A4-landscape': { w: 1123, h: 794  },
  'A5-portrait':  { w: 559,  h: 794  },
  'A5-landscape': { w: 794,  h: 559  },
};
const DEFAULT_PAGE = 'A4-portrait';

// ── All mumin fields the designer can use ──────────────────────────────────────
const MUMIN_FIELD_MAP = {
  name:          m => m?.name          || '',
  accno:         m => m?.accno         || '',
  itsNo:         m => m?.itsNo         || '',
  mobile:        m => m?.mobile        || '',
  mobile1:       m => m?.mobile1       || '',
  hofName:       m => m?.hofName       || '',
  hofIts:        m => m?.hofIts        || '',
  sector:        m => m?.sector        || '',
  subsector:     m => m?.subsector     || '',
  subsectorName: m => m?.subsectorName || '',
  mohallah:      m => m?.mohallah      || '',
  address:       m => m?.address       || '',
  stayingIn:     m => m?.stayingIn     || '',
  sabeelType:    m => m?.sabeelType    || '',
  workStatus:    m => m?.workStatus    || '',
  grade:         m => m?.grade         || '',
  status:        m => m?.status        || '',
  thaaliStatus:  m => m?.thaaliStatus  || '',
  thaaliSize:    m => m?.thaaliSize    || '',
  sabeelAmount:  m => m?.sabeelAmount  ? `₹${Number(m.sabeelAmount).toLocaleString('en-IN')}` : '',
  sabeelRemark:  m => m?.sabeelRemark  || '',
  distributor:   m => m?.distributor   || '',
  tokenNo:       m => m?.tokenNo       || '',
  fmbRemark:     m => m?.fmbRemark     || '',
  createdDate:   m => m?.createdDate   || '',
  closeYear:     m => m?.closeYear     || '',
  tempFrom:      m => m?.tempFrom      || '',
  tempTo:        m => m?.tempTo        || '',
  mouze:         m => m?.mouze         || '',
};

const HISTORY_COL_LABELS = {
  forYear:   'Year',
  takhmeen:  'Takhmeen',
  received:  'Received',
  grade:     'Grade',
  date:      'Date',
  remark:    'Remark',
  remaining: 'Remaining',
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt     = n => (n != null && n !== '') ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
const fmtDate = v => { if (!v) return ''; try { return new Date(v).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); } catch { return String(v); } };

function normalizeArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (v.recordset) return v.recordset;
  if (Array.isArray(v.recordsets?.[0])) return v.recordsets[0];
  if (Array.isArray(v.data)) return v.data;
  return [];
}

function normalizeMember(m = {}) {
  const sub     = String(m.Subsector         ?? m.subsector         ?? '');
  const subName = String(m.MohallaDescription ?? m.SubsectorName     ?? m.subsectorName ?? '');
  return {
    accno:         m.AccNo          || m.accno         || '',
    name:          m.FullName       || m.name          || '',
    itsNo:         m.ITSNo          || m.itsNo         || '',
    mobile:        m.Mobile         || m.mobile        || '',
    mobile1:       m.Mobile1        || m.mobile1       || '',
    hofName:       m.HOFName        || m.hofName       || '',
    hofIts:        m.LocalHOFITSNo  || m.hofIts        || '',
    sector:        m.Sector         || m.sector        || '',
    subsector:     sub,
    subsectorName: subName,
    mohallah:      sub + (subName ? ' - ' + subName : ''),
    address:       m.Address        || m.address       || '',
    stayingIn:     m.StayingIn      || m.stayingIn     || '',
    sabeelType:    m.SabeelType     || m.sabeelType    || '',
    workStatus:    m.WorkStatus     || m.workStatus    || '',
    grade:         m.CurrentGrade   || m.grade         || '',
    status:        m.Status         || m.AccountStatus || m.status || '',
    thaaliStatus:  m.ThaaliStatus   || m.thaaliStatus  || '',
    thaaliSize:    m.ThaaliSize     || m.thaaliSize    || '',
    sabeelAmount:  m.SabeelAmt      || m.sabeelAmount  || '',
    sabeelRemark:  m.SabeelRemark   || m.sabeelRemark  || '',
    distributor:   m.DistributorName|| m.distributor   || '',
    tokenNo:       m.TokenNo        || m.tokenNo       || '',
    fmbRemark:     m.FMBRemark      || m.fmbRemark     || '',
    createdDate:   m.AccountCreated || m.createdDate   || '',
    closeYear:     m.ThaliCloseYear || m.closeYear     || '',
    tempFrom:      m.TempFromDate   || m.tempFrom      || '',
    tempTo:        m.TempToDate     || m.tempTo        || '',
    mouze:         m.Mouze          || m.mouze         || '',
  };
}

function normalizeTakRow(r) {
  return {
    forYear:   r.ForYear      || r.forYear   || '',
    takhmeen:  r.Takhmeen     || r.takhmeen  || 0,
    received:  r.Received     || r.received  || 0,
    grade:     r.Grade        || r.grade     || '',
    date:      r.TakhmeenDate || r.date      || '',
    remark:    r.Remark       || r.remark    || '',
    remaining: r.Remaining    !== undefined ? r.Remaining : (r.remaining ?? ''),
  };
}

function cellValue(row, key) {
  const v = row[key];
  if (key === 'takhmeen' || key === 'received' || key === 'remaining') return fmt(v);
  if (key === 'date') return fmtDate(v);
  return v || '';
}

function dbRowToTpl(row) {
  let config = {};
  try { config = JSON.parse(row.TemplateJson || '{}'); } catch {}
  return {
    id:         row.ID,
    name:       row.Name,
    subHead:    row.SubHead  || '',
    isDefault:  Boolean(row.IsDefault),
    pageSize:   config.pageSize  || DEFAULT_PAGE,
    margin:     config.margin    || {},
    marginUnit: config.marginUnit || 'mm',
    bgImage:    config.bgImage   || '',
    elements:   config.elements  || [],
  };
}

// ── Live canvas element ────────────────────────────────────────────────────────
function LiveElement({ el, member, subHead, forYear, history, histLoading }) {
  const ts = {
    fontSize:   el.fontSize  || 13,
    fontFamily: el.fontFamily || 'Arial',
    color:      el.fontColor || '#111827',
    fontWeight: el.bold   ? 700 : 400,
    fontStyle:  el.italic ? 'italic' : 'normal',
    textAlign:  el.align  || 'left',
    lineHeight: 1.3,
  };

  const containerStyle = {
    position:   'absolute',
    left:       el.x,
    top:        el.y,
    width:      el.w || 'auto',
    height:     el.h || 'auto',
    background: el.bgColor || 'transparent',
    overflow:   'hidden',
    padding:    '2px 4px',
    boxSizing:  'border-box',
    pointerEvents: 'none',
  };

  if (el.type === 'image') {
    return (
      <div style={{ ...containerStyle, padding: 0, background: 'transparent' }}>
        <img src={el.src} alt="" draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />
      </div>
    );
  }

  if (el.type === 'historyGrid') {
    const cols      = el.columns || ['forYear','takhmeen','grade','received'];
    const maxRows   = el.rowCount || 5;
    const dataRows  = history.slice(0, maxRows);
    const blankRows = Math.max(0, maxRows - dataRows.length);
    return (
      <div style={{ ...containerStyle, background: el.bgColor || '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: el.fontSize || 11, fontFamily: el.fontFamily || 'Arial' }}>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c} style={{ border: '1px solid #d1d5db', padding: '2px 5px', background: '#f0f4fa', fontSize: Math.max((el.fontSize || 11) - 1, 9), fontWeight: 600, textAlign: 'left' }}>
                  {HISTORY_COL_LABELS[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {histLoading ? (
              <tr><td colSpan={cols.length} style={{ padding: 8, textAlign: 'center', fontSize: 10, color: '#6b7280' }}>Loading…</td></tr>
            ) : dataRows.length === 0 ? (
              <tr><td colSpan={cols.length} style={{ padding: 8, textAlign: 'center', fontSize: 10, color: '#9ca3af' }}>No history</td></tr>
            ) : (
              dataRows.map((row, i) => (
                <tr key={i}>
                  {cols.map(c => (
                    <td key={c} style={{ border: '1px solid #e5e7eb', padding: '2px 5px' }}>{cellValue(row, c)}</td>
                  ))}
                </tr>
              ))
            )}
            {!histLoading && Array.from({ length: blankRows }).map((_, i) => (
              <tr key={`b_${i}`}>
                {cols.map(c => <td key={c} style={{ border: '1px solid #e5e7eb', padding: '2px 5px', height: 20 }} />)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (el.type === 'label') {
    return <div style={{ ...containerStyle, ...ts }}>{el.text}</div>;
  }

  if (el.type === 'inputLine') {
    return (
      <div style={{ ...containerStyle, ...ts, display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
        <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{el.label}&nbsp;</span>
        <span style={{ flex: 1, borderBottom: `1.5px solid ${el.fontColor || '#111'}`, display: 'block', minWidth: 20 }} />
      </div>
    );
  }

  // Field elements
  let value = '';
  if (el.type === 'muminField')   value = MUMIN_FIELD_MAP[el.field]?.(member) || '';
  if (el.type === 'subHead')      value = subHead  || '';
  if (el.type === 'forYear')      value = forYear  || '';
  if (el.type === 'currentDate')  value = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={{ ...containerStyle, ...ts }}>
      <span style={{ fontWeight: el.bold ? 700 : 600 }}>{el.label}&nbsp;</span>
      <span style={{ fontWeight: el.bold ? 700 : 600, color: value ? (el.fontColor || '#111827') : '#9ca3af' }}>
        {value || '___'}
      </span>
    </div>
  );
}

// ── Live Canvas ────────────────────────────────────────────────────────────────
function LiveCanvas({ template, member, subHead, forYear, history, histLoading }) {
  if (!template) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-[13px] flex-col gap-2">
        <div className="text-4xl opacity-30">□</div>
        <span>No template selected — go to <strong className="mx-1">Print Templates</strong> to create one.</span>
      </div>
    );
  }

  const pageSize = PAGE_SIZES[template.pageSize || DEFAULT_PAGE] || PAGE_SIZES[DEFAULT_PAGE];

  return (
    <div
      style={{
        position:   'relative',
        width:      pageSize.w,
        height:     pageSize.h,
        flexShrink: 0,
        background: '#ffffff',
        border:     '1px solid #c9cdd4',
        boxShadow:  '0 4px 24px rgba(0,0,0,0.12)',
        margin:     '0 auto',
        overflow:   'hidden',
      }}
    >
      {(template.elements || []).map(el => (
        <LiveElement
          key={el.id}
          el={el}
          member={member}
          subHead={subHead}
          forYear={forYear}
          history={history}
          histLoading={histLoading}
        />
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function TakhmeenFormPage() {
  const searchParams  = useSearchParams();
  const { can }       = useAuth();
  const isAdmin       = can('takhmeen.edit');
  const autoPrinted   = useRef(false);

  const [templates,   setTemplates]   = useState([]);
  const [activeId,    setActiveId]    = useState('');
  const [accNoInput,  setAccNoInput]  = useState('');
  const [member,      setMember]      = useState(null);
  const [searching,   setSearching]   = useState(false);
  const [subHeadOpts, setSubHeadOpts] = useState([]);
  const [subHead,     setSubHead]     = useState('');
  const [forYear,     setForYear]     = useState('');
  const [history,     setHistory]     = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  // Load templates from DB + auto-select by templateId or subhead param
  useEffect(() => {
    takhmeenService.loadFormTemplates()
      .then(res => {
        const rows = res?.data?.data || [];
        const tpls = rows.map(dbRowToTpl);
        setTemplates(tpls);
        if (!tpls.length) return;
        const templateIdParam = searchParams.get('templateId');
        if (templateIdParam) {
          const direct = tpls.find(t => String(t.id) === String(templateIdParam));
          if (direct) { setActiveId(direct.id); return; }
        }
        const sh = searchParams.get('subhead')?.toLowerCase();
        if (sh) {
          const bySubHead  = tpls.filter(t => { const tsh = t.subHead?.toLowerCase() || ''; return tsh && (tsh === sh || tsh.includes(sh) || sh.includes(tsh)); });
          const defaultOne = bySubHead.find(t => t.isDefault) || bySubHead[0];
          const nameMatch  = tpls.find(t => t.name.toLowerCase().includes(sh));
          setActiveId((defaultOne || nameMatch || tpls[0]).id);
        } else {
          setActiveId(tpls[0].id);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fill from URL params (accno + subhead) — runs once on mount
  useEffect(() => {
    const accno = searchParams.get('accno');
    const sh    = searchParams.get('subhead');
    const fy    = searchParams.get('forYear');
    if (sh)    setSubHead(sh);
    if (fy)    setForYear(fy);
    if (accno) { setAccNoInput(accno); searchMember(accno); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load HubSubHead options (no main head filter)
  useEffect(() => {
    takhmeenService.loadHubHeadDetails({ IsActive: 1 })
      .then(res => {
        const rows = normalizeArray(res?.data);
        const seen = new Set();
        const opts = [];
        for (const r of rows) {
          const sh = r.HubSubHead;
          if (sh && !seen.has(sh)) { seen.add(sh); opts.push(sh); }
        }
        setSubHeadOpts(opts);
        // Resolve URL param to actual DB subhead value (handles partial/case-insensitive matches)
        const paramSh = searchParams.get('subhead');
        if (paramSh && opts.length) {
          const p = paramSh.toLowerCase();
          const match = opts.find(o => o.toLowerCase() === p)
                     || opts.find(o => o.toLowerCase().includes(p))
                     || opts.find(o => p.includes(o.toLowerCase()));
          if (match) setSubHead(match);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Search member by AccNo (overrideAccNo bypasses accNoInput state — used for URL param auto-fill)
  const searchMember = useCallback(async (overrideAccNo) => {
    const val = (overrideAccNo !== undefined ? String(overrideAccNo) : accNoInput).trim();
    if (!val) { toast.error('Enter an AccNo'); return; }
    setSearching(true);
    setMember(null);
    setHistory([]);
    try {
      const res  = await memberService.loadMuminDetails({ AccNo: val });
      const rows = normalizeArray(res?.data);
      if (!rows.length) { toast.error('Member not found'); return; }
      setMember(normalizeMember(rows[0]));
    } catch {
      toast.error('Member not found');
    } finally {
      setSearching(false);
    }
  }, [accNoInput]);

  // Load history when member + subHead set
  useEffect(() => {
    if (!member?.accno || !subHead) { setHistory([]); return; }
    setHistLoading(true);
    takhmeenService.loadDetails({ AccNo: member.accno, HubSubHead: subHead })
      .then(res => {
        const rows = normalizeArray(res?.data);
        const norm = rows.map(normalizeTakRow);
        norm.sort((a, b) => String(b.forYear).localeCompare(String(a.forYear)));
        setHistory(norm.slice(0, 12));
      })
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));
  }, [member?.accno, subHead]);

  const activeTemplate = templates.find(t => t.id === activeId) || null;

  // Non-admin: auto-print once template + member data are ready, then close on afterprint
  useEffect(() => {
    if (isAdmin) return;
    const close = () => window.close();
    window.addEventListener('afterprint', close);
    return () => window.removeEventListener('afterprint', close);
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin || autoPrinted.current || !activeTemplate) return;
    const t = setTimeout(() => { autoPrinted.current = true; window.print(); }, 600);
    return () => clearTimeout(t);
  }, [isAdmin, activeTemplate, member]);

  function handlePrint() {
    if (!activeTemplate) { toast.error('Select a template first'); return; }
    window.print();
  }

  return (
    <>
      {/* Print-only CSS */}
      <style>{`
        @media print {
          @page { margin: 0; }
          body * { visibility: hidden; }
          #tak-print-root,
          #tak-print-root * { visibility: visible; }
          #tak-print-root {
            display: block !important;
            position: fixed;
            top: 0;
            left: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        #tak-print-root { display: none; }
      `}</style>

      {/* Hidden print target */}
      <div id="tak-print-root">
        {activeTemplate && (() => {
          const ps = PAGE_SIZES[activeTemplate.pageSize || DEFAULT_PAGE] || PAGE_SIZES[DEFAULT_PAGE];
          return (
            <div style={{
              position: 'relative', width: ps.w, height: ps.h, overflow: 'hidden',
              background: '#fff',
              WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
            }}>
              {(activeTemplate.elements || []).map(el => (
                <LiveElement key={el.id} el={el} member={member} subHead={subHead} forYear={forYear} history={history} histLoading={false} />
              ))}
            </div>
          );
        })()}
      </div>

      {/* Screen UI */}
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-title text-navy-900">Takhmeen Form</h1>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Search a mumin, select SubHead and year, then print.
            </p>
          </div>
          {isAdmin && <button onClick={handlePrint} className="btn btn-primary">Print Form</button>}
        </div>

        {/* Controls bar — admin only */}
        {isAdmin && <div className="card mb-4 flex-shrink-0" style={{ overflow: 'visible' }}>
          <div className="card-body py-3" style={{ overflow: 'visible' }}>
            <div className="flex flex-wrap gap-3 items-end">

              {/* Template selector */}
              <div className="flex-shrink-0 w-44">
                <label className="form-label">Template</label>
                <select className="form-input" value={activeId} onChange={e => setActiveId(e.target.value)}>
                  {!templates.length && <option value="">— No templates —</option>}
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* AccNo search */}
              <div className="flex gap-2 items-end flex-shrink-0">
                <div>
                  <label className="form-label">Acc No</label>
                  <input
                    className="form-input w-28"
                    placeholder="e.g. 12345"
                    value={accNoInput}
                    onChange={e => setAccNoInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchMember()}
                  />
                </div>
                <button onClick={searchMember} disabled={searching}
                  className="btn btn-secondary btn-sm mb-[1px]">
                  {searching ? 'Searching…' : 'Search'}
                </button>
              </div>

              {/* Member info badge */}
              {member && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-[12px] flex-shrink-0">
                  <span className="font-semibold text-navy-900">{member.name}</span>
                  <span className="text-gray-500 ml-2">Acc# {member.accno}</span>
                  {member.sector && <span className="text-gray-400 ml-2">· {member.sector}</span>}
                </div>
              )}

              {/* HubSubHead */}
              <div className="flex-shrink-0 w-52">
                <label className="form-label">Hub Sub Head</label>
                <ComboBox value={subHead} options={subHeadOpts} placeholder="Select sub head…" onChange={v => setSubHead(v)} />
              </div>

              {/* For Year */}
              <div className="flex-shrink-0 w-24">
                <label className="form-label">For Year</label>
                <input className="form-input" placeholder="2025" value={forYear} onChange={e => setForYear(e.target.value)} />
              </div>
            </div>
          </div>
        </div>}

        {/* Canvas */}
        <div className="flex-1 min-h-0 overflow-auto bg-gray-200 rounded-xl p-6"
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <LiveCanvas
            template={activeTemplate}
            member={member}
            subHead={subHead}
            forYear={forYear}
            history={history}
            histLoading={histLoading}
          />
        </div>
      </div>
    </>
  );
}
