'use client';
import { useState, useEffect, useRef, use } from 'react';
import { regFormPublic } from '@/services';
import { ELIGIBILITY_CONFIG } from '@/utils/eligibilityConfig';
import toast from 'react-hot-toast';

import { parseJson, memberKey, buildPrefill } from './_components/helpers';
import ProgressBar   from './_components/ProgressBar';
import AnnounceStep  from './_components/AnnounceStep';
import VerifyStep    from './_components/VerifyStep';
import FamilyStep    from './_components/FamilyStep';
import FormStep      from './_components/FormStep';
import DoneStep      from './_components/DoneStep';

export default function PublicFormPage({ params }) {
  const { formId } = use(params);

  const [form, setForm]         = useState(null);
  const [sections, setSections] = useState([]);
  const [loadErr, setLoadErr]   = useState('');
  const [loading, setLoading]   = useState(true);

  // step: 'announce' | 'verify' | 'family' | 'form' | 'done'
  const [step, setStep] = useState('announce');

  // Verify
  const [lookupMode, setLookupMode]     = useState('accno');
  const [lookupVal, setLookupVal]       = useState('');
  const [verifyCode, setVerifyCode]     = useState('');
  const [looking, setLooking]           = useState(false);
  const [memberData, setMemberData]     = useState(null);
  const [verifyError, setVerifyError]   = useState('');
  const [notFoundMode, setNotFoundMode] = useState(false);
  const verifyInputRef = useRef(null);

  useEffect(() => {
    if (memberData) verifyInputRef.current?.focus();
  }, [memberData]);

  // Family registration
  const [familyLoading, setFamilyLoading]                         = useState(false);
  const [familyMembers, setFamilyMembers]                         = useState([]);
  const [selectedKeys, setSelectedKeys]                           = useState(new Set());
  const [outsideMembers, setOutsideMembers]                       = useState([]); // { Name, ITSNo, _responseId? }
  const [removedOutsideResponseIds, setRemovedOutsideResponseIds] = useState(new Set());
  const [memberResponseIds, setMemberResponseIds]                 = useState({}); // { memberKey: ResponseID }
  const [alreadyRegisteredKeys, setAlreadyRegisteredKeys]         = useState(new Set());
  const [submitResult, setSubmitResult]                           = useState(null);
  const [perMemberAnswers, setPerMemberAnswers]                   = useState({});

  // Multi-section navigation
  const [sectionIdx, setSectionIdx]         = useState(0);
  const [sectionHistory, setSectionHistory] = useState([]);

  // Answers + submission
  const [answers, setAnswers]                       = useState({});
  const [submitting, setSubmitting]                 = useState(false);
  const [existingResponseId, setExistingResponseId] = useState(null);

  // ── Load form + sections + questions ───────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const fRes = await regFormPublic.getFormByToken(formId);
        const f = fRes?.data?.data;
        if (!f) { setLoadErr('Form not found.'); setLoading(false); return; }
        if (f.Status !== 'published') {
          setLoadErr(f.ClosedMessage?.trim() || 'This form is not currently accepting responses.');
          setLoading(false);
          return;
        }
        setForm(f);

        const [sRes, qRes] = await Promise.all([
          regFormPublic.getSections({ FormID: f.ID }),
          regFormPublic.getQuestions({ FormID: f.ID }),
        ]);

        const dbSections = sRes?.data?.data ?? [];
        const allQs = (qRes?.data?.data ?? []).map(q => ({
          ...q,
          Options: parseJson(q.Options, []),
          ConditionalLogic: parseJson(q.ConditionalLogic, null),
          IsRequired: !!q.IsRequired,
          PerMember: !!q.PerMember,
        })).sort((a, b) => (a.SortOrder ?? 0) - (b.SortOrder ?? 0));

        if (dbSections.length) {
          const built = dbSections
            .sort((a, b) => (a.SortOrder ?? 0) - (b.SortOrder ?? 0))
            .map(s => ({ ...s, questions: allQs.filter(q => q.SectionID === s.ID) }));
          setSections(built);
        } else {
          setSections([{ ID: null, Title: null, questions: allQs }]);
        }
      } catch { setLoadErr('Failed to load form. Please try again.'); }
      finally { setLoading(false); }
    })();
  }, [formId]);

  // Derived
  const allQuestions   = sections.flatMap(s => s.questions);
  const perMemberQs    = allQuestions.filter(q => q.PerMember);
  const sharedQs       = allQuestions.filter(q => !q.PerMember);
  const sharedSections = sections
    .map(s => ({ ...s, questions: s.questions.filter(q => !q.PerMember) }))
    .filter(s => s.questions.length > 0);

  // ── Eligibility ────────────────────────────────────────────────────────────

  const getIneligibilityReason = (m) => {
    if (!m || !form) return null;
    const rules = parseJson(form.EligibilityRules, null) ?? {};
    for (const field of ELIGIBILITY_CONFIG) {
      const msg = field.validate(rules, m, form);
      if (msg) return msg;
    }
    return null;
  };

  // ── Member lookup ──────────────────────────────────────────────────────────

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
        const res  = await regFormPublic.lookupByAccNo({ AccNo: val });
        const list = res?.data?.data ?? res?.data;
        m = Array.isArray(list) ? list[0] : list;
      } else {
        const res  = await regFormPublic.lookupByITS({ ITS_ID: val });
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

  // ── ITS lookup for no-verify announce step ────────────────────────────────

  const doItsLookup = async () => {
    const val = lookupVal.trim();
    if (!val) return;
    setLooking(true);
    setVerifyError('');
    setMemberData(null);
    setNotFoundMode(false);
    try {
      const res  = await regFormPublic.lookupByITS({ ITS_ID: val });
      const list = res?.data?.data ?? res?.data;
      const m    = Array.isArray(list) ? list[0] : list;
      if (!m) { setVerifyError('ITS not found in the system.'); setNotFoundMode(true); return; }
      setMemberData(m);
    } catch { setVerifyError('Lookup failed. Please try again.'); }
    finally { setLooking(false); }
  };

  const handleAnnounceNext = async () => {
    const m     = memberData;
    const accNo = m ? String(m.AccNo || '').trim() || null : null;
    const itsNo = m ? String(m.ITSNo || m.ITS_ID || '').trim() || null : null;
    await proceedToForm(m, accNo, itsNo, true);
  };

  // ── Proceed to form (individual) ───────────────────────────────────────────

  const proceedToForm = async (m, accNo, itsNo, skipEligibility = false) => {
    if (m && !skipEligibility) {
      const errors = [];
      ELIGIBILITY_CONFIG.forEach(field => {
        const msg = field.validate(parseJson(form.EligibilityRules, null) ?? {}, m, form);
        if (msg) errors.push(msg);
      });
      if (errors.length) { setVerifyError(errors.join(' ')); return; }
    }

    const dupRes = await regFormPublic.checkDup({ FormID: form.ID, AccNo: accNo || null, ITSNo: itsNo || null });
    const dup    = dupRes?.data?.data;
    let prefill  = {};
    if (dup?.duplicate) {
      setExistingResponseId(dup.ResponseID);
      try {
        const editRes = await regFormPublic.loadForEdit({ FormID: form.ID, AccNo: accNo || null, ITSNo: itsNo || null });
        (editRes?.data?.data ?? []).forEach(row => { if (row.QuestionID) prefill[row.QuestionID] = row.AnswerText ?? ''; });
      } catch {}
    }

    const memberPrefill = buildPrefill(allQuestions, m, lookupMode, lookupVal.trim());
    Object.entries(memberPrefill).forEach(([qId, val]) => { if (!prefill[qId]) prefill[qId] = val; });

    setAnswers(prefill);
    setSectionIdx(0);
    setSectionHistory([]);
    setStep('form');
  };

  // ── Proceed to family step ─────────────────────────────────────────────────

  const proceedToFamily = async (m, itsNo) => {
    const reason = getIneligibilityReason(m);
    if (reason) { setVerifyError(reason); return; }

    setFamilyLoading(true);
    try {
      // 1. Load family members from ITS Org
      const hofHOFID = m.HOF_ID || m.LocalHOFITSNo || itsNo || String(m.ITS_ID || m.ITSNo || '').trim();
      const res      = await regFormPublic.lookupByITS({ HOF_ID: hofHOFID });
      const members  = Array.isArray(res?.data?.data ?? res?.data) ? (res?.data?.data ?? res?.data) : [];
      setFamilyMembers(members);

      const hKey = memberKey(m);
      setSelectedKeys(new Set(hKey ? [hKey] : []));
      setRemovedOutsideResponseIds(new Set());

      // 2. Auto-fill per-member answers from ITS Org data (Gender, Age, Misaq, Name, etc.)
      const initPM = {};
      members.forEach(mem => {
        initPM[memberKey(mem)] = buildPrefill(allQuestions, mem, 'accno', String(mem.AccNo || ''));
      });

      // 3. Load ALL existing family responses in a single round-trip (by AccNo)
      const accNo       = String(m.AccNo || '').trim() || null;
      const dupKeys     = new Set();
      const responseIds = {};
      const loadedOutside = []; // previously registered outside/guest members

      if (accNo) {
        try {
          const allRes = await regFormPublic.loadFamilyResponses({ FormID: form.ID, AccNo: accNo });
          const rows   = allRes?.data?.data ?? [];

          // Group rows by ResponseID
          const byResponseId = {};
          rows.forEach(row => {
            if (!byResponseId[row.ResponseID]) {
              byResponseId[row.ResponseID] = {
                ITSNo:         row.ITSNo   || null,
                RespondentName: row.RespondentName || '',
                answers:       {},
              };
            }
            if (row.QuestionID) {
              byResponseId[row.ResponseID].answers[row.QuestionID] = row.AnswerText ?? '';
            }
          });

          // Build ITSNo → { ResponseID, answers } lookup for fast matching
          const byIts = {};
          Object.entries(byResponseId).forEach(([respId, data]) => {
            if (data.ITSNo) byIts[data.ITSNo] = { ResponseID: Number(respId), answers: data.answers };
          });

          // 4. Match responses to ITS Org family members by ITSNo
          const matchedResponseIds = new Set();
          members.forEach(mem => {
            const memIts = String(mem.ITS_ID || mem.ITSNo || '').trim();
            const key    = memberKey(mem);
            if (memIts && byIts[memIts]) {
              dupKeys.add(key);
              responseIds[key] = byIts[memIts].ResponseID;
              matchedResponseIds.add(byIts[memIts].ResponseID);
              // Merge saved answers on top of auto-fill (saved answers take priority)
              initPM[key] = { ...(initPM[key] || {}), ...byIts[memIts].answers };
            }
          });

          // 5. Unmatched responses = outside/guest members from a previous registration
          Object.entries(byResponseId).forEach(([respId, data]) => {
            if (!matchedResponseIds.has(Number(respId))) {
              loadedOutside.push({
                Name:        data.RespondentName,
                ITSNo:       data.ITSNo || '',
                _responseId: Number(respId),
              });
            }
          });
        } catch {}
      }

      setPerMemberAnswers(initPM);
      setAlreadyRegisteredKeys(dupKeys);
      setMemberResponseIds(responseIds);
      setOutsideMembers(loadedOutside);

      // Pre-select already-registered members (kept by default)
      setSelectedKeys(prev => {
        const next = new Set(prev);
        dupKeys.forEach(k => next.add(k));
        return next;
      });

      setStep('family');
    } catch {
      const accNo = String(m.AccNo || '').trim() || null;
      await proceedToForm(m, accNo, itsNo);
    } finally {
      setFamilyLoading(false);
    }
  };

  // ── doVerify ───────────────────────────────────────────────────────────────

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

    if (Number(form?.AllowFamilyRegistration) === 1) {
      await proceedToFamily(m, itsNo);
    } else {
      await proceedToForm(m, accNo, itsNo);
    }
  };

  const proceedManually = async () => { await proceedToForm(null, null, null); };

  // ── Family step helpers ────────────────────────────────────────────────────

  const toggleKey = (key) =>
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  const selectAll = () => {
    const eligibleKeys = familyMembers
      .filter(m => !getIneligibilityReason(m))
      .map(memberKey);
    setSelectedKeys(new Set(eligibleKeys));
  };

  const setPerMemberAnswer = (mKey, qId, val) =>
    setPerMemberAnswers(prev => ({ ...prev, [mKey]: { ...(prev[mKey] || {}), [qId]: val } }));

  const addOutsideMember  = () => setOutsideMembers(prev => [...prev, { Name: '', ITSNo: '' }]);
  const updateOutside = (i, field, val) =>
    setOutsideMembers(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  const removeOutside = (i) => {
    const om = outsideMembers[i];
    // If this outside member was previously registered, track their ResponseID for deletion on submit
    if (om?._responseId) {
      setRemovedOutsideResponseIds(prev => new Set([...prev, om._responseId]));
    }
    setOutsideMembers(prev => prev.filter((_, idx) => idx !== i));
  };

  // All selected family members (including already-registered being kept/updated)
  const selectedFamilyMembers = familyMembers.filter(m => selectedKeys.has(memberKey(m)));
  const selectedOutside = outsideMembers.filter(m => m.Name.trim());
  const selectedCount   = selectedFamilyMembers.length + selectedOutside.length;
  // Members being removed (were registered, now deselected)
  const membersToDelete = familyMembers.filter(
    m => alreadyRegisteredKeys.has(memberKey(m)) && !selectedKeys.has(memberKey(m))
  );

  // ── Family direct submit ───────────────────────────────────────────────────

  const submitFamilyDirect = async () => {
    const totalChanges = selectedCount + membersToDelete.length + removedOutsideResponseIds.size;
    if (totalChanges === 0) { toast.error('No changes to save'); return; }

    // Validate required fields for selected members
    for (const m of selectedFamilyMembers) {
      const key = memberKey(m);
      for (const q of allQuestions) {
        if (q.IsRequired && !String(perMemberAnswers[key]?.[q.ID] ?? '').trim()) {
          toast.error(`"${q.QuestionText}" is required for ${m.Full_Name || m.FullName || 'a member'}`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      let submitted = 0, updated = 0, deleted = 0;

      // Insert or update selected family members
      for (const m of selectedFamilyMembers) {
        const key     = memberKey(m);
        const answers = allQuestions.map(q => ({ QuestionID: q.ID, AnswerText: perMemberAnswers[key]?.[q.ID] ?? '' }));
        const respId  = memberResponseIds[key];
        if (respId) {
          await regFormPublic.updateResponse({ ResponseID: respId, answers });
          updated++;
        } else {
          await regFormPublic.submit({
            FormID: form.ID,
            AccNo:  m.AccNo || null,
            ITSNo:  String(m.ITS_ID || m.ITSNo || '').trim() || null,
            RespondentName: m.Full_Name || m.FullName || '',
            answers,
          });
          submitted++;
        }
      }

      // Outside/guest members — update existing or insert new
      const familyAccNo = memberData?.AccNo ? String(memberData.AccNo).trim() : null;
      for (const om of selectedOutside) {
        if (om._responseId) {
          // Previously registered outside member being kept — update their record
          await regFormPublic.updateResponse({ ResponseID: om._responseId, answers: [] });
          updated++;
        } else {
          // Brand-new outside member — store under the family AccNo so they appear in future edits
          await regFormPublic.submit({
            FormID: form.ID,
            AccNo:  familyAccNo,
            ITSNo:  om.ITSNo?.trim() || null,
            RespondentName: om.Name.trim(),
            answers: [],
          });
          submitted++;
        }
      }

      // Delete outside members that the user removed (had a previous ResponseID)
      for (const respId of removedOutsideResponseIds) {
        await regFormPublic.deleteResponse({ ResponseID: respId });
        deleted++;
      }

      // Delete deselected already-registered members
      for (const m of membersToDelete) {
        const respId = memberResponseIds[memberKey(m)];
        if (respId) { await regFormPublic.deleteResponse({ ResponseID: respId }); deleted++; }
      }

      setSubmitResult({ submitted, updated, deleted });
      setStep('done');
    } catch { toast.error('Submission failed. Please try again.'); }
    finally  { setSubmitting(false); }
  };

  // ── Section navigation ─────────────────────────────────────────────────────

  const currentSharedSection = sharedSections[sectionIdx] ?? null;

  const resolveNextSection = () => {
    if (!currentSharedSection) return -1;
    for (const q of currentSharedSection.questions) {
      const logic = q.ConditionalLogic;
      if (!logic?.rules?.length) continue;
      const ans  = String(answers[q.ID] ?? '').trim();
      const rule = logic.rules.find(r => r.answer === ans)
                ?? logic.rules.find(r => r.answer === '__default__');
      if (!rule) continue;
      if (rule.nextSectionId === 0) return -1;
      if (rule.nextSectionId != null) {
        const idx = sharedSections.findIndex(s => s.ID === rule.nextSectionId);
        if (idx !== -1) return idx;
      }
    }
    return sectionIdx < sharedSections.length - 1 ? sectionIdx + 1 : -1;
  };

  const goNext = () => {
    for (const q of (currentSharedSection?.questions ?? [])) {
      if (q.IsRequired && !String(answers[q.ID] ?? '').trim()) {
        toast.error(`"${q.QuestionText}" is required`); return;
      }
    }
    const next = resolveNextSection();
    if (next === -1) { submit(); }
    else {
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
    } else if (Number(form?.AllowFamilyRegistration) === 1 && familyMembers.length) {
      setStep('family');
    } else if (Number(form?.RequireVerification ?? 1) === 0) {
      setStep('announce');
    } else {
      setStep('verify');
    }
  };

  const isLastSection = resolveNextSection() === -1;

  // ── New Registration — reset all state back to verify step ─────────────────

  const startNewRegistration = () => {
    setStep(Number(form?.RequireVerification ?? 1) === 0 ? 'announce' : 'verify');
    setLookupVal('');
    setVerifyCode('');
    setMemberData(null);
    setVerifyError('');
    setNotFoundMode(false);
    setFamilyMembers([]);
    setSelectedKeys(new Set());
    setOutsideMembers([]);
    setRemovedOutsideResponseIds(new Set());
    setMemberResponseIds({});
    setAlreadyRegisteredKeys(new Set());
    setPerMemberAnswers({});
    setAnswers({});
    setExistingResponseId(null);
    setSubmitResult(null);
    setSectionIdx(0);
    setSectionHistory([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const submit = async () => {
    const visitedIndices = new Set([...sectionHistory, sectionIdx]);
    for (const idx of visitedIndices) {
      for (const q of (sharedSections[idx]?.questions ?? [])) {
        if (q.IsRequired && !String(answers[q.ID] ?? '').trim()) {
          toast.error(`"${q.QuestionText}" is required`); return;
        }
      }
    }

    setSubmitting(true);
    try {
      const m     = memberData;
      const allAnswersArr = allQuestions.map(q => ({ QuestionID: q.ID, AnswerText: answers[q.ID] ?? '' }));

      let accNo          = m ? (String(m.AccNo || '').trim() || null) : null;
      let itsNo          = m ? (String(m.ITSNo || m.ITS_ID || '').trim() || null) : null;
      let respondentName = m ? (m.FullName || m.Full_Name || '') : '';

      // When no member data, pull identity fields out of the form answers
      if (!m) {
        allQuestions.forEach(q => {
          const t   = q.QuestionText.toLowerCase().replace(/[^a-z0-9 ]/g, '');
          const val = String(answers[q.ID] ?? '').trim();
          if (!respondentName && /\b(full\s?name|name)\b/.test(t))                               respondentName = val;
          if (!itsNo          && /\b(its|itsno|its\s?no|its\s?number)\b/.test(t))               itsNo = val || null;
          if (!accNo          && /\b(acc\s?no|accno|account\s?no|account\s?number|sabeel)\b/.test(t)) accNo = val || null;
        });
      }

      if (existingResponseId) {
        const { regFormService: s } = await import('@/services');
        await s.updateResponse({ ResponseID: existingResponseId, answers: allAnswersArr });
      } else {
        await regFormPublic.submit({
          FormID: form.ID, AccNo: accNo, ITSNo: itsNo,
          RespondentName: respondentName,
          answers: allAnswersArr,
        });
      }
      setStep('done');
    } catch { toast.error('Submission failed. Please try again.'); }
    finally  { setSubmitting(false); }
  };

  // ── Loading / Error ────────────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────────

  // Expand card to max-w-7xl for the family table; other steps stay narrow
  const cardMaxW = step === 'family' ? 'max-w-7xl' : 'max-w-2xl';

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-3 sm:px-6">
      <div className={`bg-white rounded-2xl shadow-md overflow-hidden w-full mx-auto transition-[max-width] duration-300 ${cardMaxW}`}>

        {form.HeaderImage && (
          <img src={form.HeaderImage} alt="header" className="w-full h-[200px] object-fill" />
        )}

        <div className="bg-[#0b1d38] px-6 py-5">
          {form.EventName && <h1 className="text-white font-bold text-[22px] leading-tight">{form.EventName}</h1>}
          <p className="text-white/90 text-[16px] font-semibold mt-1">{form.Title}</p>
        </div>

        {step === 'form' && (
          <ProgressBar visited={sectionHistory.length + 1} total={sharedSections.length} />
        )}

        {step === 'announce' && (
          <AnnounceStep
            form={form}
            onNext={Number(form?.RequireVerification ?? 1) === 0
              ? handleAnnounceNext
              : () => setStep('verify')
            }
            itsLookup={Number(form?.RequireVerification ?? 1) === 0 ? {
              lookupVal,
              setLookupVal,
              memberData,
              looking,
              error: notFoundMode ? verifyError : '',
              doLookup: doItsLookup,
              clearState: () => { setVerifyError(''); setNotFoundMode(false); setMemberData(null); },
            } : null}
          />
        )}

        {step === 'verify' && (
          <VerifyStep
            form={form}
            lookupMode={lookupMode}   setLookupMode={setLookupMode}
            lookupVal={lookupVal}     setLookupVal={setLookupVal}
            verifyCode={verifyCode}   setVerifyCode={setVerifyCode}
            looking={looking}         familyLoading={familyLoading}
            memberData={memberData}
            verifyError={verifyError} setVerifyError={setVerifyError}
            notFoundMode={notFoundMode} setNotFoundMode={setNotFoundMode}
            verifyInputRef={verifyInputRef}
            doLookup={doLookup}
            doVerify={doVerify}
            proceedManually={proceedManually}
            onBack={() => setStep('announce')}
          />
        )}

        {step === 'family' && (
          <FamilyStep
            form={form}
            memberData={memberData}
            familyMembers={familyMembers}
            selectedKeys={selectedKeys}
            setSelectedKeys={setSelectedKeys}
            toggleKey={toggleKey}
            selectAll={selectAll}
            alreadyRegisteredKeys={alreadyRegisteredKeys}
            membersToDelete={membersToDelete}
            allQuestions={allQuestions}
            perMemberAnswers={perMemberAnswers}
            setPerMemberAnswer={setPerMemberAnswer}
            getIneligibilityReason={getIneligibilityReason}
            outsideMembers={outsideMembers}
            addOutsideMember={addOutsideMember}
            updateOutside={updateOutside}
            removeOutside={removeOutside}
            removedOutsideCount={removedOutsideResponseIds.size}
            selectedCount={selectedCount}
            onSubmit={submitFamilyDirect}
            submitting={submitting}
            onBack={() => setStep('verify')}
          />
        )}

        {step === 'form' && (
          <FormStep
            form={form}
            currentSharedSection={currentSharedSection}
            sharedSections={sharedSections}
            sectionIdx={sectionIdx}
            existingResponseId={existingResponseId}
            selectedCount={selectedCount}
            answers={answers}
            setAnswers={setAnswers}
            submitting={submitting}
            isLastSection={isLastSection}
            goNext={goNext}
            goBack={goBack}
            submit={submit}
          />
        )}

        {step === 'done' && (
          <DoneStep
            form={form}
            memberData={memberData}
            existingResponseId={existingResponseId}
            submitResult={submitResult}
            onNewRegistration={startNewRegistration}
          />
        )}

      </div>
    </div>
  );
}
