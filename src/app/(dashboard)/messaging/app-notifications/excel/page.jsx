'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import PageHeader from '@/components/shared/PageHeader';
import { notificationService, waTemplateService } from '@/services';
import { FileTextIcon, SendIcon, RefreshIcon } from '@/components/shared/Icons';
import toast from 'react-hot-toast';
import { interpolate } from '@/app/(dashboard)/due-details/components/waUtils';

// ── Helpers ───────────────────────────────────────────────────────────────────
function isValidAccno(val) {
  return String(val || '').trim().length > 0;
}

function normalizeAccno(val) {
  return String(val || '').trim();
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

const TYPE_OPTIONS = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'due_reminder', label: 'Due Reminder' },
  { value: 'general',      label: 'General' },
];

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
export default function NotifBulkExcelPage() {
  // ── Step 1: Upload ────────────────────────────────────────────────────────
  const [rows,       setRows]       = useState([]);
  const [fileName,   setFileName]   = useState('');
  const [parsing,    setParsing]    = useState(false);
  const [dragOver,   setDragOver]   = useState(false);
  const fileInputRef = useRef(null);

  // ── Step 2: Column mapping ────────────────────────────────────────────────
  const [accnoCol, setAccnoCol] = useState('');
  const [nameCol,  setNameCol]  = useState('');

  // ── Step 3: Compose ───────────────────────────────────────────────────────
  const [notifType,  setNotifType]  = useState('announcement');
  const [titleTpl,   setTitleTpl]   = useState('');
  const [bodyTpl,    setBodyTpl]    = useState('');
  const [templates,  setTemplates]  = useState([]);
  const [tplKey,     setTplKey]     = useState('');
  const [sampleVars, setSampleVars] = useState({});
  const titleRef = useRef(null);
  const bodyRef  = useRef(null);

  // ── Step 4: Review & Send ─────────────────────────────────────────────────
  const [tableSearch,  setTableSearch]  = useState('');
  const [selectedIdxs, setSelectedIdxs] = useState(new Set());
  const [allowDups,    setAllowDups]    = useState(false);
  const [sending,      setSending]      = useState(false);
  const [result,       setResult]       = useState(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const columns = useMemo(() => (rows.length ? Object.keys(rows[0]) : []), [rows]);

  // Auto-guess columns after file loaded
  useEffect(() => {
    if (!columns.length) return;
    const guessAccno = columns.find(c => /accno|account|acc.?no|member/i.test(c)) || '';
    setAccnoCol(guessAccno);
    const guessName = columns.find(c => /name|full.?name/i.test(c)) || '';
    setNameCol(guessName);
  }, [columns]);

  // Auto-select all valid rows when accnoCol changes
  useEffect(() => {
    if (!accnoCol || !rows.length) return;
    const valid = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => isValidAccno(r[accnoCol]))
      .map(({ i }) => i);
    setSelectedIdxs(new Set(valid));
  }, [accnoCol, rows]);

  // Load WA templates + system sample vars on mount
  useEffect(() => {
    Promise.all([
      waTemplateService.getAll(),
      waTemplateService.getMeta(),
    ]).then(([tplRes, metaRes]) => {
      const list = (tplRes.data?.data || []).filter(t => t.is_active);
      setTemplates(list);
      setSampleVars(metaRes.data?.data?.sampleVars || {});
    }).catch(() => {});
  }, []);

  // Sync body when template key changes
  useEffect(() => {
    const t = templates.find(x => x.template_key === tplKey);
    if (t) setBodyTpl(t.body);
  }, [tplKey]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      toast.error('Only .xlsx, .xls, or .csv files are supported');
      return;
    }
    setParsing(true);
    setRows([]); setAccnoCol(''); setNameCol('');
    setSelectedIdxs(new Set()); setResult(null);
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
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); };

  // Row metadata
  const rowMeta = useMemo(() => rows.map(r => ({
    accno: accnoCol ? normalizeAccno(r[accnoCol]) : '',
    name:  nameCol  ? String(r[nameCol] || '').trim() : '',
    valid: accnoCol ? isValidAccno(r[accnoCol]) : false,
  })), [rows, accnoCol, nameCol]);

  const accnoCountMap = useMemo(() => {
    const map = {};
    for (const { accno, valid } of rowMeta) {
      if (valid && accno) map[accno] = (map[accno] || 0) + 1;
    }
    return map;
  }, [rowMeta]);

  // Filtered rows (search)
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
      const acc = rowMeta[i]?.accno;
      if (!acc) return true;
      if (seen.has(acc)) return false;
      seen.add(acc); return true;
    });
  }, [selectedArr, rowMeta, allowDups]);

  const noAccnoCount = effectiveIdxs.filter(i => !rowMeta[i]?.valid).length;
  const dupSkipped   = selectedArr.length - effectiveIdxs.length;
  const willSend     = effectiveIdxs.length - noAccnoCount;

  // Placeholder detection for fixed-var inputs
  const allTpl = `${titleTpl} ${bodyTpl}`;
  const fixedVarKeys = useMemo(() => {
    const hits    = [...allTpl.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
    const covered = new Set(columns);
    return [...new Set(hits)].filter(k => !covered.has(k));
  }, [allTpl, columns]);

  const [fixedVarValues, setFixedVarValues] = useState({});
  useEffect(() => {
    setFixedVarValues(prev => {
      const next = { ...prev };
      for (const k of fixedVarKeys) {
        if (!(k in next)) next[k] = sampleVars[k] != null ? String(sampleVars[k]) : '';
      }
      return next;
    });
  }, [fixedVarKeys, sampleVars]);

  // Preview (first selected row)
  const previewIdx = selectedArr[0] ?? 0;
  const mergedBase = useMemo(() => ({ ...sampleVars, ...fixedVarValues }), [sampleVars, fixedVarValues]);
  const previewTitle = useMemo(
    () => rows[previewIdx] && titleTpl ? interpolate(titleTpl, { ...mergedBase, ...excelRowVars(rows[previewIdx]) }) : '',
    [rows, previewIdx, titleTpl, mergedBase]
  );
  const previewBody = useMemo(
    () => rows[previewIdx] && bodyTpl ? interpolate(bodyTpl, { ...mergedBase, ...excelRowVars(rows[previewIdx]) }) : '',
    [rows, previewIdx, bodyTpl, mergedBase]
  );

  const insertPlaceholder = (key, ref, setter) => {
    const el = ref.current;
    if (!el) { setter(p => p + key); return; }
    const s = el.selectionStart, e = el.selectionEnd;
    setter(p => p.slice(0, s) + key + p.slice(e));
    setTimeout(() => { el.focus(); el.setSelectionRange(s + key.length, s + key.length); }, 0);
  };

  const toggleOne   = (i) => setSelectedIdxs(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const selectAllDisplayed = () => setSelectedIdxs(prev => { const n = new Set(prev); displayedIdxs.forEach(i => n.add(i)); return n; });
  const clearAll    = () => setSelectedIdxs(new Set());
  const selectValid = () => setSelectedIdxs(new Set(rows.map((_, i) => i).filter(i => rowMeta[i]?.valid)));

  const handleSend = async () => {
    if (!titleTpl.trim())          { toast.error('Title template is empty'); return; }
    if (!bodyTpl.trim())           { toast.error('Body template is empty'); return; }
    if (!accnoCol)                 { toast.error('Please select the AccNo column'); return; }
    if (effectiveIdxs.length === 0){ toast.error('No recipients selected'); return; }

    const items = effectiveIdxs
      .filter(i => rowMeta[i]?.valid)
      .map(i => {
        const r = rows[i];
        const vars = { ...mergedBase, ...excelRowVars(r) };
        return {
          accno: rowMeta[i].accno,
          title: interpolate(titleTpl, vars),
          body:  interpolate(bodyTpl,  vars),
        };
      });

    setSending(true);
    try {
      const res = await notificationService.sendBatch({ type: notifType, items });
      if (res.data?.success) {
        setResult(res.data);
        toast.success(res.data.message || `Sent to ${items.length} members`);
      } else {
        toast.error(res.data?.message || 'Failed to send');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send notifications');
    } finally {
      setSending(false);
    }
  };

  // ── Render: Success screen ────────────────────────────────────────────────
  if (result) {
    return (
      <div className="space-y-6">
        <PageHeader title="Bulk Notifications — Excel" subtitle="Send personalized push notifications from a spreadsheet" />
        <div className="border border-green-200 bg-green-50 rounded-2xl p-10 text-center space-y-3">
          <div className="text-5xl">✅</div>
          <div className="text-[18px] font-bold text-gray-800">Notifications sent!</div>
          <div className="flex justify-center gap-6 text-[13px]">
            <span className="text-gray-600">Recipients: <strong>{result.recipientCount}</strong></span>
            {result.fcm && <>
              <span className="text-green-700">Delivered: <strong>{result.fcm.successCount}</strong></span>
              {result.fcm.failureCount > 0 && (
                <span className="text-red-600">Failed: <strong>{result.fcm.failureCount}</strong></span>
              )}
            </>}
          </div>
          <p className="text-[12px] text-gray-500">{result.message}</p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setResult(null); setRows([]); setFileName(''); setSelectedIdxs(new Set()); }}
            >
              New Upload
            </button>
            <Link href="/messaging/app-notifications" className="btn btn-primary btn-sm">
              Back to Notifications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const step1Done = rows.length > 0;
  const step2Done = step1Done && !!accnoCol;
  const step3Done = step2Done && titleTpl.trim().length > 0 && bodyTpl.trim().length > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bulk Notifications — Excel"
        subtitle="Upload a spreadsheet and send personalized push notifications to members"
      />

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
                AccNo Column <span className="text-red-500">*</span>
              </label>
              <select
                className="select select-sm w-full"
                value={accnoCol}
                onChange={e => setAccnoCol(e.target.value)}
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

          {/* Column chips */}
          <div className="mb-4">
            <div className="text-[10px] text-gray-400 mb-1.5">Detected columns ({columns.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {columns.map(c => (
                <span
                  key={c}
                  className={`text-[11px] px-2 py-0.5 rounded-full font-mono border transition-colors
                    ${c === accnoCol ? 'bg-blue-100 border-blue-300 text-blue-700' :
                      c === nameCol  ? 'bg-purple-100 border-purple-300 text-purple-700' :
                      'bg-gray-100 border-gray-200 text-gray-600'}`}
                >
                  {c === accnoCol && '🔑 '}{c === nameCol && '👤 '}{c}
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
                        ${c === accnoCol ? 'text-blue-600' : c === nameCol ? 'text-purple-600' : 'text-gray-500'}`}>
                        {c}
                      </th>
                    ))}
                    {accnoCol && <th className="px-2 py-1.5 text-left text-gray-400 font-semibold">Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((r, i) => {
                    const ok = accnoCol ? isValidAccno(r[accnoCol]) : null;
                    return (
                      <tr key={i} className="border-b border-gray-100 last:border-0">
                        <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>
                        {columns.map(c => (
                          <td key={c} className={`px-2 py-1.5 max-w-[120px] truncate
                            ${c === accnoCol ? 'text-blue-700 font-mono' :
                              c === nameCol  ? 'text-purple-700 font-medium' :
                              'text-gray-600'}`}>
                            {String(r[c] == null ? '' : r[c])}
                          </td>
                        ))}
                        {accnoCol && (
                          <td className="px-2 py-1.5">
                            {ok === true  && <span className="text-green-600 text-[10px]">✓ valid</span>}
                            {ok === false && <span className="text-red-500 text-[10px]">✕ blank</span>}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {accnoCol && (
            <div className="mt-3 flex flex-wrap gap-4 text-[12px]">
              <span className="text-gray-500">Total: <strong className="text-gray-700">{rows.length}</strong></span>
              <span className="text-gray-500">Valid AccNo: <strong className="text-green-700">{rowMeta.filter(r => r.valid).length}</strong></span>
              <span className="text-gray-500">Blank/invalid: <strong className="text-red-600">{rowMeta.filter(r => !r.valid).length}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: COMPOSE ─────────────────────────────────────────────────── */}
      {step2Done && (
        <div className="border border-border rounded-xl bg-white p-5">
          <SectionHeader n={3} title="Compose Notification" done={step3Done} />

          {/* Notification type */}
          <div className="mb-4">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Type</label>
            <div className="flex gap-2 flex-wrap">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNotifType(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                    notifType === opt.value
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="space-y-3">
              {/* WA Template selector */}
              {templates.length > 0 && (
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Load from WA Template</label>
                  <div className="flex gap-2">
                    <select
                      className="select select-sm flex-1"
                      value={tplKey}
                      onChange={e => setTplKey(e.target.value)}
                    >
                      <option value="">— select a template —</option>
                      {templates.map(t => <option key={t.template_key} value={t.template_key}>{t.name}</option>)}
                    </select>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm px-2"
                      title="Reload template body"
                      onClick={() => { const t = templates.find(x => x.template_key === tplKey); if (t) setBodyTpl(t.body); }}
                    >
                      <RefreshIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Loads the template body below — you can still edit it freely.</p>
                </div>
              )}

              {/* Variable chips */}
              <div>
                <div className="text-[10px] text-gray-400 mb-1">Available variables (click to insert):</div>
                <div className="flex flex-wrap gap-1">
                  {columns.map(c => (
                    <button
                      key={c}
                      type="button"
                      title={`Insert {${c}}`}
                      className="text-[10px] bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 px-1.5 py-0.5 rounded font-mono transition-colors"
                      onClick={() => {
                        const active = document.activeElement;
                        if (active === bodyRef.current) {
                          insertPlaceholder(`{${c}}`, bodyRef, setBodyTpl);
                        } else {
                          insertPlaceholder(`{${c}}`, titleRef, setTitleTpl);
                        }
                      }}
                    >
                      {`{${c}}`}
                    </button>
                  ))}
                </div>
                <div className="text-[9px] text-gray-400 mt-0.5">Click a field first, then click a variable chip to insert it at cursor.</div>
              </div>

              {/* Fixed vars */}
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

              {/* Title */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                  Title Template <span className="text-red-500">*</span>
                </label>
                <input
                  ref={titleRef}
                  type="text"
                  maxLength={100}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  value={titleTpl}
                  onChange={e => setTitleTpl(e.target.value)}
                  placeholder={`e.g. Dear {${nameCol || columns[0] || 'Name'}}, your notice is ready`}
                />
                <div className="text-[10px] text-gray-400 text-right mt-0.5">{titleTpl.length} / 100</div>
              </div>

              {/* Body */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                  Body Template <span className="text-red-500">*</span>
                </label>
                <textarea
                  ref={bodyRef}
                  className="textarea textarea-sm w-full font-mono text-[11px] resize-y"
                  rows={6}
                  value={bodyTpl}
                  onChange={e => setBodyTpl(e.target.value)}
                  placeholder="Write the notification body. Use {ColumnName} for personalisation."
                />
                <div className="text-[10px] text-gray-400 text-right mt-0.5">{bodyTpl.length} chars</div>
              </div>
            </div>

            {/* Live preview */}
            <div className="space-y-2">
              <div className="text-[10px] font-semibold text-gray-500 uppercase">
                Preview — row 1 {rows[previewIdx]?.[nameCol] ? `(${rows[previewIdx][nameCol]})` : ''}
              </div>
              {(previewTitle || previewBody) ? (
                <div className="bg-gray-900 rounded-2xl p-3 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center">
                      <span className="text-[10px] font-bold">J</span>
                    </div>
                    <span className="text-[11px] text-gray-400">JMS Portal · now</span>
                  </div>
                  <div className="text-[13px] font-semibold whitespace-pre-wrap">{previewTitle || 'Notification Title'}</div>
                  <div className="text-[12px] text-gray-300 mt-0.5 whitespace-pre-line">
                    {previewBody || 'Message preview...'}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-3 text-[11px] text-gray-400 min-h-[160px] flex items-center justify-center">
                  Preview will appear as you fill in the templates above
                </div>
              )}

              {/* Other rows preview */}
              {previewTitle && rows.length > 1 && (
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-400">Other rows preview:</div>
                  {rows.slice(1, 3).map((r, i) => {
                    const vars = { ...mergedBase, ...excelRowVars(r) };
                    return (
                      <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[10px] text-gray-500 space-y-0.5">
                        <div className="font-semibold text-gray-700 truncate">{interpolate(titleTpl, vars)}</div>
                        <div className="font-mono whitespace-pre-wrap max-h-10 overflow-hidden relative">
                          {interpolate(bodyTpl, vars)}
                          <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-gray-50" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: REVIEW & SEND ───────────────────────────────────────────── */}
      {step3Done && (
        <div className="border border-border rounded-xl bg-white p-5 space-y-4">
          <SectionHeader n={4} title="Review & Send" done={false} />

          {/* Table controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="input input-sm pl-8 w-full"
                placeholder="Search…"
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={selectAllDisplayed}>Select All</button>
            <button className="btn btn-secondary btn-sm" onClick={selectValid}>Valid AccNo Only</button>
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
                  {accnoCol && <th className="px-2 py-2 text-left text-gray-500 font-semibold">AccNo</th>}
                  {nameCol  && <th className="px-2 py-2 text-left text-gray-500 font-semibold">Name</th>}
                  {columns.filter(c => c !== accnoCol && c !== nameCol).slice(0, 3).map(c => (
                    <th key={c} className="px-2 py-2 text-left text-gray-500 font-semibold hidden sm:table-cell max-w-[100px] truncate">{c}</th>
                  ))}
                  <th className="px-2 py-2 text-left text-gray-500 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedIdxs.map(i => {
                  const r    = rows[i];
                  const meta = rowMeta[i];
                  const isDup  = meta.valid && (accnoCountMap[meta.accno] || 0) > 1;
                  const isSel  = selectedIdxs.has(i);
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
                      {accnoCol && (
                        <td className="px-2 py-2 font-mono text-gray-700">
                          {meta.accno || <span className="text-amber-500 text-[10px]">⚠ blank</span>}
                        </td>
                      )}
                      {nameCol && <td className="px-2 py-2 font-medium text-gray-800 max-w-[140px] truncate">{String(r[nameCol] || '')}</td>}
                      {columns.filter(c => c !== accnoCol && c !== nameCol).slice(0, 3).map(c => (
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

          {/* Options + stats + send */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[12px] text-gray-700 cursor-pointer">
              <input type="checkbox" className="rounded" checked={allowDups} onChange={e => setAllowDups(e.target.checked)} />
              Allow duplicate AccNo
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-4 text-[12px]">
              <span className="text-gray-500">Selected: <strong className="text-gray-700">{selectedArr.length}</strong></span>
              {dupSkipped > 0 && !allowDups && (
                <span className="text-gray-500">Deduped: <strong className="text-amber-600">−{dupSkipped}</strong></span>
              )}
              <span className="text-gray-500">No AccNo: <strong className="text-amber-600">−{noAccnoCount}</strong></span>
              <span className="text-gray-500">Will send: <strong className="text-green-700">{willSend}</strong></span>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={sending || effectiveIdxs.length === 0 || !titleTpl.trim() || !bodyTpl.trim() || !accnoCol}
            >
              {sending ? (
                <><span className="w-3.5 h-3.5 mr-1.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />Sending…</>
              ) : (
                <><SendIcon className="w-3.5 h-3.5 mr-1.5" />Send {willSend} Notifications</>
              )}
            </button>
          </div>

          <div className="text-[11px] text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            Notifications are sent immediately via FCM to members with the JMS app installed.
            Members without the app or without notifications enabled will not receive them.
          </div>
        </div>
      )}
    </div>
  );
}
