'use client';
import QuestionInput from './QuestionInput';

export default function FormStep({
  form,
  currentSharedSection,
  sharedSections,
  sectionIdx,
  existingResponseId,
  selectedCount,
  answers, setAnswers,
  submitting,
  isLastSection,
  goNext, goBack,
  submit,
}) {
  if (!currentSharedSection) {
    return (
      <div className="p-6">
        <p className="text-gray-400 text-[13px] text-center py-4">No additional questions.</p>
        <div className="flex gap-3">
          <button onClick={goBack}
            className="flex-shrink-0 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold text-[13px] py-3 px-5 rounded-xl">
            ← Back
          </button>
          <button onClick={submit} disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-[14px] py-3 rounded-xl">
            {submitting ? 'Submitting…' : `Submit Registration${selectedCount > 1 ? ` (${selectedCount} members)` : ''}`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {existingResponseId && sectionIdx === 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-[12px] rounded-xl px-4 py-3">
          You are already registered. Your previous answers are pre-filled — update them if needed.
        </div>
      )}

      {Number(form?.AllowFamilyRegistration) === 1 && selectedCount > 0 && sectionIdx === 0 && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[12px] rounded-xl px-4 py-3">
          These answers apply to all <strong>{selectedCount} selected member{selectedCount !== 1 ? 's' : ''}</strong>.
        </div>
      )}

      {sharedSections.length > 1 && currentSharedSection.Title && (
        <div className="border-b border-gray-100 pb-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
            Section {sectionIdx + 1} of {sharedSections.length}
          </p>
          <h2 className="text-[15px] font-bold text-gray-800">{currentSharedSection.Title}</h2>
        </div>
      )}

      {currentSharedSection.questions.length === 0 ? (
        <p className="text-gray-400 text-[13px] text-center py-4">No questions in this section.</p>
      ) : (
        currentSharedSection.questions.map((q, i) => (
          <div key={q.ID}>
            <label className="block text-[13px] font-semibold text-gray-800 mb-2">
              {i + 1}. {q.QuestionText}
              {q.IsRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <QuestionInput
              question={q}
              value={answers[q.ID] ?? ''}
              onChange={v => setAnswers(p => ({ ...p, [q.ID]: v }))}
            />
          </div>
        ))
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={goBack}
          className="flex-shrink-0 border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold text-[13px] py-3 px-5 rounded-xl transition-colors">
          ← Back
        </button>
        <button onClick={goNext} disabled={submitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-[14px] py-3 rounded-xl transition-colors">
          {submitting
            ? 'Submitting…'
            : isLastSection
              ? (existingResponseId ? 'Update Registration' : `Submit Registration${selectedCount > 1 ? ` (${selectedCount} members)` : ''}`)
              : 'Next →'}
        </button>
      </div>
    </div>
  );
}
