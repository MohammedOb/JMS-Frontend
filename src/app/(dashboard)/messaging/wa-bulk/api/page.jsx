'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { waBulkService, waQueueService, waTemplateService, lookupService } from '@/services';
import {
  SearchIcon, SendIcon, RefreshIcon, UsersIcon, AlertCircleIcon, CheckIcon,
} from '@/components/shared/Icons';
import toast from 'react-hot-toast';
import { interpolate } from '@/app/(dashboard)/due-details/components/waUtils';

// ── Placeholders for API members ──────────────────────────────────────────────
const MEMBER_PLACEHOLDERS = [
  { key: '{FullName}',    label: 'Full Name'   },
  { key: '{AccNo}',       label: 'Acc No.'     },
  { key: '{ITSNo}',       label: 'ITS No.'     },
  { key: '{Sector}',      label: 'Sector'      },
  { key: '{SubSector}',   label: 'Sub Sector'  },
  { key: '{Mohalla}',     label: 'Mohalla'     },
  { key: '{Mobile}',      label: 'Mobile'      },
  { key: '{Mobile1}',     label: 'Mobile 1'    },
  { key: '{SabeelType}',  label: 'Sabeel Type' },
  { key: '{OrgName}',     label: 'Org Name'    },
];

function memberVars(m) {
  return {
    FullName:   m.FullName          || '—',
    AccNo:      m.AccNo             || '—',
    ITSNo:      m.ITSNo             || '—',
    Sector:     m.Sector            || '—',
    SubSector:  m.Subsector         || '—',
    Mohalla:    m.MohallaDescription|| '—',
    Mobile:     m.Mobile            || '—',
    Mobile1:    m.Mobile1           || '—',
    SabeelType: m.SabeelRemark      || '—',
    OrgName:    'Shia Dawoodi Bohra Jamaat, Sagwara',
  };
}

function isValidMobile(val) {
  const s = String(val || '').replace(/[\s\-\+\(\)]/g, '').trim();
  return s.length >= 7 && /^\d+$/.test(s);
}

function normalizeMobile(val) {
  return String(val || '').replace(/[\s\-\(\)]/g, '').trim();
}

function etaStr(n) {
  if (n <= 0) return null;
  const secs = n * 18.5 + Math.floor(n / 7.5) * 35;
  if (secs < 60)   return `~${Math.round(secs)}s`;
  if (secs < 3600) return `~${Math.round(secs / 60)} min`;
  return `~${(secs / 3600).toFixed(1)} hr`;
}

