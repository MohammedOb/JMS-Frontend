'use client';
import { parseJson } from './helpers';

// Min-widths tuned per question type to keep columns as narrow as possible
const MIN_W = {
  yesno:        'min-w-[72px]',
  select:       'min-w-[100px]',
  radio:        'min-w-[100px]',
  checkbox:     'min-w-[110px]',
  number:       'min-w-[72px]',
  date:         'min-w-[110px]',
  linearscale:  'min-w-[80px]',
  rating:       'min-w-[80px]',
  default:      'min-w-[90px]',
};

const BASE = 'w-full border border-gray-200 rounded-md px-1.5 py-1 text-[11px] outline-none focus:border-teal-500 bg-white';

// Safely read Options as a plain object
const asObj = (opts, fallback) => {
  if (!opts) return fallback;
  if (typeof opts === 'object' && !Array.isArray(opts)) return opts;
  if (typeof opts === 'string') { try { const p = JSON.parse(opts); if (!Array.isArray(p)) return p; } catch {} }
  return fallback;
};

// Parse a JSON answer string
const parseAnswer = (v, fallback) => {
  if (!v) return fallback;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return fallback; }
};

export default function MemberCellInput({ question, value, onChange }) {
  const opts = parseJson(question.Options, []);
  const minW = MIN_W[question.QuestionType] ?? MIN_W.default;
  const cls  = `${BASE} ${minW}`;

  // ── Dropdown / radio → <select> ─────────────────────────────────────────────
  if (question.QuestionType === 'select' || question.QuestionType === 'radio') {
    return (
      <select value={value || ''} onChange={e => onChange(e.target.value)} className={cls}>
        <option value="">—</option>
        {opts.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  // ── Yes / No ────────────────────────────────────────────────────────────────
  if (question.QuestionType === 'yesno') {
    return (
      <select value={value || ''} onChange={e => onChange(e.target.value)} className={cls}>
        <option value="">—</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>
    );
  }

  // ── Linear Scale → compact number select ────────────────────────────────────
  if (question.QuestionType === 'linearscale') {
    const cfg   = asObj(question.Options, { min: 1, max: 5 });
    const min   = cfg.min ?? 1;
    const max   = cfg.max ?? 5;
    const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);
    return (
      <select value={value || ''} onChange={e => onChange(e.target.value)} className={cls}>
        <option value="">—</option>
        {steps.map(n => (
          <option key={n} value={String(n)}>
            {n}{n === min && cfg.minLabel ? ` (${cfg.minLabel})` : ''}{n === max && cfg.maxLabel ? ` (${cfg.maxLabel})` : ''}
          </option>
        ))}
      </select>
    );
  }

  // ── Rating → compact star select ────────────────────────────────────────────
  if (question.QuestionType === 'rating') {
    const cfg  = asObj(question.Options, { max: 5 });
    const max  = cfg.max ?? 5;
    const stars = Array.from({ length: max }, (_, i) => i + 1);
    return (
      <select value={value || ''} onChange={e => onChange(e.target.value)} className={cls}>
        <option value="">—</option>
        {stars.map(n => <option key={n} value={String(n)}>{'★'.repeat(n)} ({n})</option>)}
      </select>
    );
  }

  // ── Grid types (mcgrid / tickboxgrid) — read-only summary in cell ───────────
  if (question.QuestionType === 'mcgrid' || question.QuestionType === 'tickboxgrid') {
    const sel       = parseAnswer(value, {});
    const filled    = Object.entries(sel).filter(([, v]) =>
      Array.isArray(v) ? v.length > 0 : !!v,
    );
    return (
      <span className="text-[10px] text-gray-400 italic whitespace-nowrap">
        {filled.length > 0 ? `${filled.length} row${filled.length !== 1 ? 's' : ''} filled` : '—'}
      </span>
    );
  }

  // ── File Upload — show filename only in cell ─────────────────────────────────
  if (question.QuestionType === 'fileupload') {
    const fi = parseAnswer(value, null);
    return (
      <span className="text-[10px] text-gray-500 truncate block max-w-[120px]" title={fi?.name || ''}>
        {fi?.name ? `📎 ${fi.name}` : '—'}
      </span>
    );
  }

  // ── Default: text / number / date ────────────────────────────────────────────
  return (
    <input
      type={
        question.QuestionType === 'number' ? 'number'
        : question.QuestionType === 'date' ? 'date'
        : 'text'
      }
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className={cls}
    />
  );
}
