'use client';
import { useEffect } from 'react';
import { parseJson } from './helpers';

// Safely read Options as a plain object (linearscale / rating / grid / fileupload)
const asObj = (opts, fallback) => {
  if (!opts) return fallback;
  if (typeof opts === 'object' && !Array.isArray(opts)) return opts;
  if (typeof opts === 'string') { try { const p = JSON.parse(opts); if (!Array.isArray(p)) return p; } catch {} }
  return fallback;
};

// Safely parse a JSON answer string into an object / array
const parseAnswer = (v, fallback) => {
  if (!v) return fallback;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return fallback; }
};

export default function QuestionInput({ question, value, onChange, memberData }) {
  const opts = parseJson(question.Options, []);   // for flat-choice types

  // Filter options based on per-option profile rules (optionFilters in ConditionalLogic)
  const optionFilters = question.ConditionalLogic?.optionFilters ?? {};
  const hasAnyFilter  = Object.keys(optionFilters).length > 0;
  const getMemberField = (md, field) => {
    if (!md) return undefined;
    if (field === 'Sector') return md.Sector || md.mSector;
    return md[field];
  };
  const visibleOpts = opts.filter(opt => {
    if (!hasAnyFilter) return true;
    if (!memberData)   return true;
    const rule = optionFilters[opt];
    if (!rule || !rule.values?.length) return false;
    return rule.values.includes(getMemberField(memberData, rule.field) ?? '');
  });

  // Auto-select when exactly one option is visible
  useEffect(() => {
    if (visibleOpts.length === 1 && value !== visibleOpts[0]) {
      onChange(visibleOpts[0]);
    }
  }, [visibleOpts.length, visibleOpts[0] ?? '']); // eslint-disable-line react-hooks/exhaustive-deps

  // Readonly badge shown when only one option is possible due to filtering
  const LockedValue = ({ v }) => (
    <div className="w-full border border-blue-200 rounded-xl px-3 py-2.5 text-[13px] bg-blue-50 text-blue-800 flex items-center gap-2">
      <span className="text-[10px] bg-blue-200 text-blue-700 rounded px-1.5 py-0.5 font-bold shrink-0">Auto</span>
      {v}
    </div>
  );

  switch (question.QuestionType) {

    // ── Paragraph ─────────────────────────────────────────────────────────────
    case 'textarea':
      return (
        <textarea
          rows={3} value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder="Your answer…"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
        />
      );

    // ── Number ────────────────────────────────────────────────────────────────
    case 'number':
      return (
        <input
          type="number" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="0"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      );

    // ── Date ──────────────────────────────────────────────────────────────────
    case 'date':
      return (
        <input
          type="date" value={value || ''} onChange={e => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-blue-500"
        />
      );

    // ── Yes / No ──────────────────────────────────────────────────────────────
    case 'yesno':
      return (
        <div className="flex gap-6 pt-1">
          {['Yes', 'No'].map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-700 select-none">
              <input
                type="radio" name={`q_${question.ID}`} value={opt}
                checked={value === opt} onChange={() => onChange(opt)}
                className="accent-blue-600 w-4 h-4"
              />
              {opt}
            </label>
          ))}
        </div>
      );

    // ── Multiple Choice (radio) ───────────────────────────────────────────────
    case 'radio':
      if (visibleOpts.length === 1) return <LockedValue v={visibleOpts[0]} />;
      return (
        <div className="space-y-2 pt-1">
          {visibleOpts.filter(Boolean).map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-700 select-none">
              <input
                type="radio" name={`q_${question.ID}`} value={opt}
                checked={value === opt} onChange={() => onChange(opt)}
                className="accent-blue-600 w-4 h-4"
              />
              {opt}
            </label>
          ))}
        </div>
      );

    // ── Dropdown ──────────────────────────────────────────────────────────────
    case 'select':
      if (visibleOpts.length === 1) return <LockedValue v={visibleOpts[0]} />;
      return (
        <select
          value={value || ''} onChange={e => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-blue-500 bg-white"
        >
          <option value="">Select an option…</option>
          {visibleOpts.filter(Boolean).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );

    // ── Checkboxes ────────────────────────────────────────────────────────────
    case 'checkbox': {
      if (visibleOpts.length === 1) return <LockedValue v={visibleOpts[0]} />;
      const checked = value ? value.split('|') : [];
      return (
        <div className="space-y-2 pt-1">
          {visibleOpts.filter(Boolean).map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-700 select-none">
              <input
                type="checkbox" checked={checked.includes(opt)}
                className="rounded accent-blue-600 w-4 h-4"
                onChange={() => {
                  const next = checked.includes(opt)
                    ? checked.filter(v => v !== opt)
                    : [...checked, opt];
                  onChange(next.join(','));
                }}
              />
              {opt}
            </label>
          ))}
        </div>
      );
    }

    // ── Linear Scale ─────────────────────────────────────────────────────────
    case 'linearscale': {
      const cfg   = asObj(question.Options, { min: 1, max: 5, minLabel: '', maxLabel: '' });
      const min   = cfg.min ?? 1;
      const max   = cfg.max ?? 5;
      const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);
      return (
        <div className="pt-2">
          <div className="flex items-end gap-3 flex-wrap">
            {cfg.minLabel && (
              <span className="text-[12px] text-gray-500 italic pb-1 shrink-0">{cfg.minLabel}</span>
            )}
            {steps.map(n => (
              <label
                key={n}
                className="flex flex-col items-center gap-1 cursor-pointer select-none min-w-[32px]"
              >
                <input
                  type="radio" name={`q_${question.ID}`} value={String(n)}
                  checked={value === String(n)} onChange={() => onChange(String(n))}
                  className="accent-blue-600 w-4 h-4"
                />
                <span className={`text-[12px] font-medium ${value === String(n) ? 'text-blue-600' : 'text-gray-500'}`}>
                  {n}
                </span>
              </label>
            ))}
            {cfg.maxLabel && (
              <span className="text-[12px] text-gray-500 italic pb-1 shrink-0">{cfg.maxLabel}</span>
            )}
          </div>
        </div>
      );
    }

    // ── Rating (stars) ────────────────────────────────────────────────────────
    case 'rating': {
      const cfg     = asObj(question.Options, { max: 5 });
      const max     = cfg.max ?? 5;
      const current = parseInt(value) || 0;
      return (
        <div className="flex items-center gap-1 pt-1">
          {Array.from({ length: max }, (_, i) => i + 1).map(n => (
            <button
              key={n} type="button"
              onClick={() => onChange(current === n ? '' : String(n))}
              className={`text-[30px] leading-none transition-colors focus:outline-none ${
                n <= current ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-yellow-300'
              }`}
            >★</button>
          ))}
          {current > 0 && (
            <span className="text-[12px] text-gray-400 ml-2 select-none">{current} / {max}</span>
          )}
        </div>
      );
    }

    // ── Multiple-Choice Grid ──────────────────────────────────────────────────
    case 'mcgrid': {
      const cfg  = asObj(question.Options, { rows: [], columns: [] });
      const rows = cfg.rows    ?? [];
      const cols = cfg.columns ?? [];
      const sel  = parseAnswer(value, {});
      const updateSel = (row, col) => onChange(JSON.stringify({ ...sel, [row]: col }));
      return (
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-left font-semibold text-gray-400 min-w-[120px]" />
                {cols.map(c => (
                  <th key={c} className="px-3 py-2 text-center font-semibold text-gray-600 min-w-[80px]">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(r => (
                <tr key={r} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 font-medium text-gray-700">{r}</td>
                  {cols.map(c => (
                    <td key={c} className="px-3 py-2.5 text-center">
                      <input
                        type="radio" name={`q_${question.ID}_${r}`} value={c}
                        checked={sel[r] === c} onChange={() => updateSel(r, c)}
                        className="accent-blue-600 w-4 h-4"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // ── Tick Box Grid ─────────────────────────────────────────────────────────
    case 'tickboxgrid': {
      const cfg  = asObj(question.Options, { rows: [], columns: [] });
      const rows = cfg.rows    ?? [];
      const cols = cfg.columns ?? [];
      const sel  = parseAnswer(value, {});
      const toggle = (row, col) => {
        const rowSel = Array.isArray(sel[row]) ? sel[row] : [];
        const next   = rowSel.includes(col)
          ? rowSel.filter(v => v !== col)
          : [...rowSel, col];
        onChange(JSON.stringify({ ...sel, [row]: next }));
      };
      return (
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-left font-semibold text-gray-400 min-w-[120px]" />
                {cols.map(c => (
                  <th key={c} className="px-3 py-2 text-center font-semibold text-gray-600 min-w-[80px]">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(r => {
                const rowSel = Array.isArray(sel[r]) ? sel[r] : [];
                return (
                  <tr key={r} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-gray-700">{r}</td>
                    {cols.map(c => (
                      <td key={c} className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox" checked={rowSel.includes(c)}
                          onChange={() => toggle(r, c)}
                          className="accent-blue-600 rounded w-4 h-4"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // ── File Upload ───────────────────────────────────────────────────────────
    case 'fileupload': {
      const cfg      = asObj(question.Options, { accept: '', maxSizeMB: 5 });
      const maxBytes = (cfg.maxSizeMB || 5) * 1024 * 1024;
      const fileInfo = parseAnswer(value, null);
      return (
        <div>
          {fileInfo?.name ? (
            /* File chosen — show summary card */
            <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
              <span className="text-xl shrink-0">📎</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-teal-800 truncate">{fileInfo.name}</p>
                <p className="text-[11px] text-teal-600">{(fileInfo.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                type="button" onClick={() => onChange('')}
                className="shrink-0 text-red-400 hover:text-red-600 text-[12px] font-semibold transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            /* Drop-zone */
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <span className="text-3xl mb-1 pointer-events-none">📎</span>
              <span className="text-[13px] text-gray-500 font-medium pointer-events-none">Click to choose a file</span>
              {cfg.accept && <span className="text-[11px] text-gray-400 mt-0.5 pointer-events-none">{cfg.accept}</span>}
              <span className="text-[11px] text-gray-400 mt-0.5 pointer-events-none">Max {cfg.maxSizeMB || 5} MB</span>
              <input
                type="file"
                accept={cfg.accept || undefined}
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > maxBytes) {
                    alert(`File too large. Maximum allowed size is ${cfg.maxSizeMB || 5} MB.`);
                    e.target.value = '';
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = ev => onChange(JSON.stringify({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    data: ev.target.result,   // base64 data URL
                  }));
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          )}
        </div>
      );
    }

    // ── Default (short text) ──────────────────────────────────────────────────
    default:
      return (
        <input
          type="text" value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder="Your answer…"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      );
  }
}