// ── Small UI helpers ──────────────────────────────────────────────────────────
function StatPill({ label, value, color = 'text-gray-700' }) {
  return (
    <div className="flex items-center gap-1.5 text-[12px]">
      <span className="text-gray-400">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, disabled }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <select
        className="select select-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WaBulkApiPage() {
  // ── Lookup state ─────────────────────────────────────────────────────────
  const [sectors,    setSectors]    = useState([]);
  const [subsectors, setSubsectors] = useState([]);
  const [mohallahs,  setMohallahs]  = useState([]);
  const [sabeelTypes,setSabeelTypes]= useState([]);
  const [templates,  setTemplates]  = useState([]);

  // ── Filter state ─────────────────────────────────────────────────────────
  const [fSector,   setFSector]   = useState('');
  const [fSubSect,  setFSubSect]  = useState('');
  const [fMohalla,  setFMohalla]  = useState('');
  const [fSabeel,   setFSabeel]   = useState('');
  const [fMobOnly,  setFMobOnly]  = useState(false);

  // ── Members state ─────────────────────────────────────────────────────────
  const [members,    setMembers]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [hasLoaded,  setHasLoaded]  = useState(false);
  const [tableSearch,setTableSearch]= useState('');

  // ── Selection state ───────────────────────────────────────────────────────
  const [selectedAccNos, setSelectedAccNos] = useState(new Set());

  // ── Compose state ─────────────────────────────────────────────────────────
  const [tplKey,       setTplKey]       = useState('');
  const [msgTemplate,  setMsgTemplate]  = useState('');

  // ── Queue options ─────────────────────────────────────────────────────────
  const [allowDups,  setAllowDups]  = useState(false);
  const [batchLabel, setBatchLabel] = useState('');
  const [queuing,    setQueuing]    = useState(false);
  const [queued,     setQueued]     = useState(null);

  const textareaRef = useRef(null);

  // ── Load lookups on mount ─────────────────────────────────────────────────
  useEffect(() => {
    waBulkService.sectors().then(r => setSectors(r.data?.data || [])).catch(() => {});
    lookupService.getSabeelTypes().then(r => setSabeelTypes((r.data?.data || []).map(x => x.SabeelType || x))).catch(() => {});
    waTemplateService.getAll().then(r => {
      const list = (r.data?.data || []).filter(t => t.is_active);
      setTemplates(list);
      if (list.length) { setTplKey(list[0].template_key); setMsgTemplate(list[0].body); }
    }).catch(() => {});
  }, []);

  // ── Cascade filter: sector → subsectors ──────────────────────────────────
  useEffect(() => {
    setFSubSect(''); setFMohalla('');
    setSubsectors([]); setMohallahs([]);
    if (!fSector) return;
    waBulkService.subsectors(fSector).then(r => setSubsectors(r.data?.data || [])).catch(() => {});
    waBulkService.mohallahs(fSector, '').then(r => setMohallahs(r.data?.data || [])).catch(() => {});
  }, [fSector]);

  useEffect(() => {
    setFMohalla('');
    if (!fSector) return;
    waBulkService.mohallahs(fSector, fSubSect).then(r => setMohallahs(r.data?.data || [])).catch(() => {});
  }, [fSubSect]);

  // ── Template body sync ────────────────────────────────────────────────────
  useEffect(() => {
    const t = templates.find(x => x.template_key === tplKey);
    if (t) setMsgTemplate(t.body);
  }, [tplKey]);

  // ── Load members ─────────────────────────────────────────────────────────
  const loadMembers = useCallback(async () => {
    setLoading(true);
    setSelectedAccNos(new Set());
    setTableSearch('');
    try {
      const res = await waBulkService.members({
        Sector:             fSector    || undefined,
        Subsector:          fSubSect   || undefined,
        MohallaDescription: fMohalla   || undefined,
        SabeelType:         fSabeel    || undefined,
        MobileOnly:         fMobOnly   || undefined,
      });
      const data = res.data?.data || [];
      setMembers(data);
      setHasLoaded(true);
      if (!data.length) toast('No members found for selected filters', { icon: '🔍' });
    } catch (err) {
      const noRecord = err?.response?.data?.success === 0;
      if (noRecord) {
        setMembers([]);
        setHasLoaded(true);
        toast('No members found for selected filters', { icon: '🔍' });
      } else {
        toast.error('Failed to load members');
      }
    } finally {
      setLoading(false);
    }
  }, [fSector, fSubSect, fMohalla, fSabeel, fMobOnly]);

  // ── Derived / computed values ─────────────────────────────────────────────
  const displayed = useMemo(() => {
    if (!tableSearch) return members;
    const q = tableSearch.toLowerCase();
    return members.filter(m =>
      (m.FullName || '').toLowerCase().includes(q) ||
      (m.AccNo || '').includes(q) ||
      (m.Mobile || '').includes(q)
    );
  }, [members, tableSearch]);

  const mobileCountMap = useMemo(() => {
    const map = {};
    for (const m of members) {
      const mob = normalizeMobile(m.Mobile);
      if (mob && isValidMobile(m.Mobile)) map[mob] = (map[mob] || 0) + 1;
    }
    return map;
  }, [members]);

  const selectedMembers = useMemo(
    () => members.filter(m => selectedAccNos.has(m.AccNo)),
    [members, selectedAccNos]
  );

  const effectiveItems = useMemo(() => {
    if (allowDups) return selectedMembers;
    const seen = new Set();
    return selectedMembers.filter(m => {
      const mob = normalizeMobile(m.Mobile);
      if (!mob || !isValidMobile(m.Mobile)) return true; // no/invalid mobile, include (worker will skip)
      if (seen.has(mob)) return false;
      seen.add(mob); return true;
    });
  }, [selectedMembers, allowDups]);

  const willSkipCount = effectiveItems.filter(m => !isValidMobile(m.Mobile)).length;
  const dupSkipped    = selectedMembers.length - effectiveItems.length;
  const willSend      = effectiveItems.length - willSkipCount;

  const previewMember = selectedMembers[0] || displayed[0];
  const previewMsg    = useMemo(
    () => previewMember && msgTemplate ? interpolate(msgTemplate, memberVars(previewMember)) : '',
    [previewMember, msgTemplate]
  );

  // ── Selection helpers ─────────────────────────────────────────────────────
  const toggleOne = (accno) => setSelectedAccNos(prev => {
    const next = new Set(prev);
    next.has(accno) ? next.delete(accno) : next.add(accno);
    return next;
  });

  const selectAll      = () => setSelectedAccNos(new Set(displayed.map(m => m.AccNo)));
  const clearAll       = () => setSelectedAccNos(new Set());
  const selectWithMob  = () => setSelectedAccNos(new Set(displayed.filter(m => isValidMobile(m.Mobile)).map(m => m.AccNo)));

  const allDisplayedSelected = displayed.length > 0 && displayed.every(m => selectedAccNos.has(m.AccNo));

  const insertPlaceholder = (key) => {
    const el = textareaRef.current;
    if (!el) { setMsgTemplate(p => p + key); return; }
    const s = el.selectionStart, e = el.selectionEnd;
    setMsgTemplate(p => p.slice(0, s) + key + p.slice(e));
    setTimeout(() => { el.focus(); el.setSelectionRange(s + key.length, s + key.length); }, 0);
  };

  // ── Queue submit ──────────────────────────────────────────────────────────
  const handleQueue = async () => {
    if (!msgTemplate.trim())        { toast.error('Message template is empty'); return; }
    if (effectiveItems.length === 0) { toast.error('No recipients selected'); return; }

    const items = effectiveItems.map(m => ({
      accno:    m.AccNo    || null,
      fullName: m.FullName || null,
      mobile:   isValidMobile(m.Mobile) ? normalizeMobile(m.Mobile) : null,
      message:  interpolate(msgTemplate, memberVars(m)),
    }));

    const label = batchLabel.trim() || `Bulk Messaging — ${items.length} members`;

    setQueuing(true);
    try {
      const res = await waQueueService.create({ label, items });
      if (res.data?.success) {
        setQueued(res.data.data);
        toast.success(`${res.data.data.total} messages queued`);
      } else {
        toast.error(res.data?.message || 'Failed to queue');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to queue');
    } finally {
      setQueuing(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (queued) {
    return (
      <div className="space-y-6">
        <PageHeader title="API Bulk Messaging" subtitle="Personalized messages from member data" />
        <div className="border border-green-200 bg-green-50 rounded-2xl p-10 text-center space-y-3">
          <div className="text-5xl">✅</div>
          <div className="text-[18px] font-bold text-gray-800">{queued.total} messages queued successfully</div>
          <p className="text-[13px] text-gray-500">
            The background worker will send them. You can close this page — sending continues on the server.
          </p>
          <p className="text-[12px] text-blue-600 font-mono">{queued.batchId}</p>
          <div className="flex justify-center gap-3 pt-2">
            <button className="btn btn-secondary btn-sm" onClick={() => setQueued(null)}>New Campaign</button>
            <Link href="/messaging/wa-queue" className="btn btn-primary btn-sm">View in Queue Monitor</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="API Bulk Messaging" subtitle="Load members with filters, compose a personalized template, and queue" />

      {/* ── FILTERS ─────────────────────────────────────────────────────────── */}
      <div className="border border-border rounded-xl bg-white p-4 space-y-3">
        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Filter Members</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-3">
          <FilterSelect label="Sector"     value={fSector}   onChange={setFSector}   options={sectors}    />
          <FilterSelect label="Sub Sector" value={fSubSect}  onChange={setFSubSect}  options={subsectors} disabled={!fSector} />
          <FilterSelect label="Mohalla"    value={fMohalla}  onChange={setFMohalla}  options={mohallahs}  disabled={!fSector} />
          <FilterSelect label="Sabeel"     value={fSabeel}   onChange={setFSabeel}   options={sabeelTypes} />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Options</label>
            <label className="flex items-center gap-2 text-[12px] text-gray-700 cursor-pointer h-[34px]">
              <input type="checkbox" className="rounded" checked={fMobOnly} onChange={e => setFMobOnly(e.target.checked)} />
              Mobile only
            </label>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="btn btn-primary btn-sm"
            onClick={loadMembers}
            disabled={loading}
          >
            {loading ? (
              <><span className="w-3.5 h-3.5 mr-1.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />Loading…</>
            ) : (
              <><UsersIcon className="w-3.5 h-3.5 mr-1.5" />Load Members</>
            )}
          </button>
          {hasLoaded && (
            <span className="text-[12px] text-gray-500">
              {members.length} member{members.length !== 1 ? 's' : ''} loaded
            </span>
          )}
        </div>
      </div>

      {/* ── SPLIT LAYOUT: TABLE + COMPOSER ──────────────────────────────────── */}
      {hasLoaded && (
        <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-4">

          {/* ── RECIPIENTS TABLE ─────────────────────────────────────────────── */}
          <div className="border border-border rounded-xl bg-white flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[160px]">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  className="input input-sm pl-8 w-full"
                  placeholder="Search name / AccNo / mobile…"
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                />
              </div>
              <button className="btn btn-secondary btn-sm" onClick={selectAll}>Select All</button>
              <button className="btn btn-secondary btn-sm" onClick={selectWithMob}>With Mobile</button>
              <button className="btn btn-secondary btn-sm" onClick={clearAll}>Clear</button>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1" style={{ maxHeight: '420px' }}>
              <table className="w-full text-[11.5px]">
                <thead className="sticky top-0 bg-gray-50 border-b border-border">
                  <tr>
                    <th className="w-8 px-3 py-2 text-left">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={allDisplayedSelected}
                        onChange={allDisplayedSelected ? clearAll : selectAll}
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold">Name</th>
                    <th className="px-2 py-2 text-left text-gray-500 font-semibold">AccNo</th>
                    <th className="px-2 py-2 text-left text-gray-500 font-semibold hidden sm:table-cell">Sector/Mohalla</th>
                    <th className="px-2 py-2 text-left text-gray-500 font-semibold">Mobile</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(m => {
                    const hasMob   = !!(m.Mobile || '').trim();
                    const mobValid = isValidMobile(m.Mobile);
                    const mobNorm  = normalizeMobile(m.Mobile);
                    const isDup    = mobValid && (mobileCountMap[mobNorm] || 0) > 1;
                    const isSelected = selectedAccNos.has(m.AccNo);
                    return (
                      <tr
                        key={m.AccNo}
                        onClick={() => toggleOne(m.AccNo)}
                        className={`cursor-pointer border-b border-border/50 transition-colors
                          ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            className="rounded pointer-events-none"
                            checked={isSelected}
                            readOnly
                          />
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-800 max-w-[160px] truncate">{m.FullName}</td>
                        <td className="px-2 py-2 text-gray-500 font-mono">{m.AccNo}</td>
                        <td className="px-2 py-2 text-gray-400 hidden sm:table-cell max-w-[120px] truncate">
                          {m.Sector}{m.MohallaDescription ? ` / ${m.MohallaDescription}` : ''}
                        </td>
                        <td className="px-2 py-2">
                          {!hasMob ? (
                            <span className="text-amber-500 text-[10px]">⚠ no mobile</span>
                          ) : !mobValid ? (
                            <span className="text-red-500 text-[10px]" title={mobNorm}>✕ invalid</span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <span className="text-gray-700">{mobNorm}</span>
                              {isDup && (
                                <span title="Duplicate mobile" className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded">dup</span>
                              )}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {displayed.length === 0 && (
                <div className="py-12 text-center text-[12px] text-gray-400">
                  {tableSearch ? 'No members match your search' : 'No members loaded'}
                </div>
              )}
            </div>

            {/* Table footer stats */}
            <div className="px-4 py-2 border-t border-border flex flex-wrap gap-3">
              <StatPill label="Shown"    value={displayed.length} />
              <StatPill label="Selected"  value={selectedMembers.length} color="text-blue-600" />
              <StatPill label="Will skip" value={selectedMembers.filter(m => !isValidMobile(m.Mobile)).length} color="text-amber-600" />
              {!allowDups && dupSkipped > 0 && (
                <StatPill label="Dup mobile" value={dupSkipped} color="text-amber-600" />
              )}
            </div>
          </div>

          {/* ── MESSAGE COMPOSER ─────────────────────────────────────────────── */}
          <div className="border border-border rounded-xl bg-white flex flex-col">
            <div className="px-4 py-3 border-b border-border text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              Compose Message
            </div>
            <div className="p-4 space-y-3 flex-1 overflow-y-auto">

              {/* Template selector */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Template</label>
                <div className="flex gap-2">
                  <select
                    className="select select-sm flex-1"
                    value={tplKey}
                    onChange={e => setTplKey(e.target.value)}
                  >
                    {templates.map(t => <option key={t.template_key} value={t.template_key}>{t.name}</option>)}
                    {!templates.length && <option value="">— no templates —</option>}
                  </select>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm px-2"
                    title="Reset to template body"
                    onClick={() => { const t = templates.find(x => x.template_key === tplKey); if (t) setMsgTemplate(t.body); }}
                  >
                    <RefreshIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Placeholder chips */}
              <div>
                <div className="text-[10px] text-gray-400 mb-1">Click to insert:</div>
                <div className="flex flex-wrap gap-1">
                  {MEMBER_PLACEHOLDERS.map(p => (
                    <button
                      key={p.key}
                      type="button"
                      className="text-[10px] bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 px-1.5 py-0.5 rounded font-mono transition-colors"
                      onClick={() => insertPlaceholder(p.key)}
                    >
                      {p.key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Message</label>
                <textarea
                  ref={textareaRef}
                  className="textarea textarea-sm w-full font-mono text-[11px] resize-y"
                  rows={8}
                  value={msgTemplate}
                  onChange={e => setMsgTemplate(e.target.value)}
                  placeholder="Dear {FullName}, ..."
                />
                <div className="text-[10px] text-gray-400 text-right mt-0.5">{msgTemplate.length} chars</div>
              </div>

              {/* Live preview */}
              {previewMsg && (
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">
                    Preview — {previewMember?.FullName}
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-[11px] whitespace-pre-wrap text-gray-700 max-h-32 overflow-y-auto">
                    {previewMsg}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── QUEUE CONTROLS ───────────────────────────────────────────────────── */}
      {hasLoaded && (
        <div className="border border-border rounded-xl bg-white p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Batch Label</label>
              <input
                className="input input-sm w-full"
                value={batchLabel}
                onChange={e => setBatchLabel(e.target.value)}
                placeholder={`Bulk Messaging — ${effectiveItems.length} members`}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-[12px] text-gray-700 cursor-pointer pb-1">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={allowDups}
                  onChange={e => setAllowDups(e.target.checked)}
                />
                Allow duplicate mobile numbers
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-4">
              <StatPill label="Selected"  value={selectedMembers.length} color="text-gray-700" />
              {dupSkipped > 0 && !allowDups && (
                <StatPill label="Deduped"    value={`−${dupSkipped}`}      color="text-amber-600" />
              )}
              <StatPill label="Will skip"  value={`−${willSkipCount}`}    color="text-amber-600" />
              <StatPill label="Will send"  value={willSend}                color="text-green-700" />
              {willSend > 0 && <StatPill label="ETA" value={etaStr(willSend) || '—'} color="text-gray-500" />}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleQueue}
              disabled={queuing || effectiveItems.length === 0 || !msgTemplate.trim()}
            >
              {queuing ? (
                <><span className="w-3.5 h-3.5 mr-1.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />Queuing…</>
              ) : (
                <><SendIcon className="w-3.5 h-3.5 mr-1.5" />Queue {willSend} Messages</>
              )}
            </button>
          </div>

          <div className="text-[11px] text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            Messages are queued in the database and sent by the background worker — you can safely close this tab.
            Track progress in <Link href="/messaging/wa-queue" className="text-blue-500 hover:underline">Queue Monitor</Link>.
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasLoaded && !loading && (
        <div className="border border-dashed border-gray-300 rounded-xl py-16 text-center text-[13px] text-gray-400">
          <UsersIcon className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          Select filters above and click <strong>Load Members</strong> to see the recipient list.
        </div>
      )}
    </div>
  );
}
