'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import PageHeader from '@/components/shared/PageHeader';
import { waQueueService, waTemplateService } from '@/services';
import {
  FileTextIcon, SendIcon, RefreshIcon, SearchIcon, AlertCircleIcon, CheckIcon,
} from '@/components/shared/Icons';
import toast from 'react-hot-toast';
import { interpolate } from '@/app/(dashboard)/due-details/components/waUtils';

// ── Helpers ───────────────────────────────────────────────────────────────────
function etaStr(n) {
  if (n <= 0) return null;
  const secs = n * 18.5 + Math.floor(n / 7.5) * 35;
  if (secs < 60)   return `~${Math.round(secs)}s`;
  if (secs < 3600) return `~${Math.round(secs / 60)} min`;
  return `~${(secs / 3600).toFixed(1)} hr`;
}

function isValidMobile(val) {
  const s = String(val || '').replace(/[\s\-\+\(\)]/g, '').trim();
  return s.length >= 7 && /^\d+$/.test(s);
}

function normalizeMobile(val) {
  return String(val || '').replace(/[\s\-\(\)]/g, '').trim();
}

function excelRowVars(row) {
  const vars = {};
  for (const [k, v] of Object.entries(row)) {
    vars[k.trim()] = String(v == null ? '' : v);
  }
  return vars;
}

