'use client';

const TYPES = [
  { value: 'text',     label: 'Short Text' },
  { value: 'textarea', label: 'Paragraph' },
  { value: 'number',   label: 'Number' },
  { value: 'date',     label: 'Date' },
  { value: 'yesno',   label: 'Yes / No' },
  { value: 'radio',    label: 'Multiple Choice (radio)' },
  { value: 'select',   label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkboxes' },
];

const needsOptions = (t) => ['radio', 'select', 'checkbox'].includes(t);

export default function QuestionEditor({ questions, onChange }) {
  const update = (i, key, val) =>
    onChange(qs => qs.map((q, idx) => idx === i ? { ...q, [key]: val } : q));

  const remove = (i) => onChange(qs => qs.filter((_, idx) => idx !== i));

  const moveUp = (i) => {
    if (i === 0) return;
    onChange(qs => { const a = [...qs]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
  };
  const moveDown = (i) => {
    onChange(qs => { if (i >= qs.length - 1) return qs; const a = [...qs]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; });
  };

  const addOption = (i) => {
    const opts = [...(questions[i].Options || []), ''];
    update(i, 'Options', opts);
  };
  const updateOption = (i, oi, val) => {
    const opts = [...(questions[i].Options || [])];
    opts[oi] = val;
    update(i, 'Options', opts);
  };
  const removeOption = (i, oi) => {
    const opts = (questions[i].Options || []).filter((_, idx) => idx !== oi);
    update(i, 'Options', opts);
  };

  if (!questions.length) {
    return (
      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center text-gray-400 text-[12px]">
        No questions yet. Click "Add Question" or import from the bank.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {questions.map((q, i) => (
        <div key={i} className="border border-border rounded-lg bg-white overflow-hidden">
          {/* Question header */}
          <div className="bg-surface px-3 py-2 flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moveUp(i)}   className="text-gray-400 hover:text-gray-600 text-[10px] leading-none">▲</button>
              <button onClick={() => moveDown(i)} className="text-gray-400 hover:text-gray-600 text-[10px] leading-none">▼</button>
            </div>
            <span className="text-[11px] font-bold text-gray-500 w-5">{i + 1}</span>
            <input
              className="form-input flex-1 h-8"
              placeholder="Question text…"
              value={q.QuestionText}
              onChange={e => update(i, 'QuestionText', e.target.value)}
            />
            <select
              className="form-select h-8 text-[11px] w-44"
              value={q.QuestionType}
              onChange={e => update(i, 'QuestionType', e.target.value)}
            >
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {q.BankID && (
              <span title="Imported from bank" className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5 whitespace-nowrap">
                📌 Bank
              </span>
            )}
            <button
              onClick={() => remove(i)}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 text-red-400 hover:text-red-600 text-[13px]"
            >✕</button>
          </div>

          {/* Options (for radio/select/checkbox) */}
          {needsOptions(q.QuestionType) && (
            <div className="px-10 py-2 border-t border-border bg-white space-y-1">
              {(q.Options || []).map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <span className="text-gray-300 text-[10px]">
                    {q.QuestionType === 'checkbox' ? '☐' : '○'}
                  </span>
                  <input
                    className="form-input h-7 flex-1"
                    placeholder={`Option ${oi + 1}`}
                    value={opt}
                    onChange={e => updateOption(i, oi, e.target.value)}
                  />
                  <button
                    onClick={() => removeOption(i, oi)}
                    className="text-red-400 hover:text-red-600 text-[11px] w-5 h-5 flex items-center justify-center"
                  >✕</button>
                </div>
              ))}
              <button
                onClick={() => addOption(i)}
                className="text-[11px] text-blue-500 hover:text-blue-700 font-medium mt-1"
              >
                + Add option
              </button>
            </div>
          )}

          {/* Footer: required toggle */}
          <div className="px-10 py-2 border-t border-border bg-surface flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-gray-600">
              <input
                type="checkbox"
                checked={!!q.IsRequired}
                onChange={e => update(i, 'IsRequired', e.target.checked)}
                className="rounded"
              />
              Required
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
