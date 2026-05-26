'use client';

export default function LogicEditor({ question, allSections, currentSectionLocalId, onChange }) {
  const options = question.QuestionType === 'yesno'
    ? ['Yes', 'No']
    : (question.Options || []).filter(Boolean);

  if (!options.length && question.QuestionType !== 'yesno') {
    return <p className="text-[11px] text-gray-400 italic">Add options first to set conditional logic.</p>;
  }

  const rules    = question.ConditionalLogic?.rules || [];
  const getRule  = (answer) => rules.find(r => r.answer === answer) || { answer, nextSectionId: null };
  const setRule  = (answer, nextSectionId) => {
    const existing = rules.filter(r => r.answer !== answer);
    const updated  = nextSectionId != null ? [...existing, { answer, nextSectionId }] : existing;
    onChange({ rules: updated });
  };

  const otherSections = allSections.filter(s => s.localId !== currentSectionLocalId);

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
        If answer is… → go to section
      </p>
      {options.map(opt => {
        const rule = getRule(opt);
        return (
          <div key={opt} className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-gray-700 w-20 shrink-0 truncate" title={opt}>
              &ldquo;{opt}&rdquo;
            </span>
            <span className="text-gray-400 text-[11px]">→</span>
            <select
              className="form-select h-7 text-[11px] flex-1"
              value={rule.nextSectionId ?? ''}
              onChange={e => setRule(opt, e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">Continue to next section</option>
              {otherSections.map(s => (
                <option key={s.localId} value={s.localId}>{s.title || 'Untitled section'}</option>
              ))}
              <option value={0}>End form (submit)</option>
            </select>
          </div>
        );
      })}
    </div>
  );
}
