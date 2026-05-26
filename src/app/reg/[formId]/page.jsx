'use client';
import { useState, useEffect, useRef, use } from 'react';
import { regFormPublic, memberService } from '@/services';
import { ELIGIBILITY_CONFIG } from '@/utils/eligibilityConfig';
import toast from 'react-hot-toast';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d)) return '';
  return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const parseJson = (v, fallback) => {
  if (!v) return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
};


const buildPrefill = (questions, m, lookupMode, lookupVal) => {
  if (!m) return {};
  const map = {};
  questions.forEach(q => {
    const t = q.QuestionText.toLowerCase().replace(/[^a-z0-9 ]/g, '');
    if (/\b(full\s?name|name)\b/.test(t))                          map[q.ID] = m.FullName || m.Full_Name || '';
    if (/\b(mobile|phone|whatsapp|contact)\b/.test(t))             map[q.ID] = m.Mobile || '';
    if (/\b(sector)\b/.test(t))                                    map[q.ID] = m.Sector || '';
    if (/\b(its|itsno|its\s?no|its\s?number)\b/.test(t))          map[q.ID] = String(m.ITSNo || m.ITS_ID || (lookupMode === 'itsno' ? lookupVal : '') || '');
    if (/\b(acc\s?no|accno|account\s?no|account\s?number)\b/.test(t))
      map[q.ID] = String(m.AccNo || (lookupMode === 'accno' ? lookupVal : '') || '');
    if (/\b(mohallah|mohalla|locality)\b/.test(t))                 map[q.ID] = m.MohallaDescription || '';
  });
  return map;
};

// ─── Question renderer ────────────────────────────────────────────────────────

