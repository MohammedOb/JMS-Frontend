'use client';
import { useState, useEffect, useCallback } from 'react';
import { regFormService } from '@/services';
import toast from 'react-hot-toast';
import Modal from '@/components/shared/Modal';

// ── Helpers ────────────────────────────────────────────────────────────────────

// Format: "27-May-2026 10:30 AM"
const fmtDisplay = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v).slice(0, 10);
  const day  = String(d.getDate()).padStart(2, '0');
  const mon  = d.toLocaleString('en-GB', { month: 'short' });
  const yr   = d.getFullYear();
  const hrs  = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  const ap   = hrs >= 12 ? 'PM' : 'AM';
  const h12  = hrs % 12 || 12;
  return `${day}-${mon}-${yr} ${h12}:${mins} ${ap}`;
};

// Classify a question text into a system-field bucket (or null for custom questions)
const FIELD_PATTERNS = {
  itsno:  /\b(?:itsno|its\s?no|its\s?number|its\s?id)\b/i,
  accno:  /\b(?:acc\s?no|accno|account\s?no|sabeel)\b/i,
  name:   /\b(?:full\s?name)\b/i,
  mobile: /\b(?:mobile|phone|whatsapp|contact)\b/i,
  sector: /\b(?:sector|masjid\s?area|masjid)\b/i,
};
const classifyField = (text) => {
  for (const [type, re] of Object.entries(FIELD_PATTERNS)) {
    if (re.test(text)) return type;
  }
  return null;
};

const CHOICE_TYPES  = ['yesno', 'radio', 'select', 'checkbox'];
const GRID_TYPES    = ['mcgrid', 'tickboxgrid'];
const SCALE_TYPES   = ['linearscale', 'rating'];

// Safely read Options as a plain object
const asObj = (opts, fallback) => {
  if (!opts) return fallback;
  if (typeof opts === 'object' && !Array.isArray(opts)) return opts;
  if (typeof opts === 'string') { try { const p = JSON.parse(opts); if (!Array.isArray(p)) return p; } catch {} }
  return fallback;
};

// Safely parse a JSON answer string
const parseAnswer = (v, fallback) => {
  if (!v) return fallback;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return fallback; }
};

// Age groups for the "age" field
const AGE_GROUPS = [
  { label: '0–12 (Child)',        min: 0,   max: 12  },
  { label: '13–17 (Teen)',        min: 13,  max: 17  },
  { label: '18–30 (Young Adult)', min: 18,  max: 30  },
  { label: '31–50 (Adult)',       min: 31,  max: 50  },
  { label: '51–65 (Senior)',      min: 51,  max: 65  },
  { label: '66+ (Elder)',         min: 66,  max: 999 },
];

// Build ~5 dynamic numeric buckets
const buildNumRanges = (values) => {
  if (!values.length) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const mn = sorted[0], mx = sorted[sorted.length - 1];
  if (mn === mx) return [{ label: String(mn), min: mn, max: mx }];
  const step = Math.ceil((mx - mn + 1) / 5);
  const out = [];
  for (let lo = mn; lo <= mx; lo += step) {
    const hi = Math.min(lo + step - 1, mx);
    out.push({ label: hi === lo ? String(lo) : `${lo}–${hi}`, min: lo, max: hi });
  }
  return out;
};

/**
 * Render the answer cell value for a question.
 * Returns a React node (or plain string for text cells).
 */
const renderAnswerCell = (q, val) => {
  if (!val) return '—';

  // File upload → download link
  if (q.QuestionType === 'fileupload') {
    const f = parseAnswer(val, null);
    if (!f?.name) return '—';
    if (f.data) {
      return (
        <a href={f.data} download={f.name}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-[11px] whitespace-nowrap"
          title={`${f.name} (${(f.size / 1024).toFixed(0)} KB)`}
        >
          📎 {f.name}
        </a>
      );
    }
    return <span className="text-[11px] text-gray-600">📎 {f.name}</span>;
  }

  // Grid types → multi-line breakdown
  if (GRID_TYPES.includes(q.QuestionType)) {
    const obj = parseAnswer(val, {});
    const entries = Object.entries(obj).filter(([, v]) =>
      Array.isArray(v) ? v.length > 0 : !!v,
    );
    if (!entries.length) return '—';
    return (
      <div className="space-y-0.5">
        {entries.map(([row, sel]) => (
          <div key={row} className="text-[11px] text-gray-600 leading-snug">
            <span className="font-medium text-gray-700">{row}:</span>{' '}
            {Array.isArray(sel) ? sel.join(', ') : sel}
          </div>
        ))}
      </div>
    );
  }

  // Rating → star icons
  if (q.QuestionType === 'rating') {
    const n = parseInt(val);
    if (!isNaN(n) && n > 0) {
      return (
        <span className="whitespace-nowrap">
          <span className="text-yellow-400">{'★'.repeat(n)}</span>
          <span className="text-gray-400 text-[10px] ml-1">({n})</span>
        </span>
      );
    }
  }

  return val;
};

