'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { regFormService, memberService } from '@/services';
import toast from 'react-hot-toast';
import Modal from '@/components/shared/Modal';
import { ELIGIBILITY_CONFIG } from '@/utils/eligibilityConfig';
import { blankForm, blankSection, blankQuestion, nextLocalId, toLocalDateStr } from './formBuilderUtils';
import FormDetailsSection from './FormDetailsSection';
import EligibilitySection from './EligibilitySection';
import SectionsBuilder from './SectionsBuilder';
import QuestionBankModal from './QuestionBankModal';

export default function FormBuilderModal({ initialData, onClose, onSaved }) {
  const { user } = useAuth();
  const isEdit   = !!initialData?.ID;

  // ── Form metadata state ──────────────────────────────────────────────────

  const [form, setForm] = useState(isEdit
    ? {
        ...blankForm(), ...initialData,
        EventDate: toLocalDateStr(initialData.EventDate),
        EligibilityRules: initialData.EligibilityRules
          ? (typeof initialData.EligibilityRules === 'string'
              ? JSON.parse(initialData.EligibilityRules)
              : initialData.EligibilityRules)
          : null,
      }
    : blankForm());

  const sf  = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const sfn = e => sf(e.target.name, e.target.value);
  const er  = form.EligibilityRules || {};
  const setEr = (key, val) => sf('EligibilityRules', { ...(form.EligibilityRules || {}), [key]: val });

  // ── Sections + questions state ────────────────────────────────────────────

  const [sections, setSections] = useState([blankSection('Section 1')]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [showBank, setShowBank] = useState(null); // null | sectionLocalId

  // ── Mohalla / sector options ──────────────────────────────────────────────

  const [mohallaList, setMohallaList] = useState([]);

  useEffect(() => {
    memberService.loadMohallaDetails({ Sector: '', Subsector: '', MohallaDescription: '' })
      .then(res => {
        const list = res?.data?.data ?? res?.data ?? [];
        setMohallaList(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, []);

  const sectorOptions = useMemo(
    () => [...new Set(mohallaList.map(m => m.Sector ?? '').filter(Boolean))].sort(),
    [mohallaList]
  );

  const mohallaOptions = useMemo(() => {
    const selectedSectors = form.EligibilityRules?.sectors ?? [];
    return [...new Set(
      mohallaList
        .filter(m => !selectedSectors.length || selectedSectors.includes(m.Sector ?? ''))
        .map(m => {
          const sub  = (m.Subsector ?? '').trim();
          const desc = (m.MohallaDescription ?? '').trim();
          return sub && desc ? `${sub} - ${desc}` : (sub || desc);
        })
        .filter(Boolean)
    )].sort();
  }, [mohallaList, form.EligibilityRules?.sectors]);

  // ── Header image ──────────────────────────────────────────────────────────

  const fileRef = useRef(null);
  const RECOMMENDED_W = 1600;
  const RECOMMENDED_H = 200;
  const [imgWarning, setImgWarning] = useState(''); // '' | 'ok' | warning text

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) { toast.error('Select an image file'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      // Check actual pixel dimensions before committing
      const img = new window.Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (w === RECOMMENDED_W && h === RECOMMENDED_H) {
          setImgWarning('ok');
        } else {
          setImgWarning(
            `Uploaded image is ${w} × ${h} px. ` +
            `For best results use ${RECOMMENDED_W} × ${RECOMMENDED_H} px.`
          );
        }
        sf('HeaderImage', dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // ── Load existing form data ───────────────────────────────────────────────

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    Promise.all([
      regFormService.loadSections({ FormID: initialData.ID }),
      regFormService.loadQuestions({ FormID: initialData.ID }),
    ]).then(([sRes, qRes]) => {
      const dbSections  = sRes?.data?.data ?? [];
      const dbQuestions = (qRes?.data?.data ?? []).map(q => ({
        ...q,
        _key: nextLocalId(),
        Options: q.Options
          ? (typeof q.Options === 'string' ? JSON.parse(q.Options) : q.Options)
          : [],
        ConditionalLogic: q.ConditionalLogic
          ? (typeof q.ConditionalLogic === 'string' ? JSON.parse(q.ConditionalLogic) : q.ConditionalLogic)
          : null,
        IsRequired: !!q.IsRequired,
        PerMember: !!q.PerMember,
        SectionLocalId: q.SectionID,
      }));

      if (dbSections.length) {
        setSections(dbSections.map(s => ({
          localId:   s.ID,
          title:     s.Title,
          questions: dbQuestions.filter(q => q.SectionID === s.ID),
        })));
      } else {
        setSections([{ localId: nextLocalId(), title: 'Section 1', questions: dbQuestions }]);
      }
    }).catch(() => toast.error('Failed to load form data'))
      .finally(() => setLoading(false));
  }, [isEdit, initialData?.ID]);

  // ── Import from bank ──────────────────────────────────────────────────────

  const importFromBank = (bankQuestions) => {
    if (!showBank) return;
    const targetId = showBank;
    const existing = new Set(
      (sections.find(s => s.localId === targetId)?.questions ?? [])
        .filter(q => q.BankID).map(q => q.BankID)
    );
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

  // ── Save ──────────────────────────────────────────────────────────────────

  const save = async (publishAfter = false) => {
    if (!form.Title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      let formId = initialData?.ID;

      // Strip empty eligibility rules before saving
      const rawEr     = form.EligibilityRules || {};
      const cleanRules = {};
      ELIGIBILITY_CONFIG.forEach(field => {
        if (field.type === 'age-range') return;
        const val = rawEr[field.key];
        if (Array.isArray(val) ? val.length > 0 : !!val) cleanRules[field.key] = val;
      });

      const payload = {
        ...form,
        AgeMin:           form.AgeMin || 0,
        AgeMax:           form.AgeMax || 0,
        Status:           publishAfter ? 'published' : form.Status,
        CreatedBy:        user?.username,
        EligibilityRules: Object.keys(cleanRules).length ? JSON.stringify(cleanRules) : null,
      };

      if (isEdit) {
        await regFormService.updateForm({ ...payload, ID: formId });
      } else {
        const res = await regFormService.addForm(payload);
        formId = res?.data?.data?.insertId;
      }

      if (formId) {
        const allQuestions    = sections.flatMap(s => s.questions.map(q => ({ ...q, SectionLocalId: s.localId })));
        const sectionPayloads = sections.map((s, i) => ({ localId: s.localId, title: s.title || `Section ${i + 1}`, sortOrder: i }));
        await regFormService.saveFormData({ FormID: formId, sections: sectionPayloads, questions: allQuestions });
      }

      toast.success(publishAfter ? 'Form published!' : isEdit ? 'Form updated' : 'Form saved');
      onSaved?.();
    } catch {
      toast.error('Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

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
                <div className="space-y-2">
                  <div className="relative">
                    <img src={form.HeaderImage} alt="header" className="w-full h-[200px] object-fill rounded-lg border border-border" />
                    <button
                      onClick={() => { sf('HeaderImage', ''); setImgWarning(''); }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold hover:bg-red-600"
                    >✕</button>
                  </div>
                  {/* Dimension feedback */}
                  {imgWarning === 'ok' ? (
                    <p className="text-[11px] text-green-600 flex items-center gap-1">
                      ✓ Image dimensions match the recommended size.
                    </p>
                  ) : imgWarning ? (
                    <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex items-start gap-1.5">
                      <span className="shrink-0 font-bold">⚠</span>
                      {imgWarning}
                    </p>
                  ) : null}
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1
                             text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  <span className="text-[13px]">🖼 Click to upload header image</span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    Recommended size: {RECOMMENDED_W} × {RECOMMENDED_H} px
                  </span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>

            <FormDetailsSection form={form} sf={sf} sfn={sfn} />

            <EligibilitySection
              er={er}
              setEr={setEr}
              form={form}
              sfn={sfn}
              sectorOptions={sectorOptions}
              mohallaOptions={mohallaOptions}
            />

            <SectionsBuilder
              sections={sections}
              setSections={setSections}
              setShowBank={setShowBank}
              sectorOptions={sectorOptions}
            />
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