function QuestionInput({ question, value, onChange }) {
  const opts = parseJson(question.Options, []);
  switch (question.QuestionType) {
    case 'textarea':
      return <textarea rows={3} value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Your answer…"
        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none" />;
    case 'number':
      return <input type="number" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="0"
        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />;
    case 'date':
      return <input type="date" value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-blue-500" />;
    case 'yesno':
      return (
        <div className="flex gap-6 pt-1">
          {['Yes', 'No'].map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-700 select-none">
              <input type="radio" name={`q_${question.ID}`} value={opt}
                checked={value === opt} onChange={() => onChange(opt)} className="accent-blue-600 w-4 h-4" />
              {opt}
            </label>
          ))}
        </div>
      );
    case 'radio':
      return (
        <div className="space-y-2 pt-1">
          {opts.filter(Boolean).map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-700 select-none">
              <input type="radio" name={`q_${question.ID}`} value={opt}
                checked={value === opt} onChange={() => onChange(opt)} className="accent-blue-600 w-4 h-4" />
              {opt}
            </label>
          ))}
        </div>
      );
    case 'select':
      return (
        <select value={value || ''} onChange={e => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-blue-500 bg-white">
          <option value="">Select an option…</option>
          {opts.filter(Boolean).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    case 'checkbox': {
      const checked = value ? value.split('|') : [];
      return (
        <div className="space-y-2 pt-1">
          {opts.filter(Boolean).map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-700 select-none">
              <input type="checkbox" checked={checked.includes(opt)} className="rounded accent-blue-600 w-4 h-4"
                onChange={() => {
                  const next = checked.includes(opt) ? checked.filter(v => v !== opt) : [...checked, opt];
                  onChange(next.join('|'));
                }} />
              {opt}
            </label>
          ))}
        </div>
      );
    }
    default:
      return <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Your answer…"
        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />;
  }
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ visited, total }) {
  if (total <= 1) return null;
  const pct = Math.round((visited / total) * 100);
  return (
    <div className="h-1 bg-gray-200">
      <div className="h-1 bg-blue-500 transition-all duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublicFormPage({ params }) {
  const { formId } = use(params);

  const [form, setForm]           = useState(null);
  const [sections, setSections]   = useState([]); // [{ID, Title, SortOrder, questions:[...]}]
  const [loadErr, setLoadErr]     = useState('');
  const [loading, setLoading]     = useState(true);

  // step: 'announce' | 'verify' | 'form' | 'done'
  const [step, setStep] = useState('announce');

  // Verify
  const [lookupMode, setLookupMode]   = useState('accno');
  const [lookupVal, setLookupVal]     = useState('');
  const [verifyCode, setVerifyCode]   = useState('');
  const [looking, setLooking]         = useState(false);
  const [memberData, setMemberData]   = useState(null);
  const [verifyError, setVerifyError] = useState('');
  const [notFoundMode, setNotFoundMode] = useState(false);
  const verifyInputRef = useRef(null);

  useEffect(() => {
    if (memberData) verifyInputRef.current?.focus();
  }, [memberData]);

  // Multi-section navigation
  const [sectionIdx, setSectionIdx]     = useState(0);   // index in `sections`
  const [sectionHistory, setSectionHistory] = useState([]); // stack of previous indices (for Back)

  // Answers + submission
  const [answers, setAnswers]                   = useState({});
  const [submitting, setSubmitting]             = useState(false);
  const [existingResponseId, setExistingResponseId] = useState(null);

  // ── Load form, sections, questions ───────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const [fRes, sRes, qRes] = await Promise.all([
          regFormPublic.getForm({ ID: formId }),
          regFormPublic.getSections({ FormID: formId }),
          regFormPublic.getQuestions({ FormID: formId }),
        ]);

        const f = fRes?.data?.data;
        if (!f) { setLoadErr('Form not found.'); return; }
        if (f.Status !== 'published') {
          setLoadErr(f.ClosedMessage?.trim() || 'This form is not currently accepting responses.');
          return;
        }
        setForm(f);

        const dbSections = sRes?.data?.data ?? [];
        const allQs = (qRes?.data?.data ?? []).map(q => ({
          ...q,
          Options: parseJson(q.Options, []),
          ConditionalLogic: parseJson(q.ConditionalLogic, null),
          IsRequired: !!q.IsRequired,
        })).sort((a, b) => (a.SortOrder ?? 0) - (b.SortOrder ?? 0));

        if (dbSections.length) {
          const built = dbSections
            .sort((a, b) => (a.SortOrder ?? 0) - (b.SortOrder ?? 0))
            .map(s => ({ ...s, questions: allQs.filter(q => q.SectionID === s.ID) }));
          setSections(built);
        } else {
          // No sections → all questions in one implicit section
          setSections([{ ID: null, Title: null, questions: allQs }]);
        }
      } catch { setLoadErr('Failed to load form. Please try again.'); }
      finally { setLoading(false); }
    })();
  }, [formId]);

  // ── Member lookup ─────────────────────────────────────────────────────────

  const doLookup = async () => {
    const val = lookupVal.trim();
    if (!val) { toast.error('Please enter a value'); return; }
    setLooking(true);
    setVerifyError('');
    setMemberData(null);
    setNotFoundMode(false);
    try {
      let m = null;
      if (lookupMode === 'accno') {
        const res  = await memberService.loadMuminDetails({ AccNo: val });
        const list = res?.data?.data ?? res?.data;
        m = Array.isArray(list) ? list[0] : list;
      } else {
        const res  = await memberService.loadFamilyMembersDetails({ ITS_ID: val });
        const list = res?.data?.data ?? res?.data;
        m = Array.isArray(list) ? list[0] : list;
      }
      if (!m) {
        setVerifyError(lookupMode === 'accno'
          ? 'Member not found for this Acc No.'
          : 'ITS not found. You may continue as an outside member.');
        setNotFoundMode(true);
        return;
      }
      setMemberData(m);
    } catch { setVerifyError('Lookup failed. Please try again.'); }
    finally { setLooking(false); }
  };

  // ── Proceed to form after verify ─────────────────────────────────────────

  const proceedToForm = async (m, accNo, itsNo) => {
    if (m) {
      const rules = parseJson(form.EligibilityRules, null) ?? {};
      const errors = [];
      ELIGIBILITY_CONFIG.forEach(field => {
        const msg = field.validate(rules, m, form);
        if (msg) errors.push(msg);
      });
      if (errors.length) { setVerifyError(errors.join(' ')); return; }
    }

    // Duplicate check
    const dupRes = await regFormPublic.checkDup({ FormID: formId, AccNo: accNo || null, ITSNo: itsNo || null });
    const dup    = dupRes?.data?.data;

    let prefill = {};
    if (dup?.duplicate) {
      setExistingResponseId(dup.ResponseID);
      try {
        const editRes = await regFormPublic.loadForEdit({ FormID: formId, AccNo: accNo || null, ITSNo: itsNo || null });
        (editRes?.data?.data ?? []).forEach(row => { if (row.QuestionID) prefill[row.QuestionID] = row.AnswerText ?? ''; });
      } catch {}
    }

    // Member-data prefill on empty fields
    const allQs = sections.flatMap(s => s.questions);
    const memberPrefill = buildPrefill(allQs, m, lookupMode, lookupVal.trim());
    Object.entries(memberPrefill).forEach(([qId, val]) => { if (!prefill[qId]) prefill[qId] = val; });

    setAnswers(prefill);
    setSectionIdx(0);
    setSectionHistory([]);
    setStep('form');
  };

  const doVerify = async () => {
    if (!verifyCode.trim()) { setVerifyError('Please enter the verification code'); return; }
    setVerifyError('');
    const m        = memberData;
    const expected = lookupMode === 'accno'
      ? String(m.ITSNo || '').trim()
      : String(m.HOF_ID || '').trim();
    if (!expected || verifyCode.trim() !== expected) {
      setVerifyError('Verification code does not match. Please check and try again.');
      return;
    }
    const accNo = String(m.AccNo || '').trim() || null;
    const itsNo = String(m.ITSNo || m.ITS_ID || '').trim() || null;
    await proceedToForm(m, accNo, itsNo);
  };

  const proceedManually = async () => { await proceedToForm(null, null, null); };

  // ── Section navigation with conditional logic ─────────────────────────────

  const currentSection = sections[sectionIdx] ?? null;

  // Evaluate conditional logic: returns nextSectionIdx or -1 (submit)
  const resolveNextSection = () => {
    if (!currentSection) return -1;

    for (const q of currentSection.questions) {
      const logic = q.ConditionalLogic;
      if (!logic?.rules?.length) continue;
      const ans  = String(answers[q.ID] ?? '').trim();
      const rule = logic.rules.find(r => r.answer === ans)
                ?? logic.rules.find(r => r.answer === '__default__');
      if (!rule) continue;

      if (rule.nextSectionId === 0) return -1; // end form

      if (rule.nextSectionId != null) {
        const idx = sections.findIndex(s => s.ID === rule.nextSectionId);
        if (idx !== -1) return idx;
      }
    }

    // Default: next section in order
    return sectionIdx < sections.length - 1 ? sectionIdx + 1 : -1;
  };

  const goNext = () => {
    // Validate current section required fields
    for (const q of (currentSection?.questions ?? [])) {
      if (q.IsRequired && !String(answers[q.ID] ?? '').trim()) {
        toast.error(`"${q.QuestionText}" is required`);
        return;
      }
    }

    const next = resolveNextSection();
    if (next === -1) {
      submit();
    } else {
      setSectionHistory(h => [...h, sectionIdx]);
      setSectionIdx(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    if (sectionHistory.length > 0) {
      const prev = sectionHistory[sectionHistory.length - 1];
      setSectionHistory(h => h.slice(0, -1));
      setSectionIdx(prev);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setStep('verify');
    }
  };

  // Is this the last reachable section (no further branching leads elsewhere)?
  const isLastSection = resolveNextSection() === -1;

  // ── Submit ────────────────────────────────────────────────────────────────

  const submit = async () => {
    // Only validate sections the user actually visited
    const visitedIndices = new Set([...sectionHistory, sectionIdx]);
    for (const idx of visitedIndices) {
      for (const q of (sections[idx]?.questions ?? [])) {
        if (q.IsRequired && !String(answers[q.ID] ?? '').trim()) {
          toast.error(`"${q.QuestionText}" is required`);
          return;
        }
      }
    }

    const allQs = sections.flatMap(s => s.questions);
    const m     = memberData;
    const accNo = m ? (String(m.AccNo || '').trim() || null) : null;
    const itsNo = m ? (String(m.ITSNo || m.ITS_ID || '').trim() || null) : null;
    const answersArr = allQs.map(q => ({ QuestionID: q.ID, AnswerText: answers[q.ID] ?? '' }));

    setSubmitting(true);
    try {
      if (existingResponseId) {
        const { regFormService: s } = await import('@/services');
        await s.updateResponse({ ResponseID: existingResponseId, answers: answersArr });
      } else {
        await regFormPublic.submit({
          FormID: formId, AccNo: accNo, ITSNo: itsNo,
          RespondentName: m?.FullName || m?.Full_Name || '',
          answers: answersArr,
        });
      }
      setStep('done');
    } catch { toast.error('Submission failed. Please try again.'); }
    finally  { setSubmitting(false); }
  };

  // ── Loading / Error screens ───────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-gray-400 text-[12px]">Loading form…</p>
      </div>
    </div>
  );

  if (loadErr) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-gray-700 font-semibold text-[14px]">{loadErr}</p>
      </div>
    </div>
  );

  const card = "bg-white rounded-2xl shadow-md overflow-hidden max-w-2xl w-full mx-auto";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className={card}>

        {/* Header image */}
        {form.HeaderImage && (
          <img src={form.HeaderImage} alt="header" className="w-full h-40 object-cover" />
        )}

        {/* Title bar */}
        <div className="bg-[#0b1d38] px-6 py-5">
          {form.EventName && (
            <h1 className="text-white font-bold text-[22px] leading-tight">
              {form.EventName}
            </h1>
          )}
          <p className="text-white/90 text-[16px] font-semibold mt-1">{form.Title}</p>
        </div>

        {/* Section progress bar (only during form step) */}
        {step === 'form' && (
          <ProgressBar
            visited={sectionHistory.length + 1}
            total={sections.length}
          />
        )}

        {/* ── Announcement ────────────────────────────────────────────────── */}
        {step === 'announce' && (
          <div className="p-6">
            {form.Description ? (
              <div className="text-gray-700 text-[13px] leading-relaxed whitespace-pre-wrap mb-6">
                {form.Description}
              </div>
            ) : (
              <p className="text-gray-400 text-[13px] mb-6 italic">No announcement.</p>
            )}
            <button onClick={() => setStep('verify')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[14px] py-3 rounded-xl transition-colors">
              Next →
            </button>
          </div>
        )}

        {/* ── Verify identity ──────────────────────────────────────────────── */}
        {step === 'verify' && (
          <div className="p-6 space-y-5">
            <h2 className="text-[15px] font-bold text-gray-800">Verify Your Identity</h2>

            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              {[{ key: 'accno', label: 'By Acc No' }, { key: 'itsno', label: 'By ITS No' }].map(m => (
                <button key={m.key}
                  onClick={() => { setLookupMode(m.key); setLookupVal(''); setMemberData(null); setVerifyError(''); setVerifyCode(''); setNotFoundMode(false); }}
                  className={`flex-1 py-2.5 text-[12px] font-semibold transition-colors ${lookupMode === m.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                  {m.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {lookupMode === 'accno' ? 'Account Number' : 'ITS Number'}
              </label>
              <div className="flex gap-2">
                <input type="text" value={lookupVal}
                  onChange={e => { setLookupVal(e.target.value); setVerifyError(''); setNotFoundMode(false); setMemberData(null); }}
                  onKeyDown={e => e.key === 'Enter' && doLookup()}
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-blue-500"
                  placeholder={lookupMode === 'accno' ? 'e.g. 1001' : 'e.g. 30012345'} />
                <button onClick={doLookup} disabled={looking}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 rounded-xl text-[12px] font-semibold disabled:opacity-50 min-w-[60px]">
                  {looking ? '…' : 'Find'}
                </button>
              </div>
            </div>

            {memberData && !notFoundMode && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                <p className="text-[13px] text-green-700 font-semibold">
                  ✓ Found: {memberData.FullName || memberData.Full_Name}{memberData.Sector ? ` · ${memberData.Sector}` : ''}
                </p>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    {lookupMode === 'accno' ? 'Enter your ITS Number to verify' : 'Enter your HOF ID to verify'}
                  </label>
                  <input ref={verifyInputRef} type="text" value={verifyCode}
                    onChange={e => { setVerifyCode(e.target.value); setVerifyError(''); }}
                    onKeyDown={e => e.key === 'Enter' && doVerify()}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-blue-500"
                    placeholder="Verification code…" />
                </div>
                <button onClick={doVerify}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[13px] py-2.5 rounded-xl transition-colors">
                  Verify &amp; Continue →
                </button>
              </div>
            )}

            {notFoundMode && (
              Number(form.AllowOutsideRegistration) === 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-[12px] text-red-700 font-semibold">
                    ⚠️ {lookupMode === 'accno' ? 'No member found for this Acc No.' : 'ITS not found in the system.'}
                  </p>
                  <p className="text-[12px] text-red-600 mt-1">
                    Registration is restricted to registered members only. Please verify your {lookupMode === 'accno' ? 'Acc No' : 'ITS No'} and try again.
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <p className="text-[12px] text-amber-800 font-semibold">
                    {lookupMode === 'accno' ? '⚠️ No member found for this Acc No.' : '⚠️ ITS not found in the system.'}
                  </p>
                  <p className="text-[12px] text-amber-700">
                    {lookupMode === 'accno'
                      ? 'You can continue and fill the form manually without an account.'
                      : 'You may continue as an outside member and fill the form manually.'}
                  </p>
                  <button onClick={proceedManually}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[13px] py-2.5 rounded-xl transition-colors">
                    {lookupMode === 'accno' ? 'Continue without Acc No →' : 'Continue as Outside Member →'}
                  </button>
                </div>
              )
            )}

            {verifyError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-[12px] rounded-xl px-4 py-3">{verifyError}</div>
            )}

            <button onClick={() => setStep('announce')} className="text-[12px] text-gray-400 hover:text-gray-600">← Back</button>
          </div>
        )}

        {/* ── Form (section by section) ────────────────────────────────────── */}
        {step === 'form' && currentSection && (
          <div className="p-6 space-y-6">
            {existingResponseId && sectionIdx === 0 && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 text-[12px] rounded-xl px-4 py-3">
                You are already registered. Your previous answers are pre-filled — update them if needed.
              </div>
            )}

            {/* Section title (only if multi-section and has a title) */}
            {sections.length > 1 && currentSection.Title && (
              <div className="border-b border-gray-100 pb-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                  Section {sectionIdx + 1} of {sections.length}
                </p>
                <h2 className="text-[15px] font-bold text-gray-800">{currentSection.Title}</h2>
              </div>
            )}

            {/* Questions */}
            {currentSection.questions.length === 0 ? (
              <p className="text-gray-400 text-[13px] text-center py-4">No questions in this section.</p>
            ) : (
              currentSection.questions.map((q, i) => (
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

            {/* Navigation */}
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
                    ? (existingResponseId ? 'Update Registration' : 'Submit Registration')
                    : 'Next →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Done ─────────────────────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="p-10 text-center space-y-4">
            <div className="text-5xl">✅</div>
            <h2 className="text-[18px] font-bold text-gray-800">
              {existingResponseId ? 'Registration Updated!' : 'Registration Submitted!'}
            </h2>
            {form.AfterSubmitMessage?.trim() ? (
              <p className="text-gray-700 text-[14px] leading-relaxed whitespace-pre-wrap">
                {form.AfterSubmitMessage}
              </p>
            ) : (
              <p className="text-gray-500 text-[13px]">
                Thank you{memberData?.FullName ? `, ${memberData.FullName}` : ''}.
                <br />Your registration for <strong>{form.EventName || form.Title}</strong> has been saved.
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
