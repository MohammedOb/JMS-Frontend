'use client';
import toast from 'react-hot-toast';
import QuestionRow from './QuestionRow';
import { blankSection, blankQuestion } from './formBuilderUtils';

export default function SectionsBuilder({ sections, setSections, setShowBank, sectorOptions = [] }) {
  const totalQuestions = sections.reduce((n, s) => n + s.questions.length, 0);

  // ── Section helpers ────────────────────────────────────────────────────────

  const addSection = () =>
    setSections(p => [...p, blankSection(`Section ${p.length + 1}`)]);

  const removeSection = (localId) => {
    if (sections.length <= 1) { toast.error('A form must have at least one section'); return; }
    const moving = sections.find(s => s.localId === localId)?.questions ?? [];
    setSections(p => {
      const filtered = p.filter(s => s.localId !== localId);
      if (moving.length && filtered.length) {
        filtered[0] = { ...filtered[0], questions: [...filtered[0].questions, ...moving] };
      }
      return filtered;
    });
  };

  const updateSection = (localId, key, val) =>
    setSections(p => p.map(s => s.localId === localId ? { ...s, [key]: val } : s));

  // ── Question helpers ───────────────────────────────────────────────────────

  const addQuestion = (sectionLocalId) =>
    setSections(p => p.map(s =>
      s.localId === sectionLocalId
        ? { ...s, questions: [...s.questions, { ...blankQuestion(), SectionLocalId: sectionLocalId }] }
        : s
    ));

  const updateQuestion = (sectionLocalId, _key, updated) =>
    setSections(p => p.map(s =>
      s.localId === sectionLocalId
        ? { ...s, questions: s.questions.map(q => q._key === _key ? updated : q) }
        : s
    ));

  const removeQuestion = (sectionLocalId, _key) =>
    setSections(p => p.map(s =>
      s.localId === sectionLocalId
        ? { ...s, questions: s.questions.filter(q => q._key !== _key) }
        : s
    ));

  const moveQuestion = (sectionLocalId, _key, dir) =>
    setSections(p => p.map(s => {
      if (s.localId !== sectionLocalId) return s;
      const qs = [...s.questions];
      const i  = qs.findIndex(q => q._key === _key);
      const j  = i + dir;
      if (j < 0 || j >= qs.length) return s;
      [qs[i], qs[j]] = [qs[j], qs[i]];
      return { ...s, questions: qs };
    }));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] font-bold text-navy-700 uppercase tracking-wider">
            Sections &amp; Questions
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {sections.length} section{sections.length > 1 ? 's' : ''} · {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-secondary text-[11px] h-7 px-3" onClick={addSection}>
          + Add Section
        </button>
      </div>

      <div className="space-y-4">
        {sections.map((section, si) => (
          <div key={section.localId} className="border-2 border-border rounded-xl overflow-hidden">

            {/* Section header */}
            <div className="bg-navy-800 px-4 py-3 flex items-center gap-3">
              <span className="text-white/50 text-[11px] font-bold shrink-0">§{si + 1}</span>
              <input
                className="flex-1 bg-transparent text-white font-bold text-[13px] outline-none placeholder-white/40 border-b border-white/20 pb-0.5"
                value={section.title}
                onChange={e => updateSection(section.localId, 'title', e.target.value)}
                placeholder="Section title…"
              />
              {sections.length > 1 && (
                <button
                  onClick={() => removeSection(section.localId)}
                  className="text-white/40 hover:text-red-300 text-[12px] transition-colors"
                  title="Remove section"
                >✕</button>
              )}
            </div>

            {/* Questions */}
            <div className="p-3">
              {section.questions.length === 0 && (
                <p className="text-center text-gray-300 text-[11px] py-4 border-2 border-dashed border-gray-200 rounded-lg mb-2">
                  No questions in this section yet.
                </p>
              )}

              {section.questions.map((q, qi) => (
                <QuestionRow
                  key={q._key}
                  question={q}
                  sectionLocalId={section.localId}
                  allSections={sections}
                  sectorOptions={sectorOptions}
                  isFirst={qi === 0}
                  isLast={qi === section.questions.length - 1}
                  onUpdate={(updated) => updateQuestion(section.localId, q._key, updated)}
                  onRemove={() => removeQuestion(section.localId, q._key)}
                  onMoveUp={() => moveQuestion(section.localId, q._key, -1)}
                  onMoveDown={() => moveQuestion(section.localId, q._key, 1)}
                />
              ))}

              <div className="flex gap-2 mt-2">
                <button
                  className="btn btn-secondary text-[11px] h-7 px-3 flex-1"
                  onClick={() => setShowBank(section.localId)}
                >
                  📌 Import from Bank
                </button>
                <button
                  className="btn btn-primary text-[11px] h-7 px-3 flex-1"
                  onClick={() => addQuestion(section.localId)}
                >
                  + Add Question
                </button>
              </div>
            </div>

            {/* Conditional logic summary */}
            {section.questions.some(q => q.ConditionalLogic?.rules?.length) && (
              <div className="px-4 py-2 bg-purple-50 border-t border-purple-100">
                <p className="text-[10px] text-purple-600 font-semibold">
                  ⚡ {section.questions.filter(q => q.ConditionalLogic?.rules?.length).length} question(s) have conditional logic in this section
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
