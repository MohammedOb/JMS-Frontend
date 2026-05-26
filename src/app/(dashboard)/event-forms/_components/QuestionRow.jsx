'use client';
import { useState } from 'react';
import LogicEditor from './LogicEditor';
import { QUESTION_TYPES, BRANCHING_TYPES, needsOptions } from './formBuilderUtils';

export default function QuestionRow({
  question, sectionLocalId, allSections,
  onUpdate, onRemove, onMoveUp, onMoveDown, isFirst, isLast,
}) {
  const [showLogic, setShowLogic] = useState(false);
  const isBranching = BRANCHING_TYPES.includes(question.QuestionType);
  const update      = (key, val) => onUpdate({ ...question, [key]: val });

  return (
    <div className="border border-border rounded-lg bg-white overflow-hidden mb-2">

      {/* Header row */}
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
          className="form-select h-8 text-[11px] w-40"
          value={question.QuestionType}
          onChange={e => update('QuestionType', e.target.value)}
        >
          {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {question.BankID && (
          <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5 whitespace-nowrap">📌</span>
        )}
        <button onClick={onRemove} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-red-400 hover:text-red-600 text-[13px]">✕</button>
      </div>

      {/* Options editor */}
      {needsOptions(question.QuestionType) && (
        <div className="px-10 py-2 border-t border-border space-y-1">
          {(question.Options || []).map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <span className="text-gray-300 text-[10px]">{question.QuestionType === 'checkbox' ? '☐' : '○'}</span>
              <input
                className="form-input h-7 flex-1"
                placeholder={`Option ${oi + 1}`}
                value={opt}
                onChange={e => {
                  const opts = [...(question.Options || [])];
                  opts[oi] = e.target.value;
                  update('Options', opts);
                }}
              />
              <button
                onClick={() => update('Options', (question.Options || []).filter((_, j) => j !== oi))}
                className="text-red-400 hover:text-red-600 text-[11px]"
              >✕</button>
            </div>
          ))}
          <button
            onClick={() => update('Options', [...(question.Options || []), ''])}
            className="text-[11px] text-blue-500 hover:text-blue-700 font-medium"
          >+ Add option</button>
        </div>
      )}

      {/* Footer: Required + Logic toggle */}
      <div className="px-10 py-2 border-t border-border bg-surface flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-gray-600">
          <input
            type="checkbox"
            checked={!!question.IsRequired}
            onChange={e => update('IsRequired', e.target.checked)}
            className="rounded"
          />
          Required
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

      {/* Logic panel */}
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