/**
 * Plain-text version of an answer for Excel export.
 */
const answerToText = (q, val) => {
  if (!val) return '';
  if (q.QuestionType === 'fileupload') {
    const f = parseAnswer(val, null);
    return f?.name || '';
  }
  if (GRID_TYPES.includes(q.QuestionType)) {
    const obj = parseAnswer(val, {});
    return Object.entries(obj)
      .filter(([, v]) => Array.isArray(v) ? v.length > 0 : !!v)
      .map(([r, v]) => `${r}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join(' | ');
  }
  return val;
};

// ── Summary sub-components ────────────────────────────────────────────────────

function BarRow({ label, count, pct, maxCount }) {
  return (
    <div>
      <div className="flex justify-between items-center text-[11px] mb-0.5">
        <span className="font-medium text-gray-700 truncate max-w-[68%]">{label}</span>
        <span className="shrink-0 ml-2 text-gray-500 tabular-nums">
          {count} <span className="text-gray-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-2 bg-blue-500 rounded-full transition-all"
          style={{ width: `${(count / maxCount) * 100}%` }}
        />
      </div>
    </div>
  );
}

function SummaryCard({ question, answered, total, badge, children }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 flex flex-col gap-3">
      <div>
        <div className="flex items-start gap-2">
          <p className="font-semibold text-gray-800 text-sm leading-snug flex-1">{question.QuestionText}</p>
          {badge && (
            <span className="shrink-0 text-[10px] bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 font-semibold whitespace-nowrap mt-0.5">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {answered} of {total} responded
          {answered === 0 && <span className="ml-1 italic">(no data)</span>}
        </p>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function QuestionSummaryCard({ question, responses }) {
  const allAnswers = responses
    .map(r => r.answers[question.QuestionID])
    .filter(a => a != null && String(a).trim() !== '');

  const answered = allAnswers.length;
  const total    = responses.length;

  // ── Linear Scale ──────────────────────────────────────────────────────────
  if (question.QuestionType === 'linearscale') {
    const cfg   = asObj(question.Options, { min: 1, max: 5 });
    const min   = cfg.min ?? 1;
    const max   = cfg.max ?? 5;
    const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);
    const counts = {};
    steps.forEach(n => { counts[n] = 0; });
    allAnswers.forEach(a => {
      const n = parseInt(a);
      if (!isNaN(n) && counts[n] !== undefined) counts[n]++;
    });
    const maxCount = Math.max(...Object.values(counts), 1);
    const numVals  = allAnswers.map(a => parseInt(a)).filter(n => !isNaN(n));
    const avg = numVals.length
      ? (numVals.reduce((s, v) => s + v, 0) / numVals.length).toFixed(1)
      : null;
    const badge = avg
      ? `avg ${avg}${cfg.minLabel || cfg.maxLabel ? ` · ${cfg.minLabel || min}–${cfg.maxLabel || max}` : ''}`
      : null;
    return (
      <SummaryCard question={question} answered={answered} total={total} badge={badge}>
        {steps.map(n => (
          <BarRow key={n}
            label={`${n}${n === min && cfg.minLabel ? ` — ${cfg.minLabel}` : ''}${n === max && cfg.maxLabel ? ` — ${cfg.maxLabel}` : ''}`}
            count={counts[n]}
            pct={answered ? Math.round(counts[n] / answered * 100) : 0}
            maxCount={maxCount}
          />
        ))}
      </SummaryCard>
    );
  }

  // ── Rating (Stars) ────────────────────────────────────────────────────────
  if (question.QuestionType === 'rating') {
    const cfg   = asObj(question.Options, { max: 5 });
    const max   = cfg.max ?? 5;
    const steps = Array.from({ length: max }, (_, i) => i + 1);
    const counts = {};
    steps.forEach(n => { counts[n] = 0; });
    allAnswers.forEach(a => {
      const n = parseInt(a);
      if (!isNaN(n) && counts[n] !== undefined) counts[n]++;
    });
    const maxCount = Math.max(...Object.values(counts), 1);
    const numVals  = allAnswers.map(a => parseInt(a)).filter(n => !isNaN(n));
    const avg = numVals.length
      ? (numVals.reduce((s, v) => s + v, 0) / numVals.length).toFixed(1)
      : null;
    return (
      <SummaryCard question={question} answered={answered} total={total}
        badge={avg ? `avg ${avg} ★` : null}
      >
        {/* Render highest stars first */}
        {[...steps].reverse().map(n => (
          <BarRow key={n}
            label={`${'★'.repeat(n)} (${n})`}
            count={counts[n]}
            pct={answered ? Math.round(counts[n] / answered * 100) : 0}
            maxCount={maxCount}
          />
        ))}
      </SummaryCard>
    );
  }

  // ── Multiple-Choice Grid ──────────────────────────────────────────────────
  if (question.QuestionType === 'mcgrid') {
    const cfg  = asObj(question.Options, { rows: [], columns: [] });
    const rows = cfg.rows    ?? [];
    const cols = cfg.columns ?? [];

    const rowData = rows.map(row => {
      const colCounts = {};
      cols.forEach(c => { colCounts[c] = 0; });
      let rowAnswered = 0;
      allAnswers.forEach(a => {
        const sel = parseAnswer(a, {});
        if (sel[row]) { colCounts[sel[row]] = (colCounts[sel[row]] || 0) + 1; rowAnswered++; }
      });
      return { row, colCounts, rowAnswered };
    });

    return (
      <SummaryCard question={question} answered={answered} total={total} badge={`${rows.length} rows`}>
        {rowData.map(({ row, colCounts, rowAnswered }) => (
          <div key={row}>
            <p className="text-[11px] font-semibold text-gray-600 mb-1 mt-2 first:mt-0">{row}</p>
            {cols.map(c => (
              <BarRow key={c} label={c} count={colCounts[c] || 0}
                pct={rowAnswered ? Math.round((colCounts[c] || 0) / rowAnswered * 100) : 0}
                maxCount={Math.max(...Object.values(colCounts), 1)}
              />
            ))}
          </div>
        ))}
      </SummaryCard>
    );
  }

  // ── Tick Box Grid ─────────────────────────────────────────────────────────
  if (question.QuestionType === 'tickboxgrid') {
    const cfg  = asObj(question.Options, { rows: [], columns: [] });
    const rows = cfg.rows    ?? [];
    const cols = cfg.columns ?? [];

    const rowData = rows.map(row => {
      const colCounts = {};
      cols.forEach(c => { colCounts[c] = 0; });
      let rowAnswered = 0;
      allAnswers.forEach(a => {
        const sel    = parseAnswer(a, {});
        const rowSel = Array.isArray(sel[row]) ? sel[row] : [];
        if (rowSel.length > 0) rowAnswered++;
        rowSel.forEach(c => { if (colCounts[c] !== undefined) colCounts[c]++; });
      });
      return { row, colCounts, rowAnswered };
    });

    return (
      <SummaryCard question={question} answered={answered} total={total} badge={`${rows.length} rows`}>
        {rowData.map(({ row, colCounts, rowAnswered }) => (
          <div key={row}>
            <p className="text-[11px] font-semibold text-gray-600 mb-1 mt-2 first:mt-0">{row}</p>
            {cols.map(c => (
              <BarRow key={c} label={c} count={colCounts[c] || 0}
                pct={rowAnswered ? Math.round((colCounts[c] || 0) / rowAnswered * 100) : 0}
                maxCount={Math.max(...Object.values(colCounts), 1)}
              />
            ))}
          </div>
        ))}
      </SummaryCard>
    );
  }

  // ── File Upload ───────────────────────────────────────────────────────────
  if (question.QuestionType === 'fileupload') {
    const fileNames = allAnswers
      .map(a => parseAnswer(a, null)?.name)
      .filter(Boolean);
    return (
      <SummaryCard question={question} answered={fileNames.length} total={total}
        badge={fileNames.length > 0 ? `${fileNames.length} file${fileNames.length !== 1 ? 's' : ''}` : null}
      >
        {fileNames.length === 0 ? (
          <p className="text-[11px] text-gray-300 italic">No files uploaded</p>
        ) : (
          <>
            {fileNames.slice(0, 8).map((name, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-gray-700 bg-gray-50 rounded px-2 py-1.5">
                <span>📎</span>
                <span className="truncate">{name}</span>
              </div>
            ))}
            {fileNames.length > 8 && (
              <p className="text-[11px] text-gray-400">+{fileNames.length - 8} more</p>
            )}
          </>
        )}
      </SummaryCard>
    );
  }

  // ── Choice types (yesno / radio / select / checkbox) → bar per option ─────
  if (CHOICE_TYPES.includes(question.QuestionType)) {
    const counts = {};
    allAnswers.forEach(a => {
      const parts = question.QuestionType === 'checkbox'
        ? a.split(/[|,]/).map(s => s.trim()).filter(Boolean)
        : [a.trim()];
      parts.forEach(p => { counts[p] = (counts[p] || 0) + 1; });
    });
    const sorted   = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxCount = sorted[0]?.[1] || 1;
    return (
      <SummaryCard question={question} answered={answered} total={total}>
        {sorted.length ? sorted.map(([opt, c]) => (
          <BarRow key={opt} label={opt} count={c}
            pct={answered ? Math.round(c / answered * 100) : 0}
            maxCount={maxCount} />
        )) : <p className="text-[11px] text-gray-300 italic">No responses yet</p>}
      </SummaryCard>
    );
  }

  // ── Numeric / number type → smart range grouping ───────────────────────────
  const numVals   = allAnswers.map(v => parseFloat(v)).filter(n => !isNaN(n));
  const isNumeric = (question.QuestionType === 'number') ||
    (numVals.length > 0 && numVals.length / allAnswers.length >= 0.75);

  if (isNumeric && numVals.length > 0) {
    const isAge    = /\bage\b/i.test(question.QuestionText);
    const groups   = isAge ? AGE_GROUPS : buildNumRanges(numVals);
    const counted  = groups
      .map(g => ({ ...g, c: numVals.filter(v => v >= g.min && v <= g.max).length }))
      .filter(g => g.c > 0);
    const maxCount = Math.max(...counted.map(g => g.c), 1);
    const avg      = (numVals.reduce((s, v) => s + v, 0) / numVals.length).toFixed(1);
    const mn       = Math.min(...numVals);
    const mx       = Math.max(...numVals);
    const badge    = numVals.length > 1 ? `avg ${avg} · min ${mn} · max ${mx}` : `value ${mn}`;
    return (
      <SummaryCard question={question} answered={answered} total={total} badge={badge}>
        {counted.length ? counted.map(g => (
          <BarRow key={g.label} label={g.label} count={g.c}
            pct={answered ? Math.round(g.c / answered * 100) : 0}
            maxCount={maxCount} />
        )) : <p className="text-[11px] text-gray-300 italic">No numeric data</p>}
      </SummaryCard>
    );
  }

  // ── Text: group repeated values → bars; all-unique → list ─────────────────
  const valCounts  = {};
  allAnswers.forEach(a => { const k = String(a).trim(); valCounts[k] = (valCounts[k] || 0) + 1; });
  const sortedUniq = Object.entries(valCounts).sort((a, b) => b[1] - a[1]);
  const hasRepeats = sortedUniq.some(([, c]) => c > 1);
  const maxCount   = sortedUniq[0]?.[1] || 1;
  const uniqCount  = sortedUniq.length;

  return (
    <SummaryCard question={question} answered={answered} total={total}
      badge={uniqCount > 1 ? `${uniqCount} unique` : null}
    >
      {answered === 0 ? (
        <p className="text-[11px] text-gray-300 italic">No responses yet</p>
      ) : hasRepeats ? (
        sortedUniq.slice(0, 10).map(([val, c]) => (
          <BarRow key={val} label={val} count={c}
            pct={answered ? Math.round(c / answered * 100) : 0}
            maxCount={maxCount} />
        ))
      ) : (
        <>
          {allAnswers.slice(0, 6).map((a, i) => (
            <div key={i} className="text-[11px] text-gray-700 bg-gray-50 rounded px-2 py-1.5 leading-snug">{a}</div>
          ))}
          {allAnswers.length > 6 && (
            <p className="text-[11px] text-gray-400">+{allAnswers.length - 6} more</p>
          )}
        </>
      )}
    </SummaryCard>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export default function ResponsesModal({ form, onClose }) {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [deleting, setDeleting] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [view, setView]         = useState('table'); // 'table' | 'summary'

  // ── Group flat rows → { responseId: { meta, answers:{qId:text} } } ─────────
  const grouped      = {};
  const questionMeta = {};

  rows.forEach(r => {
    if (!grouped[r.ResponseID]) {
      grouped[r.ResponseID] = {
        ResponseID:     r.ResponseID,
        AccNo:          r.AccNo,
        ITSNo:          r.ITSNo,
        RespondentName: r.RespondentName,
        SubmittedAt:    r.SubmittedAt,
        answers: {},
      };
    }
    if (r.QuestionID) {
      grouped[r.ResponseID].answers[r.QuestionID] = r.AnswerText;
      if (!questionMeta[r.QuestionID]) {
        questionMeta[r.QuestionID] = {
          QuestionID:   r.QuestionID,
          QuestionText: r.QuestionText,
          QuestionType: r.QuestionType,
          Options:      r.Options,
          SortOrder:    r.SortOrder ?? 0,
        };
      }
    }
  });

  const responses = Object.values(grouped);
  const allQs     = Object.values(questionMeta)
    .filter(q => !!q.QuestionText)
    .sort((a, b) => a.SortOrder - b.SortOrder);

  // ── Classify questions into layout buckets ─────────────────────────────────
  const mobileQ = allQs.find(q => classifyField(q.QuestionText) === 'mobile');
  const sectorQ = allQs.find(q => classifyField(q.QuestionText) === 'sector');
  const fixedQIds     = new Set([mobileQ?.QuestionID, sectorQ?.QuestionID].filter(Boolean));
  const SKIP_IN_TABLE   = new Set(['itsno', 'accno', 'name']);
  const SKIP_IN_SUMMARY = new Set(['itsno', 'accno', 'name', 'mobile']);

  const remainingQs = allQs.filter(q => {
    const f = classifyField(q.QuestionText);
    return !SKIP_IN_TABLE.has(f) && !fixedQIds.has(q.QuestionID);
  });

  const summaryQs = allQs.filter(q => !SKIP_IN_SUMMARY.has(classifyField(q.QuestionText)));

  // ── Data loading ───────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await regFormService.loadResponses({
        FormID:   form.ID,
        DateFrom: dateFrom || undefined,
        DateTo:   dateTo   || undefined,
      });
      setRows(res?.data?.data ?? []);
    } catch { toast.error('Failed to load responses'); }
    finally  { setLoading(false); }
  }, [form.ID, dateFrom, dateTo]);

  useEffect(() => { load(); }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const deleteOne = async (ResponseID) => {
    if (!confirm('Delete this response? This cannot be undone.')) return;
    setDeleting(ResponseID);
    try {
      await regFormService.deleteResponse({ ResponseID });
      toast.success('Response deleted');
      setRows(prev => prev.filter(r => r.ResponseID !== ResponseID));
    } catch { toast.error('Failed to delete response'); }
    finally { setDeleting(null); }
  };

  const clearAll = async () => {
    if (!confirm(`Delete ALL ${responses.length} response(s) for "${form.Title}"? This cannot be undone.`)) return;
    setClearing(true);
    try {
      await regFormService.clearResponses({ FormID: form.ID });
      toast.success('All responses cleared');
      setRows([]);
    } catch { toast.error('Failed to clear responses'); }
    finally { setClearing(false); }
  };

  const exportExcel = () => {
    import('xlsx').then(({ utils, writeFile }) => {
      const header = [
        '#', 'ITS No', 'Full Name', 'AccNo',
        ...(mobileQ ? ['Mobile Number'] : []),
        ...(sectorQ ? ['Sector']        : []),
        ...remainingQs.map(q => q.QuestionText),
        'Submitted At',
      ];
      const data = responses.map((r, i) => [
        i + 1,
        r.ITSNo          || '',
        r.RespondentName || '',
        r.AccNo          || '',
        ...(mobileQ ? [r.answers[mobileQ.QuestionID] ?? ''] : []),
        ...(sectorQ ? [r.answers[sectorQ.QuestionID] ?? ''] : []),
        ...remainingQs.map(q => answerToText(q, r.answers[q.QuestionID])),
        fmtDisplay(r.SubmittedAt),
      ]);
      const ws = utils.aoa_to_sheet([header, ...data]);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Responses');
      writeFile(wb, `${form.Title}-responses.xlsx`);
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      open
      onClose={onClose}
      title={`Responses — ${form.Title}`}
      size="full"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <span className="text-sm text-gray-500">
            {responses.length} response{responses.length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            {responses.length > 0 && (
              <button
                className="btn h-8 px-3 text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                onClick={clearAll} disabled={clearing}
              >
                {clearing ? '…' : '🗑 Clear All'}
              </button>
            )}
            <button
              className="btn btn-secondary h-8 px-3 text-xs"
              onClick={exportExcel}
              disabled={!responses.length}
            >
              📊 Export Excel
            </button>
          </div>
        </div>
      }
    >
      {/* ── Filter + view toggle ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-xs text-gray-500 shrink-0">From</span>
          <input type="date" className="form-input h-7 text-xs w-32 shrink-0"
            value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span className="text-xs text-gray-500 shrink-0">To</span>
          <input type="date" className="form-input h-7 text-xs w-32 shrink-0"
            value={dateTo} onChange={e => setDateTo(e.target.value)} />
          <button className="btn btn-secondary h-7 px-3 text-xs shrink-0"
            onClick={load} disabled={loading}>
            {loading ? '…' : 'Filter'}
          </button>
        </div>

        <div className="flex border border-border rounded-lg overflow-hidden shrink-0">
          {[['table', 'Table'], ['summary', 'Summary']].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 h-7 text-xs font-medium transition-colors ${
                view === v ? 'bg-navy-800 text-white' : 'bg-white text-gray-500 hover:bg-surface'
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {loading ? (
        <p className="text-center text-gray-400 py-10 text-sm">Loading…</p>
      ) : responses.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">No responses yet.</p>
      ) : view === 'table' ? (

        /* ── Table view ─────────────────────────────────────────────────── */
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px] border-collapse">
            <thead>
              <tr>
                <th className="th-navy text-xs w-10 text-center">#</th>
                <th className="th-navy text-xs whitespace-nowrap">ITS No</th>
                <th className="th-navy text-xs whitespace-nowrap">Full Name</th>
                <th className="th-navy text-xs whitespace-nowrap">AccNo</th>
                {mobileQ && <th className="th-navy text-xs whitespace-nowrap">Mobile Number</th>}
                {sectorQ && <th className="th-navy text-xs whitespace-nowrap">Sector</th>}
                {remainingQs.map(q => (
                  <th key={q.QuestionID} className="th-navy text-xs min-w-[130px]">
                    {q.QuestionText}
                  </th>
                ))}
                <th className="th-navy text-xs whitespace-nowrap">Submitted</th>
                <th className="th-navy text-xs w-16 text-center">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {responses.map((r, i) => (
                <tr key={r.ResponseID} className="hover:bg-surface align-top">
                  <td className="px-3 py-2.5 text-center text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap font-mono text-[11px]">
                    {r.ITSNo || '—'}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">
                    {r.RespondentName || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                    {r.AccNo || '—'}
                  </td>
                  {mobileQ && (
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                      {r.answers[mobileQ.QuestionID] || '—'}
                    </td>
                  )}
                  {sectorQ && (
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                      {r.answers[sectorQ.QuestionID] || '—'}
                    </td>
                  )}
                  {remainingQs.map(q => (
                    <td key={q.QuestionID} className="px-3 py-2.5 text-gray-700 min-w-[130px]">
                      {renderAnswerCell(q, r.answers[q.QuestionID])}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap text-[11px]">
                    {fmtDisplay(r.SubmittedAt)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => deleteOne(r.ResponseID)}
                      disabled={deleting === r.ResponseID}
                      className="text-red-500 hover:text-red-700 disabled:opacity-40 font-semibold"
                      title="Delete this response"
                    >
                      {deleting === r.ResponseID ? '…' : '✕'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      ) : (

        /* ── Summary view ───────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {summaryQs.length === 0 ? (
            <p className="col-span-2 text-center text-gray-400 py-8 text-sm">No analytics data available.</p>
          ) : (
            summaryQs.map(q => (
              <QuestionSummaryCard key={q.QuestionID} question={q} responses={responses} />
            ))
          )}
        </div>

      )}
    </Modal>
  );
}
