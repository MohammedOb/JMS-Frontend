'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { regFormService } from '@/services';
import toast from 'react-hot-toast';
import Modal from '@/components/shared/Modal';
import QuestionBankModal from './QuestionBankModal';

const toLocalDateStr = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d)) return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTION_TYPES = [
  { value: 'text',     label: 'Short Text' },
  { value: 'textarea', label: 'Paragraph' },
  { value: 'number',   label: 'Number' },
  { value: 'date',     label: 'Date' },
  { value: 'yesno',   label: 'Yes / No' },
  { value: 'radio',    label: 'Multiple Choice' },
  { value: 'select',   label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkboxes' },
];

const BRANCHING_TYPES = ['yesno', 'radio', 'select'];
const needsOptions = (t) => ['radio', 'select', 'checkbox'].includes(t);

let _nextLocalId = 1;
const nextLocalId = () => _nextLocalId++;

const blankSection  = (title = 'Section') => ({ localId: nextLocalId(), title, questions: [] });
const blankQuestion = () => ({
  _key: nextLocalId(),
  BankID: null, SectionLocalId: null,
  QuestionText: '', QuestionType: 'text',
  Options: [], IsRequired: false, ConditionalLogic: null,
});

const blankForm = () => ({
  Title: '', Description: '', HeaderImage: '', EventName: '', EventDate: '',
  AgeMin: '', AgeMax: '', Status: 'draft',
  AfterSubmitMessage: '', ClosedMessage: '',
});

// ─── Conditional Logic Editor ─────────────────────────────────────────────────

function LogicEditor({ question, allSections, currentSectionLocalId, onChange }) {
  const options = question.QuestionType === 'yesno'
    ? ['Yes', 'No']
    : (question.Options || []).filter(Boolean);

  if (!options.length && question.QuestionType !== 'yesno') {
    return <p className="text-[11px] text-gray-400 italic">Add options first to set conditional logic.</p>;
  }

  const rules = question.ConditionalLogic?.rules || [];
  const getRule = (answer) => rules.find(r => r.answer === answer) || { answer, nextSectionId: null };

  const setRule = (answer, nextSectionId) => {
    const existing = rules.filter(r => r.answer !== answer);
    const updated  = nextSectionId != null
      ? [...existing, { answer, nextSectionId }]
      : existing;
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
              "{opt}"
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

// ─── Single Question Row ──────────────────────────────────────────────────────

function QuestionRow({ question, sectionLocalId, allSections, onUpdate, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [showLogic, setShowLogic] = useState(false);
  const isBranching = BRANCHING_TYPES.includes(question.QuestionType);

  const update = (key, val) => onUpdate({ ...question, [key]: val });

  return (
    <div className="border border-border rounded-lg bg-white overflow-hidden mb-2">
      {/* Header row */}
      <div className="bg-surface px-3 py-2 flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp}   disabled={isFirst}  className="text-gray-300 hover:text-gray-500 disabled:opacity-30 text-[9px] leading-none">▲</button>
          <button onClick={onMoveDown} disabled={isLast}   className="text-gray-300 hover:text-gray-500 disabled:opacity-30 text-[9px] leading-none">▼</button>
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

      {/* Options */}
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
                  const opts = [...(question.Options || [])]; opts[oi] = e.target.value;
                  update('Options', opts);
                }}
              />
              <button
                onClick={() => update('Options', (question.Options || []).filter((_, j) => j !== oi))}
                className="text-red-400 hover:text-red-600 text-[11px]"
              >✕</button>
            </div>
          ))}
          <button onClick={() => update('Options', [...(question.Options || []), ''])}
            className="text-[11px] text-blue-500 hover:text-blue-700 font-medium">+ Add option</button>
        </div>
      )}

      {/* Footer: Required + Logic toggle */}
      <div className="px-10 py-2 border-t border-border bg-surface flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-gray-600">
          <input type="checkbox" checked={!!question.IsRequired}
            onChange={e => update('IsRequired', e.target.checked)} className="rounded" />
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
            {question.ConditionalLogic?.rules?.length ? ` (${question.ConditionalLogic.rules.length} rule${question.ConditionalLogic.rules.length > 1 ? 's' : ''})` : ''}
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

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function FormBuilderModal({ initialData, onClose, onSaved }) {
  const { user } = useAuth();
  const isEdit = !!initialData?.ID;

  const [form, setForm]     = useState(isEdit
    ? { ...blankForm(), ...initialData, EventDate: toLocalDateStr(initialData.EventDate) }
    : blankForm());
  const [sections, setSections] = useState([blankSection('Section 1')]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [showBank, setShowBank] = useState(null); // null | sectionLocalId
  const fileRef = useRef(null);

  const sf  = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const sfn = e => sf(e.target.name, e.target.value);

  // ── Load existing data ───────────────────────────────────────────────────

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    Promise.all([
      regFormService.loadSections({ FormID: initialData.ID }),
      regFormService.loadQuestions({ FormID: initialData.ID }),
    ]).then(([sRes, qRes]) => {
      const dbSections = sRes?.data?.data ?? [];
      const dbQuestions = (qRes?.data?.data ?? []).map(q => ({
        ...q,
        _key: nextLocalId(),
        Options: q.Options ? (typeof q.Options === 'string' ? JSON.parse(q.Options) : q.Options) : [],
        ConditionalLogic: q.ConditionalLogic ? (typeof q.ConditionalLogic === 'string' ? JSON.parse(q.ConditionalLogic) : q.ConditionalLogic) : null,
        IsRequired: !!q.IsRequired,
        SectionLocalId: q.SectionID, // reuse DB id as localId for edit mode
      }));

      if (dbSections.length) {
        const built = dbSections.map(s => ({
          localId: s.ID,  // use DB id as localId
          title: s.Title,
          questions: dbQuestions.filter(q => q.SectionID === s.ID),
        }));
        setSections(built);
      } else {
        // Legacy: no sections — put all questions in one section
        setSections([{ localId: nextLocalId(), title: 'Section 1', questions: dbQuestions }]);
      }
    }).catch(() => toast.error('Failed to load form data'))
      .finally(() => setLoading(false));
  }, [isEdit, initialData?.ID]);

  // ── Section helpers ──────────────────────────────────────────────────────

  const addSection = () => setSections(p => [...p, blankSection(`Section ${p.length + 1}`)]);

  const removeSection = (localId) => {
    if (sections.length <= 1) { toast.error('A form must have at least one section'); return; }
    // Move orphaned questions to first remaining section
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

  // ── Question helpers (scoped to section) ─────────────────────────────────

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

  // ── Import from bank ─────────────────────────────────────────────────────

  const importFromBank = (bankQuestions) => {
    if (!showBank) return;
    const targetId = showBank;
    const target   = sections.find(s => s.localId === targetId);
    const existing = new Set((target?.questions ?? []).filter(q => q.BankID).map(q => q.BankID));

    const toAdd = bankQuestions
      .filter(bq => !existing.has(bq.ID))
      .map(bq => ({
        ...blankQuestion(),
        BankID: bq.ID,
        SectionLocalId: targetId,
        QuestionText: bq.QuestionText,
        QuestionType: bq.QuestionType,
        Options: bq.Options ? (typeof bq.Options === 'string' ? JSON.parse(bq.Options) : bq.Options) : [],
        IsRequired: !!bq.IsRequired,
      }));

    setSections(p => p.map(s =>
      s.localId === targetId ? { ...s, questions: [...s.questions, ...toAdd] } : s
    ));
    setShowBank(null);
  };

  // ── Header image ─────────────────────────────────────────────────────────

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) { toast.error('Select an image file'); return; }
    const reader = new FileReader();
    reader.onload = ev => sf('HeaderImage', ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const save = async (publishAfter = false) => {
    if (!form.Title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      let formId = initialData?.ID;
      const payload = {
        ...form,
        AgeMin: form.AgeMin || 0,
        AgeMax: form.AgeMax || 0,
        Status: publishAfter ? 'published' : form.Status,
        CreatedBy: user?.username,
      };

      if (isEdit) {
        await regFormService.updateForm({ ...payload, ID: formId });
      } else {
        const res = await regFormService.addForm(payload);
        formId = res?.data?.data?.insertId;
      }

      if (formId) {
        // Flatten all questions with their SectionLocalId
        const allQuestions = sections.flatMap(s =>
          s.questions.map(q => ({ ...q, SectionLocalId: s.localId }))
        );
        const sectionPayloads = sections.map((s, i) => ({
          localId: s.localId,
          title: s.title || `Section ${i + 1}`,
          sortOrder: i,
        }));

        await regFormService.saveFormData({
          FormID: formId,
          sections: sectionPayloads,
          questions: allQuestions,
        });
      }

      toast.success(publishAfter ? 'Form published!' : isEdit ? 'Form updated' : 'Form saved');
      onSaved?.();
    } catch { toast.error('Failed to save form'); }
    finally { setSaving(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const totalQuestions = sections.reduce((n, s) => n + s.questions.length, 0);

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={isEdit ? `Build Form — ${initialData.Title}` : 'Create New Form'}
        size="full"
        footer={
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="btn btn-secondary" onClick={() => save(false)} disabled={saving}>
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            {(form.Status === 'draft' || !isEdit) && (
              <button className="btn btn-primary" onClick={() => save(true)} disabled={saving}>
                {saving ? '…' : 'Publish ▶'}
              </button>
            )}
          </div>
        }
      >
        {loading ? (
          <p className="text-center text-gray-400 py-8 text-[12px]">Loading…</p>
        ) : (
          <>
            {/* Header Image */}
            <div className="mb-4">
              <label className="form-label">Header Image (optional)</label>
              {form.HeaderImage ? (
                <div className="relative">
                  <img src={form.HeaderImage} alt="header" className="w-full h-28 object-cover rounded-lg border border-border" />
                  <button onClick={() => sf('HeaderImage', '')}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold hover:bg-red-600">✕</button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center gap-2
                             text-gray-400 text-[12px] hover:border-blue-400 hover:text-blue-500 transition-colors">
                  🖼 Click to upload header image
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>

            {/* Form Details */}
            <div className="bg-surface rounded-lg p-4 mb-4">
              <p className="text-[11px] font-bold text-navy-700 uppercase tracking-wider mb-3">Form Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="form-label">Title *</label>
                  <input name="Title" value={form.Title} onChange={sfn} className="form-input" placeholder="Ashara 1446 Registration" />
                </div>
                <div>
                  <label className="form-label">Event Name</label>
                  <input name="EventName" value={form.EventName} onChange={sfn} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Event Date</label>
                  <input name="EventDate" type="date" value={form.EventDate} onChange={sfn} className="form-input" />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">Announcement / Description (shown before questions)</label>
                  <textarea name="Description" value={form.Description} onChange={sfn} rows={3}
                    className="form-input h-auto py-2 resize-none"
                    placeholder="Instructions, details, or announcements shown on the first screen." />
                </div>
                <div>
                  <label className="form-label">Min Age (0 = no limit)</label>
                  <input name="AgeMin" type="number" min="0" value={form.AgeMin} onChange={sfn} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Max Age (0 = no limit)</label>
                  <input name="AgeMax" type="number" min="0" value={form.AgeMax} onChange={sfn} className="form-input" />
                </div>
                <div className="col-span-2">
                  <label className="form-label">After Submit Message <span className="text-gray-400 font-normal">(shown on success screen)</span></label>
                  <textarea name="AfterSubmitMessage" value={form.AfterSubmitMessage} onChange={sfn} rows={2}
                    className="form-input h-auto py-2 resize-none"
                    placeholder="e.g. Jazakallah! Your registration has been recorded." />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Form Closed Message <span className="text-gray-400 font-normal">(shown when form is not accepting responses)</span></label>
                  <textarea name="ClosedMessage" value={form.ClosedMessage} onChange={sfn} rows={2}
                    className="form-input h-auto py-2 resize-none"
                    placeholder="e.g. Registrations are now closed. Please contact the admin for assistance." />
                </div>
              </div>
            </div>

            {/* Sections */}
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

                    {/* Questions in this section */}
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

                    {/* Logic summary for this section */}
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
          </>
        )}
      </Modal>

      {showBank && (
        <QuestionBankModal
          onClose={() => setShowBank(null)}
          onImport={importFromBank}
        />
      )}
    </>
  );
}
