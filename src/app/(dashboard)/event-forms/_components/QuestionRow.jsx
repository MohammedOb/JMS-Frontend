'use client';
import { useState } from 'react';
import LogicEditor from './LogicEditor';
import MultiComboBox from './MultiComboBox';
import {
  QUESTION_TYPES, BRANCHING_TYPES, OPTION_FILTER_FIELDS,
  needsOptions, needsGridOptions, defaultOptions,
} from './formBuilderUtils';

// Safely read Options as a plain object (for linearscale / rating / grid / fileupload)
const asObj = (opts, fallback) => {
  if (!opts) return fallback;
  if (typeof opts === 'object' && !Array.isArray(opts)) return opts;
  if (typeof opts === 'string') { try { const p = JSON.parse(opts); if (!Array.isArray(p)) return p; } catch {} }
  return fallback;
};

export default function QuestionRow({
  question, sectionLocalId, allSections, sectorOptions = [],
  onUpdate, onRemove, onMoveUp, onMoveDown, isFirst, isLast,
}) {
  const [showLogic,   setShowLogic]   = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const isBranching = BRANCHING_TYPES.includes(question.QuestionType);
  const update      = (key, val) => onUpdate({ ...question, [key]: val });

  // ── Option filter helpers ────────────────────────────────────────────────────
  const cl            = question.ConditionalLogic || {};
  const optionFilters = cl.optionFilters || {};
  const filterCount   = Object.keys(optionFilters).length;

  const getFieldKeyForOpt = (opt) => {
    const rule = optionFilters[opt];
    if (!rule) return '';
    return OPTION_FILTER_FIELDS.find(f => f.memberProp === rule.field)?.key || '';
  };

  const getValuesForField = (fieldKey) => {
    const def = OPTION_FILTER_FIELDS.find(f => f.key === fieldKey);
    if (!def) return [];
    return def.valuesSource === 'dynamic' ? sectorOptions : (def.values || []);
  };

  const setOptionFilter = (opt, fieldKey, values) => {
    const newFilters = { ...optionFilters };
    if (fieldKey) {
      // Keep entry even when values is empty so the field dropdown stays selected
      const def = OPTION_FILTER_FIELDS.find(f => f.key === fieldKey);
      newFilters[opt] = { field: def.memberProp, values };
    } else {
      delete newFilters[opt];
    }
    const hasFilters = Object.keys(newFilters).length > 0;
    update('ConditionalLogic', { ...cl, optionFilters: hasFilters ? newFilters : undefined });
  };

  // Reset Options to the correct default whenever the type changes
  const handleTypeChange = (newType) => {
    onUpdate({ ...question, QuestionType: newType, Options: defaultOptions(newType) });
  };

  // ── Grid helpers ────────────────────────────────────────────────────────────
  const gridCfg    = asObj(question.Options, { rows: [], columns: [] });
  const gridRows   = Array.isArray(gridCfg.rows)    ? gridCfg.rows    : [];
  const gridCols   = Array.isArray(gridCfg.columns) ? gridCfg.columns : [];
  const updateGrid = (key, arr) => update('Options', { ...gridCfg, [key]: arr });

  // ── Linear Scale helpers ────────────────────────────────────────────────────
  const scaleCfg = asObj(question.Options, { min: 1, max: 5, minLabel: '', maxLabel: '' });
  const updateScale = (k, v) => update('Options', { ...scaleCfg, [k]: v });

  // ── Rating helpers ──────────────────────────────────────────────────────────
  const ratingCfg = asObj(question.Options, { max: 5 });

  // ── File Upload helpers ─────────────────────────────────────────────────────
  const fileCfg    = asObj(question.Options, { accept: '', maxSizeMB: 5 });
  const updateFile = (k, v) => update('Options', { ...fileCfg, [k]: v });

  return (
    <div className="border border-border rounded-lg bg-white overflow-hidden mb-2">

      {/* ── Header row ──────────────────────────────────────────────────────── */}
      <div className="bg-surface px-3 py-2 flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp}   disabled={isFirst} className="text-gray-300 hover:text-gray-500 disabled:opacity-30 text-[9px] leading-none">▲</button>
          <button onClick={onMoveDown} disabled={isLast}  className="text-gray-300 hover:text-gray-500 disabled:opacity-30 text-[9px] leading-none">▼</button>
        </div>
        <input
          className="form-input flex-1 h-8"
          placeholder="Question text…"
          value={question.QuestionText}
          onChange={e => update('QuestionText', e.target.value)}
        />
        <select
          className="form-select h-8 text-[11px] w-44"
          value={question.QuestionType}
          onChange={e => handleTypeChange(e.target.value)}
        >
          {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {question.BankID && (
          <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5 whitespace-nowrap">📌</span>
        )}
        <button onClick={onRemove} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-red-400 hover:text-red-600 text-[13px]">✕</button>
      </div>

      {/* ── Flat options (radio / select / checkbox) ─────────────────────────── */}
      {needsOptions(question.QuestionType) && (
        <div className="px-10 py-2 border-t border-border space-y-1">
          {(Array.isArray(question.Options) ? question.Options : []).map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <span className="text-gray-300 text-[10px]">{question.QuestionType === 'checkbox' ? '☐' : '○'}</span>
              <input
                className="form-input h-7 flex-1"
                placeholder={`Option ${oi + 1}`}
                value={opt}
                onChange={e => {
                  const opts = [...(Array.isArray(question.Options) ? question.Options : [])];
                  opts[oi] = e.target.value;
                  update('Options', opts);
                }}
              />
              <button
                onClick={() => update('Options', (Array.isArray(question.Options) ? question.Options : []).filter((_, j) => j !== oi))}
                className="text-red-400 hover:text-red-600 text-[11px]"
              >✕</button>
            </div>
          ))}
          <button
            onClick={() => update('Options', [...(Array.isArray(question.Options) ? question.Options : []), ''])}
            className="text-[11px] text-blue-500 hover:text-blue-700 font-medium"
          >+ Add option</button>

          {/* ── Option visibility filters ──────────────────────────────── */}
          {(Array.isArray(question.Options) ? question.Options : []).filter(Boolean).length > 0 && (
            <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
              <button
                type="button"
                onClick={() => setShowFilters(v => !v)}
                className={`text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                  filterCount > 0 ? 'text-orange-600 hover:text-orange-800' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                🔒 Restrict visibility by member profile
                {filterCount > 0 && (
                  <span className="bg-orange-100 text-orange-700 border border-orange-200 rounded px-1.5 py-0.5 text-[10px]">
                    {filterCount} rule{filterCount !== 1 ? 's' : ''}
                  </span>
                )}
              </button>

              {showFilters && (
                <div className="mt-2 space-y-2">
                  {/* Header explanation */}
                  <div className="text-[10px] text-orange-700 bg-orange-100 border border-orange-200 rounded-lg px-2.5 py-1.5">
                    Each row = one answer option. Set which member profile values can see that option. Leave blank = visible to everyone.
                  </div>
                  {(Array.isArray(question.Options) ? question.Options : []).filter(Boolean).map((opt) => {
                    const currentFieldKey = getFieldKeyForOpt(opt);
                    const currentValues   = optionFilters[opt]?.values ?? [];
                    const valueOptions    = currentFieldKey ? getValuesForField(currentFieldKey) : [];
                    const fieldDef        = OPTION_FILTER_FIELDS.find(f => f.key === currentFieldKey);
                    return (
                      <div key={opt} className="flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-lg px-2.5 py-2">
                        <div className="min-w-0 flex-1 pt-1">
                          <p className="text-[9px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">Show option</p>
                          <p className="text-[11px] text-gray-800 font-semibold truncate" title={opt}>{opt}</p>
                          <p className="text-[9px] text-orange-400 mt-0.5">only when member matches →</p>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0 w-72">
                          <select
                            className="form-select h-7 text-[11px]"
                            value={currentFieldKey}
                            onChange={e => setOptionFilter(opt, e.target.value, [])}
                          >
                            <option value="">Show to all members</option>
                            {OPTION_FILTER_FIELDS.map(f => (
                              <option key={f.key} value={f.key}>{f.label}</option>
                            ))}
                          </select>
                          {currentFieldKey && (
                            <MultiComboBox
                              value={currentValues}
                              options={valueOptions}
                              placeholder={`Select ${fieldDef?.label} values…`}
                              onChange={vals => setOptionFilter(opt, currentFieldKey, vals)}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-gray-400 pt-0.5">Options with blank field are shown to all members.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Linear Scale editor ──────────────────────────────────────────────── */}
      {question.QuestionType === 'linearscale' && (
        <div className="px-10 py-3 border-t border-border">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-medium text-gray-500 shrink-0">Min</label>
              <input
                type="number" min={0} max={(scaleCfg.max ?? 5) - 1}
                className="form-input h-7 w-16 text-center"
                value={scaleCfg.min ?? 1}
                onChange={e => updateScale('min', Math.max(0, parseInt(e.target.value) || 0))}
              />
              <input
                className="form-input h-7 w-36" placeholder="Label (e.g. Poor)"
                value={scaleCfg.minLabel || ''}
                onChange={e => updateScale('minLabel', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-medium text-gray-500 shrink-0">Max</label>
              <input
                type="number" min={(scaleCfg.min ?? 1) + 1} max={10}
                className="form-input h-7 w-16 text-center"
                value={scaleCfg.max ?? 5}
                onChange={e => updateScale('max', Math.min(10, parseInt(e.target.value) || 5))}
              />
              <input
                className="form-input h-7 w-36" placeholder="Label (e.g. Excellent)"
                value={scaleCfg.maxLabel || ''}
                onChange={e => updateScale('maxLabel', e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-gray-400">
            Preview:&nbsp;
            {Array.from(
              { length: (scaleCfg.max ?? 5) - (scaleCfg.min ?? 1) + 1 },
              (_, i) => (scaleCfg.min ?? 1) + i,
            ).map(n => (
              <span key={n} className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded text-gray-500 text-[10px]">{n}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Rating editor ────────────────────────────────────────────────────── */}
      {question.QuestionType === 'rating' && (
        <div className="px-10 py-2 border-t border-border flex items-center gap-3">
          <label className="text-[11px] font-medium text-gray-500">Number of stars</label>
          <select
            className="form-select h-7 text-[12px] w-20"
            value={ratingCfg.max ?? 5}
            onChange={e => update('Options', { ...ratingCfg, max: parseInt(e.target.value) })}
          >
            {[3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-yellow-400 tracking-tight text-[18px]">
            {'★'.repeat(ratingCfg.max ?? 5)}
          </span>
        </div>
      )}

      {/* ── Grid editor (mcgrid / tickboxgrid) ───────────────────────────────── */}
      {needsGridOptions(question.QuestionType) && (
        <div className="px-10 py-3 border-t border-border">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {question.QuestionType === 'tickboxgrid' ? 'Tick Box Grid' : 'Multiple-Choice Grid'} Layout
          </p>
          <div className="grid grid-cols-2 gap-5">
            {/* Rows */}
            <div>
              <p className="text-[10px] font-semibold text-gray-500 mb-1.5 uppercase">Rows</p>
              <div className="space-y-1">
                {gridRows.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="form-input h-7 flex-1"
                      placeholder={`Row ${i + 1}`}
                      value={r}
                      onChange={e => {
                        const a = [...gridRows]; a[i] = e.target.value;
                        updateGrid('rows', a);
                      }}
                    />
                    <button
                      onClick={() => updateGrid('rows', gridRows.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 text-[11px]"
                    >✕</button>
                  </div>
                ))}
                <button
                  onClick={() => updateGrid('rows', [...gridRows, ''])}
                  className="text-[11px] text-blue-500 hover:text-blue-700 font-medium"
                >+ Add row</button>
              </div>
            </div>
            {/* Columns */}
            <div>
              <p className="text-[10px] font-semibold text-gray-500 mb-1.5 uppercase">Columns</p>
              <div className="space-y-1">
                {gridCols.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="form-input h-7 flex-1"
                      placeholder={`Column ${i + 1}`}
                      value={c}
                      onChange={e => {
                        const a = [...gridCols]; a[i] = e.target.value;
                        updateGrid('columns', a);
                      }}
                    />
                    <button
                      onClick={() => updateGrid('columns', gridCols.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 text-[11px]"
                    >✕</button>
                  </div>
                ))}
                <button
                  onClick={() => updateGrid('columns', [...gridCols, ''])}
                  className="text-[11px] text-blue-500 hover:text-blue-700 font-medium"
                >+ Add column</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── File Upload editor ───────────────────────────────────────────────── */}
      {question.QuestionType === 'fileupload' && (
        <div className="px-10 py-2 border-t border-border flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-medium text-gray-500 shrink-0">Accepted types</label>
            <input
              className="form-input h-7 w-44"
              placeholder="e.g. image/*,.pdf (blank = all)"
              value={fileCfg.accept || ''}
              onChange={e => updateFile('accept', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-medium text-gray-500 shrink-0">Max size</label>
            <input
              type="number" min={1} max={50}
              className="form-input h-7 w-16 text-center"
              value={fileCfg.maxSizeMB ?? 5}
              onChange={e => updateFile('maxSizeMB', parseInt(e.target.value) || 5)}
            />
            <span className="text-[11px] text-gray-400">MB</span>
          </div>
          <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
            ⚠ Requires <code>ALTER TABLE reg_answers MODIFY COLUMN AnswerText MEDIUMTEXT;</code>
          </span>
        </div>
      )}

      {/* ── Footer: Required + Per Member + Logic toggle ─────────────────────── */}
      <div className="px-10 py-2 border-t border-border bg-surface flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-gray-600">
          <input
            type="checkbox"
            checked={!!question.IsRequired}
            onChange={e => update('IsRequired', e.target.checked)}
            className="rounded"
          />
          Required
        </label>
        <label
          className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-gray-600"
          title="Each family member answers this individually (shown as a column in the family selection table)"
        >
          <input
            type="checkbox"
            checked={!!question.PerMember}
            onChange={e => update('PerMember', e.target.checked)}
            className="rounded accent-teal-600"
          />
          <span className={question.PerMember ? 'text-teal-700 font-semibold' : ''}>Per Member</span>
        </label>
        {isBranching && (
          <button
            onClick={() => setShowLogic(v => !v)}
            className={`text-[11px] font-medium flex items-center gap-1 transition-colors ${
              showLogic || question.ConditionalLogic?.rules?.length
                ? 'text-purple-600 hover:text-purple-700'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            ⚡ Conditional Logic
            {question.ConditionalLogic?.rules?.length
              ? ` (${question.ConditionalLogic.rules.length} rule${question.ConditionalLogic.rules.length > 1 ? 's' : ''})`
              : ''}
          </button>
        )}
      </div>

      {/* ── Logic panel ──────────────────────────────────────────────────────── */}
      {isBranching && showLogic && (
        <div className="px-10 py-3 border-t border-purple-100 bg-purple-50">
          <LogicEditor
            question={question}
            allSections={allSections}
            currentSectionLocalId={sectionLocalId}
            onChange={(logic) => update('ConditionalLogic', logic)}
          />
        </div>
      )}
    </div>
  );
}