async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsArrayBuffer(file);
  });
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ n, title, done }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0
        ${done ? 'bg-green-500 text-white' : 'bg-navy-800 text-white'}`}>
        {done ? '✓' : n}
      </div>
      <span className="text-[13px] font-semibold text-gray-700">{title}</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function WaBulkExcelPage() {
  // ── Step 1: Upload ────────────────────────────────────────────────────────
  const [rows,       setRows]       = useState([]);     // parsed Excel rows
  const [fileName,   setFileName]   = useState('');
  const [parsing,    setParsing]    = useState(false);
  const [dragOver,   setDragOver]   = useState(false);
  const fileInputRef = useRef(null);

  // ── Step 2: Column mapping ────────────────────────────────────────────────
  const [mobileCol, setMobileCol] = useState('');  // required
  const [nameCol,   setNameCol]   = useState('');  // optional

  // ── Step 3: Compose ───────────────────────────────────────────────────────
  const [templates,      setTemplates]      = useState([]);
  const [tplKey,         setTplKey]         = useState('');
  const [msgTpl,         setMsgTpl]         = useState('');
  const [sampleVars,     setSampleVars]     = useState({});   // system vars from DB (OrgName, Venue…)
  const [fixedVarValues, setFixedVarValues] = useState({});   // user-editable fixed values per placeholder
  const textareaRef = useRef(null);

  // ── Step 4: Review & queue ────────────────────────────────────────────────
  const [tableSearch,    setTableSearch]    = useState('');
  const [selectedIdxs,   setSelectedIdxs]   = useState(new Set()); // row indices
  const [allowDups,      setAllowDups]      = useState(false);
  const [batchLabel,     setBatchLabel]     = useState('');
  const [queuing,        setQueuing]        = useState(false);
  const [queued,         setQueued]         = useState(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const columns = useMemo(() => (rows.length ? Object.keys(rows[0]) : []), [rows]);

  // After file loaded: auto-guess mobile column
  useEffect(() => {
    if (!columns.length) return;
    const guess = columns.find(c =>
      /mobile|phone|contact|number|mob/i.test(c)
    ) || '';
    setMobileCol(guess);
    const guessName = columns.find(c => /name|full.?name/i.test(c)) || '';
    setNameCol(guessName);
  }, [columns]);

  // Load templates + system vars
  useEffect(() => {
    Promise.all([
      waTemplateService.getAll(),
      waTemplateService.getMeta(),
    ]).then(([tplRes, metaRes]) => {
      const list = (tplRes.data?.data || []).filter(t => t.is_active);
      setTemplates(list);
      if (list.length) { setTplKey(list[0].template_key); setMsgTpl(list[0].body); }
      setSampleVars(metaRes.data?.data?.sampleVars || {});
    }).catch(() => {});
  }, []);

  // Auto-select all valid rows when mobileCol changes
  useEffect(() => {
    if (!mobileCol || !rows.length) return;
    const valid = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => isValidMobile(r[mobileCol]))
      .map(({ i }) => i);
    setSelectedIdxs(new Set(valid));
  }, [mobileCol, rows]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      toast.error('Only .xlsx, .xls, or .csv files are supported');
      return;
    }
    setParsing(true);
    setRows([]); setMobileCol(''); setNameCol('');
    setSelectedIdxs(new Set()); setQueued(null);
    try {
      const parsed = await parseExcelFile(file);
      if (!parsed.length) { toast.error('File is empty or has no data rows'); return; }
      setRows(parsed);
      setFileName(file.name);
      toast.success(`${parsed.length} rows loaded from ${file.name}`);
    } catch {
      toast.error('Failed to parse file');
    } finally {
      setParsing(false);
    }
  }, []);

  const onFileChange = (e) => { handleFile(e.target.files?.[0]); e.target.value = ''; };
  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  // Validation per row
  const rowMeta = useMemo(() => rows.map(r => ({
    mobile: mobileCol ? normalizeMobile(r[mobileCol]) : '',
    name:   nameCol   ? String(r[nameCol] || '').trim() : '',
    valid:  mobileCol ? isValidMobile(r[mobileCol]) : false,
  })), [rows, mobileCol, nameCol]);

  const mobileCountMap = useMemo(() => {
    const map = {};
    for (const { mobile, valid } of rowMeta) {
      if (valid && mobile) map[mobile] = (map[mobile] || 0) + 1;
    }
    return map;
  }, [rowMeta]);

  // Displayed rows (filtered by search)
  const displayedIdxs = useMemo(() => {
    if (!tableSearch) return rows.map((_, i) => i);
    const q = tableSearch.toLowerCase();
    return rows.map((r, i) => ({ r, i }))
      .filter(({ r }) => columns.some(c => String(r[c] || '').toLowerCase().includes(q)))
      .map(({ i }) => i);
  }, [rows, columns, tableSearch]);

  const selectedArr = useMemo(() => [...selectedIdxs], [selectedIdxs]);

  const effectiveIdxs = useMemo(() => {
    if (allowDups) return selectedArr;
    const seen = new Set();
    return selectedArr.filter(i => {
      const mob = rowMeta[i]?.mobile;
      if (!mob) return true;
      if (seen.has(mob)) return false;
      seen.add(mob); return true;
    });
  }, [selectedArr, rowMeta, allowDups]);

  const noMobileCount  = effectiveIdxs.filter(i => !rowMeta[i]?.valid).length;
  const dupSkipped     = selectedArr.length - effectiveIdxs.length;
  const willSend       = effectiveIdxs.length - noMobileCount;

  // Placeholders in the template that are NOT covered by Excel columns → need fixed values
  const fixedVarKeys = useMemo(() => {
    if (!msgTpl) return [];
    const hits    = [...msgTpl.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
    const covered = new Set(columns);
    return [...new Set(hits)].filter(k => !covered.has(k));
  }, [msgTpl, columns]);

  // Auto-fill fixed vars from system sampleVars when new keys are detected
  useEffect(() => {
    setFixedVarValues(prev => {
      const next = { ...prev };
      for (const k of fixedVarKeys) {
        if (!(k in next) && sampleVars[k] != null) next[k] = String(sampleVars[k]);
      }
      return next;
    });
  }, [fixedVarKeys, sampleVars]);

  // Merged base vars: system vars → user fixed → row vars (row highest priority)
  const mergedBase = useMemo(
    () => ({ ...sampleVars, ...fixedVarValues }),
    [sampleVars, fixedVarValues]
  );

  // Preview
  const previewIdx = selectedArr[0] ?? 0;
  const previewMsg = useMemo(
    () => rows[previewIdx] && msgTpl
      ? interpolate(msgTpl, { ...mergedBase, ...excelRowVars(rows[previewIdx]) })
      : '',
    [rows, previewIdx, msgTpl, mergedBase]
  );

  // Template sync
  useEffect(() => {
    const t = templates.find(x => x.template_key === tplKey);
    if (t) setMsgTpl(t.body);
  }, [tplKey]);

  const insertPlaceholder = (key) => {
    const el = textareaRef.current;
    if (!el) { setMsgTpl(p => p + key); return; }
    const s = el.selectionStart, e = el.selectionEnd;
    setMsgTpl(p => p.slice(0, s) + key + p.slice(e));
    setTimeout(() => { el.focus(); el.setSelectionRange(s + key.length, s + key.length); }, 0);
  };

  const toggleOne    = (i) => setSelectedIdxs(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const selectAllDisplayed  = () => setSelectedIdxs(prev => { const n = new Set(prev); displayedIdxs.forEach(i => n.add(i)); return n; });
  const clearAll     = () => setSelectedIdxs(new Set());
  const selectValid  = () => setSelectedIdxs(new Set(rows.map((_, i) => i).filter(i => rowMeta[i]?.valid)));

  const handleQueue = async () => {
    if (!msgTpl.trim())          { toast.error('Message template is empty'); return; }
    if (!mobileCol)              { toast.error('Please select the mobile number column'); return; }
    if (effectiveIdxs.length === 0) { toast.error('No recipients selected'); return; }

    const items = effectiveIdxs.map(i => {
      const r = rows[i];
      return {
        accno:    null,
        fullName: nameCol ? String(r[nameCol] || '').trim() || null : null,
        mobile:   rowMeta[i].mobile || null,
        message:  interpolate(msgTpl, { ...mergedBase, ...excelRowVars(r) }),
      };
    });

    const label = batchLabel.trim() || `Excel Bulk — ${items.length} rows · ${fileName}`;

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
        <PageHeader title="Excel Bulk Messaging" subtitle="Upload a spreadsheet and send personalized messages" />
        <div className="border border-green-200 bg-green-50 rounded-2xl p-10 text-center space-y-3">
          <div className="text-5xl">✅</div>
          <div className="text-[18px] font-bold text-gray-800">{queued.total} messages queued successfully</div>
          <p className="text-[13px] text-gray-500">
            The background worker will send them automatically. You can close this page.
          </p>
          <p className="text-[12px] text-blue-600 font-mono">{queued.batchId}</p>
          <div className="flex justify-center gap-3 pt-2">
            <button className="btn btn-secondary btn-sm" onClick={() => { setQueued(null); setRows([]); setFileName(''); }}>
              New Upload
            </button>
            <Link href="/messaging/wa-queue" className="btn btn-primary btn-sm">View in Queue Monitor</Link>
          </div>
        </div>
      </div>
    );
  }

  const step1Done = rows.length > 0;
  const step2Done = step1Done && !!mobileCol;
  const step3Done = step2Done && msgTpl.trim().length > 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Excel Bulk Messaging" subtitle="Upload a spreadsheet and send personalized WhatsApp messages" />

      {/* ── STEP 1: UPLOAD ──────────────────────────────────────────────────── */}
      <div className="border border-border rounded-xl bg-white p-5">
        <SectionHeader n={1} title="Upload File" done={step1Done} />

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <FileTextIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          {parsing ? (
            <p className="text-[13px] text-blue-500">Parsing file…</p>
          ) : step1Done ? (
            <div>
              <p className="text-[13px] font-semibold text-green-700">✓ {fileName}</p>
              <p className="text-[11px] text-gray-400 mt-1">{rows.length} rows · {columns.length} columns · Click to replace</p>
            </div>
          ) : (
            <div>
              <p className="text-[13px] font-semibold text-gray-600">Drag & drop or click to upload</p>
              <p className="text-[11px] text-gray-400 mt-1">Supports .xlsx · .xls · .csv</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {/* ── STEP 2: COLUMN MAPPING ──────────────────────────────────────────── */}
      {step1Done && (
        <div className="border border-border rounded-xl bg-white p-5">
          <SectionHeader n={2} title="Map Columns" done={step2Done} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                Mobile Number Column <span className="text-red-500">*</span>
              </label>
              <select
                className="select select-sm w-full"
                value={mobileCol}
                onChange={e => setMobileCol(e.target.value)}
              >
                <option value="">— Select column —</option>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                Name Column <span className="text-gray-400">(optional)</span>
              </label>
              <select
                className="select select-sm w-full"
                value={nameCol}
                onChange={e => setNameCol(e.target.value)}
              >
                <option value="">— None —</option>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Detected columns */}
          <div className="mb-4">
            <div className="text-[10px] text-gray-400 mb-1.5">Detected columns ({columns.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {columns.map(c => (
                <span
                  key={c}
                  className={`text-[11px] px-2 py-0.5 rounded-full font-mono border transition-colors
                    ${c === mobileCol ? 'bg-blue-100 border-blue-300 text-blue-700' :
                      c === nameCol   ? 'bg-purple-100 border-purple-300 text-purple-700' :
                      'bg-gray-100 border-gray-200 text-gray-600'}`}
                >
                  {c === mobileCol && '📱 '}{c === nameCol && '👤 '}{c}
                </span>
              ))}
            </div>
          </div>

          {/* Preview table */}
          <div>
            <div className="text-[10px] text-gray-400 mb-1.5">Preview (first 5 rows)</div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-[11px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-gray-400 font-semibold w-8">#</th>
                    {columns.map(c => (
                      <th key={c} className={`px-2 py-1.5 text-left font-semibold max-w-[120px] truncate
                        ${c === mobileCol ? 'text-blue-600' : c === nameCol ? 'text-purple-600' : 'text-gray-500'}`}>
                        {c}
                      </th>
                    ))}
                    {mobileCol && <th className="px-2 py-1.5 text-left text-gray-400 font-semibold">Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((r, i) => {
                    const mob = mobileCol ? normalizeMobile(r[mobileCol]) : '';
                    const ok  = mobileCol ? isValidMobile(r[mobileCol]) : null;
                    return (
                      <tr key={i} className="border-b border-gray-100 last:border-0">
                        <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>
                        {columns.map(c => (
                          <td key={c} className={`px-2 py-1.5 max-w-[120px] truncate
                            ${c === mobileCol ? 'text-blue-700 font-mono' :
                              c === nameCol   ? 'text-purple-700 font-medium' :
                              'text-gray-600'}`}>
                            {String(r[c] == null ? '' : r[c])}
                          </td>
                        ))}
                        {mobileCol && (
                          <td className="px-2 py-1.5">
                            {ok === true  && <span className="text-green-600 text-[10px]">✓ valid</span>}
                            {ok === false && <span className="text-red-500 text-[10px]">✕ invalid</span>}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats */}
          {mobileCol && (
            <div className="mt-3 flex flex-wrap gap-4 text-[12px]">
              <span className="text-gray-500">Total: <strong className="text-gray-700">{rows.length}</strong></span>
              <span className="text-gray-500">Valid mobile: <strong className="text-green-700">{rowMeta.filter(r => r.valid).length}</strong></span>
              <span className="text-gray-500">Invalid/blank: <strong className="text-red-600">{rowMeta.filter(r => !r.valid).length}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: COMPOSE ─────────────────────────────────────────────────── */}
      {step2Done && (
        <div className="border border-border rounded-xl bg-white p-5">
          <SectionHeader n={3} title="Compose Message" done={step3Done} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="space-y-3">
              {/* Template selector */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Load from template</label>
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
                    title="Reset to template"
                    onClick={() => { const t = templates.find(x => x.template_key === tplKey); if (t) setMsgTpl(t.body); }}
                  >
                    <RefreshIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Column variable chips */}
              <div>
                <div className="text-[10px] text-gray-400 mb-1">Available variables (from your columns):</div>
                <div className="flex flex-wrap gap-1">
                  {columns.map(c => (
                    <button
                      key={c}
                      type="button"
                      className="text-[10px] bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 px-1.5 py-0.5 rounded font-mono transition-colors"
                      onClick={() => insertPlaceholder(`{${c}}`)}
                    >
                      {`{${c}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fixed Variables — placeholders not covered by Excel columns */}
              {fixedVarKeys.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5">
                    Fixed Variables
                    <span className="ml-1.5 font-normal text-gray-400 normal-case">— same value for every row</span>
                  </div>
                  <div className="space-y-1.5 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    {fixedVarKeys.map(k => {
                      const isAuto = sampleVars[k] != null && fixedVarValues[k] === String(sampleVars[k]);
                      return (
                        <div key={k} className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded shrink-0 min-w-[100px] text-center">
                            {`{${k}}`}
                          </span>
                          <input
                            className="form-input text-[11px] flex-1 py-1"
                            value={fixedVarValues[k] ?? ''}
                            onChange={e => setFixedVarValues(prev => ({ ...prev, [k]: e.target.value }))}
                            placeholder={`Value for {${k}}…`}
                          />
                          {isAuto && (
                            <span className="text-[9px] bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded shrink-0">
                              auto
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Textarea */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Message Template</label>
                <textarea
                  ref={textareaRef}
                  className="textarea textarea-sm w-full font-mono text-[11px] resize-y"
                  rows={9}
                  value={msgTpl}
                  onChange={e => setMsgTpl(e.target.value)}
                  placeholder={columns.length ? `Dear {${nameCol || columns[0]}},\n\nYour message here...` : 'Write your message...'}
                />
                <div className="text-[10px] text-gray-400 text-right mt-0.5">{msgTpl.length} chars</div>
              </div>
            </div>

            {/* Live preview */}
            <div className="space-y-2">
              <div className="text-[10px] font-semibold text-gray-500 uppercase">
                Preview — row 1 {rows[previewIdx]?.[nameCol] ? `(${rows[previewIdx][nameCol]})` : ''}
              </div>
              {previewMsg ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-[11.5px] whitespace-pre-wrap text-gray-700 leading-relaxed min-h-[180px]">
                  {previewMsg}
                </div>
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-3 text-[11px] text-gray-400 min-h-[180px] flex items-center justify-center">
                  Preview will appear as you type above
                </div>
              )}

              {/* First 3 rows preview */}
              {previewMsg && rows.length > 1 && (
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-400">Other rows preview:</div>
                  {rows.slice(1, 3).map((r, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[10px] text-gray-500 font-mono whitespace-pre-wrap max-h-16 overflow-hidden relative">
                      {interpolate(msgTpl, { ...mergedBase, ...excelRowVars(r) })}
                      <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-gray-50" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: REVIEW & QUEUE ──────────────────────────────────────────── */}
      {step3Done && (
        <div className="border border-border rounded-xl bg-white p-5 space-y-4">
          <SectionHeader n={4} title="Review & Queue" done={false} />

          {/* Table controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                className="input input-sm pl-8 w-full"
                placeholder="Search…"
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={selectAllDisplayed}>Select All</button>
            <button className="btn btn-secondary btn-sm" onClick={selectValid}>Valid Mobile Only</button>
            <button className="btn btn-secondary btn-sm" onClick={clearAll}>Clear</button>
          </div>

          {/* Recipients table */}
          <div className="overflow-auto rounded-lg border border-gray-200" style={{ maxHeight: '360px' }}>
            <table className="w-full text-[11.5px]">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-8 px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={displayedIdxs.length > 0 && displayedIdxs.every(i => selectedIdxs.has(i))}
                      onChange={e => e.target.checked ? selectAllDisplayed() : clearAll()}
                    />
                  </th>
                  <th className="px-2 py-2 text-left text-gray-500 font-semibold">#</th>
                  {nameCol   && <th className="px-2 py-2 text-left text-gray-500 font-semibold">Name</th>}
                  {mobileCol && <th className="px-2 py-2 text-left text-gray-500 font-semibold">Mobile</th>}
                  {columns.filter(c => c !== mobileCol && c !== nameCol).slice(0, 3).map(c => (
                    <th key={c} className="px-2 py-2 text-left text-gray-500 font-semibold hidden sm:table-cell max-w-[100px] truncate">{c}</th>
                  ))}
                  <th className="px-2 py-2 text-left text-gray-500 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedIdxs.map(i => {
                  const r    = rows[i];
                  const meta = rowMeta[i];
                  const isDup = meta.valid && (mobileCountMap[meta.mobile] || 0) > 1;
                  const isSel = selectedIdxs.has(i);
                  return (
                    <tr
                      key={i}
                      onClick={() => toggleOne(i)}
                      className={`cursor-pointer border-b border-border/50 transition-colors
                        ${isSel ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-3 py-2">
                        <input type="checkbox" className="rounded pointer-events-none" checked={isSel} readOnly />
                      </td>
                      <td className="px-2 py-2 text-gray-400">{i + 1}</td>
                      {nameCol   && <td className="px-2 py-2 font-medium text-gray-800 max-w-[140px] truncate">{String(r[nameCol] || '')}</td>}
                      {mobileCol && (
                        <td className="px-2 py-2 font-mono text-gray-700">
                          {meta.mobile || <span className="text-amber-500 text-[10px]">⚠ blank</span>}
                        </td>
                      )}
                      {columns.filter(c => c !== mobileCol && c !== nameCol).slice(0, 3).map(c => (
                        <td key={c} className="px-2 py-2 text-gray-500 max-w-[100px] truncate hidden sm:table-cell">
                          {String(r[c] == null ? '' : r[c])}
                        </td>
                      ))}
                      <td className="px-2 py-2">
                        {!meta.valid ? (
                          <span className="text-[10px] text-amber-600">skip</span>
                        ) : isDup ? (
                          <span className="text-[10px] text-amber-600">dup</span>
                        ) : (
                          <span className="text-[10px] text-green-600">✓</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Options + action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Batch Label</label>
              <input
                className="input input-sm w-full"
                value={batchLabel}
                onChange={e => setBatchLabel(e.target.value)}
                placeholder={`Excel Bulk — ${willSend} rows · ${fileName}`}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-[12px] text-gray-700 cursor-pointer pb-1">
                <input type="checkbox" className="rounded" checked={allowDups} onChange={e => setAllowDups(e.target.checked)} />
                Allow duplicate mobile numbers
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-4 text-[12px]">
              <span className="text-gray-500">Selected: <strong className="text-gray-700">{selectedArr.length}</strong></span>
              {dupSkipped > 0 && !allowDups && (
                <span className="text-gray-500">Deduped: <strong className="text-amber-600">−{dupSkipped}</strong></span>
              )}
              <span className="text-gray-500">No mobile: <strong className="text-amber-600">−{noMobileCount}</strong></span>
              <span className="text-gray-500">Will send: <strong className="text-green-700">{willSend}</strong></span>
              {willSend > 0 && <span className="text-gray-500">ETA: <strong>{etaStr(willSend) || '—'}</strong></span>}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleQueue}
              disabled={queuing || effectiveIdxs.length === 0 || !msgTpl.trim() || !mobileCol}
            >
              {queuing ? (
                <><span className="w-3.5 h-3.5 mr-1.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />Queuing…</>
              ) : (
                <><SendIcon className="w-3.5 h-3.5 mr-1.5" />Queue {willSend} Messages</>
              )}
            </button>
          </div>

          <div className="text-[11px] text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            Messages are queued and sent by the background worker — you can safely close this tab.
            Track progress in <Link href="/messaging/wa-queue" className="text-blue-500 hover:underline">Queue Monitor</Link>.
          </div>
        </div>
      )}
    </div>
  );
}
