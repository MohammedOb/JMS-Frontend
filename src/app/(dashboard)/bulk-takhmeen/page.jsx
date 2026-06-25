'use client';

// Bulk Takhmeen — add takhmeen in bulk for members who haven't done it yet.
// Loads member list filtered by HubSubHead + ForYear, pre-fills grade/amount
// from a chosen reference year, then saves all selected rows at once.
//
// Components:
//   ConfigPanel  — filters (SubHead, ForYear, CopyFromYear, Date) + grade override
//   MemberTable  — member rows with grade/amount edit + sabeel-type filter

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '@/components/shared/PageHeader';
import { takhmeenService, lookupService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { resolveApiBaseUrl } from '@/lib/api';

import ConfigPanel from './components/ConfigPanel';
import MemberTable from './components/MemberTable';

// ── Shared helpers ─────────────────────────────────────────────────────────────
export const parseYear  = (y) => Number(String(y ?? '').split('-')[0]) || 0;
// Normalise grade strings: strip any "Grade " prefix and whitespace.
// Applied to BOTH the grade table values and history values so they always match.
export const cleanGrade = (g) => String(g ?? '').replace(/^grade\s*/i, '').trim();

const todayStr = () => new Date().toISOString().split('T')[0];

const extractArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data))                 return data;
  if (Array.isArray(data.recordset))       return data.recordset;
  if (Array.isArray(data.recordsets?.[0])) return data.recordsets[0];
  if (Array.isArray(data.data))            return data.data;
  return [];
};

const normalizeNotDoneRow = (r) => ({
  accno:      String(r.AccNo      ?? r.accno      ?? ''),
  fullName:   String(r.FullName   ?? r.fullName   ?? ''),
  sector:     String(r.Sector     ?? r.sector     ?? ''),
  sabeelType: String(r.SabeelType ?? r.sabeelType ?? ''),
});

const normalizeHistRow = (r) => ({
  forYear:  String(r.ForYear  ?? r.forYear  ?? ''),
  grade:    cleanGrade(r.Grade ?? r.grade ?? ''),
  takhmeen: Number(r.Takhmeen ?? r.takhmeen ?? 0),
});

const SAVE_CHUNK = 50; // records per bulk-insert request

// ─────────────────────────────────────────────────────────────────────────────
export default function BulkTakhmeenPage() {
  const { can } = useAuth();

  // ── Filter / config state ─────────────────────────────────────────────────
  const [subHead,      setSubHead]      = useState('');
  const [forYear,      setForYear]      = useState('');  // year to CREATE takhmeen for
  const [refYear,      setRefYear]      = useState('');  // year to COPY grade/amount FROM
  const [takDate,      setTakDate]      = useState(todayStr());
  const [globalGrade,  setGlobalGrade]  = useState('');
  const [sabeelFilter, setSabeelFilter] = useState('');

  // ── Lookup data ───────────────────────────────────────────────────────────
  const [hubHeadOpts, setHubHeadOpts] = useState([]);
  const [gradeOpts,   setGradeOpts]   = useState([]);
  const [forYears,    setForYears]    = useState([]);

  // ── Member rows ───────────────────────────────────────────────────────────
  // rowData[accno] = { grade, amount, lastGrade, lastAmount, lastYear }
  const [allRows,  setAllRows]  = useState([]);
  const [rowData,  setRowData]  = useState({});
  const [selected, setSelected] = useState(new Set());

  // ── UI / async state ──────────────────────────────────────────────────────
  const [loading,     setLoading]     = useState(false);
  const [lastLoading, setLastLoading] = useState(false);
  const [lastDone,    setLastDone]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [progress,    setProgress]    = useState({ done: 0, total: 0, errors: 0 });

  // ── Derived values ────────────────────────────────────────────────────────
  const mainHead = useMemo(
    () => hubHeadOpts.find(o => o.subHead === subHead)?.mainHead || '',
    [subHead, hubHeadOpts]
  );

  const gradeAmountMap = useMemo(() => {
    const m = {};
    gradeOpts.forEach(g => { m[g.value] = Number(g.amount); });
    return m;
  }, [gradeOpts]);

  const hasGrades = gradeOpts.length > 0;

  // Keep a ref so loadMembers can always read the latest gradeOpts values
  // even though it is memoised and doesn't depend on gradeOpts.
  const gradeOptsRef = useRef([]);
  useEffect(() => { gradeOptsRef.current = gradeOpts; }, [gradeOpts]);

  // Years available as "copy from" reference (before selected forYear), newest first
  const refYearOpts = useMemo(() => {
    const pool = forYear
      ? forYears.filter(y => parseYear(y) < parseYear(forYear))
      : forYears;
    return [...pool].sort((a, b) => parseYear(b) - parseYear(a));
  }, [forYears, forYear]);

  const subHeadOpts = useMemo(
    () => [...new Set(hubHeadOpts.map(o => o.subHead))].sort(),
    [hubHeadOpts]
  );

  // Client-side filter by sabeel type
  const filteredRows = useMemo(
    () => sabeelFilter ? allRows.filter(r => r.sabeelType === sabeelFilter) : allRows,
    [allRows, sabeelFilter]
  );

  const sabeelTypes = useMemo(
    () => [...new Set(allRows.map(r => r.sabeelType).filter(Boolean))].sort(),
    [allRows]
  );

  const rowsWithAmount = useMemo(
    () => filteredRows.filter(r => Number(rowData[r.accno]?.amount) > 0),
    [filteredRows, rowData]
  );

  const isAllSel = filteredRows.length > 0 && filteredRows.every(r => selected.has(r.accno));
  const selCount = selected.size;

  // ── Load lookups once on mount ────────────────────────────────────────────
  useEffect(() => {
    takhmeenService.loadHubHeadDetails({ IsActive: 1 })
      .then(res => {
        const seen = new Set();
        const opts = [];
        extractArray(res.data).forEach(r => {
          const key = `${r.HubMainHead}||${r.HubSubHead}`;
          if (!seen.has(key)) { seen.add(key); opts.push({ mainHead: r.HubMainHead, subHead: r.HubSubHead }); }
        });
        setHubHeadOpts(opts);
      })
      .catch(() => {});

    lookupService.getYears()
      .then(res => setForYears(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => {});
  }, []);

  // Auto-set refYear when forYear changes (default = most recent prior year)
  useEffect(() => {
    if (!forYear || !forYears.length) { setRefYear(''); return; }
    const sorted = forYears
      .filter(y => parseYear(y) < parseYear(forYear))
      .sort((a, b) => parseYear(b) - parseYear(a));
    setRefYear(sorted[0] || '');
  }, [forYear, forYears]);

  // Load grade options whenever subHead changes
  useEffect(() => {
    if (!mainHead || !subHead) { setGradeOpts([]); setGlobalGrade(''); return; }
    takhmeenService.loadGradeDetails({ HubMainHead: mainHead, HubSubHead: subHead })
      .then(res => {
        const seen = new Set();
        setGradeOpts(extractArray(res.data).reduce((acc, r) => {
          const value = cleanGrade(r.Grade);
          if (value && !seen.has(value)) {
            seen.add(value);
            acc.push({ value, label: `${value}  ·  ₹${Number(r.Amount).toLocaleString('en-IN')}`, amount: r.Amount });
          }
          return acc;
        }, []));
      })
      .catch(() => setGradeOpts([]));
    setGlobalGrade('');
  }, [mainHead, subHead]);

  // Reset table whenever SubHead or ForYear changes (stale data)
  useEffect(() => {
    setAllRows([]); setRowData({}); setSelected(new Set());
    setLastDone(false); setSabeelFilter('');
  }, [subHead, forYear]);

  // ── Load members + reference-year data ────────────────────────────────────
  const loadMembers = useCallback(async () => {
    if (!subHead || !forYear) { toast.error('Select a sub head and year first'); return; }

    setLoading(true);
    setLastLoading(false);
    setLastDone(false);
    setAllRows([]);
    setRowData({});
    setSelected(new Set());
    setSabeelFilter('');

    // Step 1 — members who haven't done takhmeen yet
    let rows = [];
    try {
      const res = await takhmeenService.loadTakhmeenNotDoneList({ HubSubHead: subHead, ForYear: forYear });
      rows = extractArray(res.data).map(normalizeNotDoneRow).filter(r => r.accno);
      setAllRows(rows);
      const init = {};
      rows.forEach(r => { init[r.accno] = { grade: '', amount: '', lastGrade: null, lastAmount: null, lastYear: '' }; });
      setRowData(init);
    } catch {
      toast.error('Failed to load members');
      setLoading(false);
      return;
    }
    setLoading(false);
    if (rows.length === 0) { setLastDone(true); return; }

    // Step 2 — one bulk query for all reference-year history (replaces N individual calls)
    setLastLoading(true);
    const capturedRefYear = refYear;
    try {
      const res = await takhmeenService.bulkLoadHistory({
        AccNos:     rows.map(r => r.accno),
        HubSubHead: subHead,
      });

      // Group flat history rows by AccNo
      const byAccno = {};
      extractArray(res.data).forEach(h => {
        const acc = String(h.AccNo ?? h.accno ?? '');
        if (!byAccno[acc]) byAccno[acc] = [];
        byAccno[acc].push(normalizeHistRow(h));
      });

      const updates = {};
      rows.forEach(r => {
        const history = byAccno[r.accno] ?? [];

        let match = capturedRefYear
          ? history.find(h => String(h.forYear) === String(capturedRefYear))
          : null;

        if (!match) {
          const prior = history
            .filter(h => h.forYear && parseYear(h.forYear) < parseYear(forYear))
            .sort((a, b) => parseYear(b.forYear) - parseYear(a.forYear));
          match = prior[0] ?? null;
        }
        if (!match) return;

        const rawGrade = cleanGrade(match.grade);
        const amount   = match.takhmeen || '';
        const currentOpts = gradeOptsRef.current;
        const resolved =
          currentOpts.find(g => g.value === rawGrade)?.value ??
          currentOpts.find(g => g.value.toLowerCase() === rawGrade.toLowerCase())?.value ??
          rawGrade;

        updates[r.accno] = { grade: resolved, amount, lastGrade: resolved, lastAmount: amount, lastYear: match.forYear };
      });

      setRowData(prev => {
        const next = { ...prev };
        Object.entries(updates).forEach(([acc, d]) => { next[acc] = { ...next[acc], ...d }; });
        return next;
      });

      // Supplement gradeOpts with any grades found in history but missing from the
      // grade definition table (gradedetail). Use the most recent amount per grade.
      const histGrades = {};
      extractArray(res.data).forEach(h => {
        const g   = cleanGrade(h.Grade ?? h.grade ?? '');
        const amt = Number(h.Takhmeen ?? h.takhmeen ?? 0);
        const yr  = parseYear(h.ForYear ?? h.forYear ?? 0);
        if (g && (!histGrades[g] || yr > histGrades[g].year)) {
          histGrades[g] = { amount: amt, year: yr };
        }
      });
      setGradeOpts(prev => {
        const known  = new Set(prev.map(g => g.value));
        const extras = Object.entries(histGrades)
          .filter(([grade]) => !known.has(grade))
          .map(([grade, { amount }]) => ({
            value:  grade,
            label:  amount > 0
              ? `${grade}  ·  ₹${Number(amount).toLocaleString('en-IN')} (hist.)`
              : grade,
            amount,
          }));
        if (!extras.length) return prev;
        return [...prev, ...extras].sort((a, b) => a.value.localeCompare(b.value));
      });
    } catch {
      // non-critical — member list already shown
    } finally {
      setLastLoading(false);
      setLastDone(true);
    }
  }, [subHead, forYear, refYear]);

  // ── Grade override — apply one grade to all visible (filtered) rows ────────
  const handleApplyGrade = useCallback(() => {
    if (!globalGrade) return;
    const amount = gradeAmountMap[globalGrade] ?? '';
    setRowData(prev => {
      const next = { ...prev };
      filteredRows.forEach(r => { next[r.accno] = { ...next[r.accno], grade: globalGrade, amount }; });
      return next;
    });
    setSelected(prev => {
      const n = new Set(prev);
      filteredRows.forEach(r => n.add(r.accno));
      return n;
    });
  }, [globalGrade, gradeAmountMap, filteredRows]);

  // ── Per-row edit ──────────────────────────────────────────────────────────
  const handleUpdateRow = useCallback((accno, key, value) => {
    setRowData(prev => {
      const next = { ...prev, [accno]: { ...(prev[accno] || {}), [key]: value } };
      if (key === 'grade' && gradeAmountMap[value] != null) {
        next[accno].amount = gradeAmountMap[value];
      }
      return next;
    });
  }, [gradeAmountMap]);

  const handleResetRow = useCallback((accno) => {
    setRowData(prev => {
      const cur = prev[accno] || {};
      return { ...prev, [accno]: { ...cur, grade: cur.lastGrade ?? '', amount: cur.lastAmount ?? '' } };
    });
  }, []);

  // ── Selection helpers ─────────────────────────────────────────────────────
  const handleToggleRow = useCallback((accno) => {
    setSelected(prev => { const n = new Set(prev); n.has(accno) ? n.delete(accno) : n.add(accno); return n; });
  }, []);

  const handleToggleAll = useCallback(() => {
    if (isAllSel) {
      setSelected(prev => { const n = new Set(prev); filteredRows.forEach(r => n.delete(r.accno)); return n; });
    } else {
      setSelected(prev => { const n = new Set(prev); filteredRows.forEach(r => n.add(r.accno)); return n; });
    }
  }, [isAllSel, filteredRows]);

  const handleSelectWithAmount = useCallback(() => {
    setSelected(prev => { const n = new Set(prev); rowsWithAmount.forEach(r => n.add(r.accno)); return n; });
  }, [rowsWithAmount]);

  // ── Bulk submit — parallel chunks, keepalive: true so saves survive page close ──
  const handleSubmit = useCallback(async () => {
    const toSave = allRows.filter(r => selected.has(r.accno));
    if (toSave.length === 0) { toast.error('Select at least one member'); return; }

    const missing = toSave.filter(r => !rowData[r.accno]?.amount || Number(rowData[r.accno].amount) <= 0);
    if (missing.length > 0) {
      toast.error(`${missing.length} selected member(s) have no amount — fill or deselect`);
      return;
    }

    const records = toSave.map(r => {
      const d = rowData[r.accno] || {};
      return {
        AccNo: r.accno, ForYear: forYear, HubMainHead: mainHead, HubSubHead: subHead,
        Grade: d.grade || '', Takhmeen: Number(d.amount) || 0,
        Received: 0, TakhmeenDate: takDate, Remark: '',
      };
    });

    // Split into chunks
    const chunks = [];
    for (let i = 0; i < records.length; i += SAVE_CHUNK) chunks.push(records.slice(i, i + SAVE_CHUNK));

    setSubmitting(true);
    setProgress({ done: 0, total: records.length, errors: 0 });

    // Get auth token for native fetch (keepalive: true survives tab close)
    const token   = typeof window !== 'undefined' ? localStorage.getItem('jms_token') : null;
    const baseUrl = resolveApiBaseUrl();

    // Chrome keepalive budget = 64KB total inflight per origin.
    // Each 50-record chunk ≈ 10KB, so max ~6 simultaneous keepalive requests.
    // Process in groups of 3 (≈30KB) to stay safely under budget.
    const CONCURRENCY = 3;
    let saved = 0, skipped = 0, errors = 0;
    const errorMessages = new Set();

    for (let i = 0; i < chunks.length; i += CONCURRENCY) {
      const group = chunks.slice(i, i + CONCURRENCY);
      await Promise.all(group.map(async (chunk) => {
        let result;
        try {
          const r = await fetch(`${baseUrl}BulkAddTakhmeenDetails`, {
            method:    'POST',
            headers:   { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body:      JSON.stringify({ records: chunk }),
            keepalive: true,
          });
          result = await r.json();
        } catch (err) {
          result = { success: 0, saved: 0, message: err?.message || 'Network error' };
        }
        if (result.success === 1) {
          const inserted = result.saved ?? chunk.length;
          const dup      = chunk.length - inserted;
          saved   += inserted;
          skipped += dup;
        } else {
          errors += chunk.length;
          if (result.message) errorMessages.add(result.message);
        }
        setProgress({ done: saved + skipped + errors, total: records.length, errors });
      }));
    }

    setSubmitting(false);
    if (errors === 0 && skipped === 0) {
      toast.success(`${saved} takhmeen records saved`);
    } else if (errors === 0) {
      toast.success(`${saved} saved${skipped ? ` · ${skipped} already existed (skipped)` : ''}`);
    } else {
      const detail = errorMessages.size ? ` — ${[...errorMessages][0]}` : '';
      toast.error(`${errors} failed${detail} · ${saved} saved${skipped ? ` · ${skipped} skipped` : ''}`);
    }

    await loadMembers();
  }, [allRows, selected, rowData, forYear, mainHead, subHead, takDate, loadMembers]);

  // ── Permission guard ──────────────────────────────────────────────────────
  if (!can('members.add') && !can('receipts.create')) {
    return <div className="p-8 text-center text-gray-400">No permission to add takhmeen.</div>;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full p-4 space-y-4">
      <PageHeader
        title="Bulk Takhmeen"
        subtitle="Load members who haven't done takhmeen, pre-filled from reference year — edit and save"
      />

      {/* Filter / config panel */}
      <ConfigPanel
        subHead={subHead}       setSubHead={setSubHead}
        forYear={forYear}       setForYear={setForYear}
        refYear={refYear}       setRefYear={setRefYear}
        takDate={takDate}       setTakDate={setTakDate}
        subHeadOpts={subHeadOpts}
        forYears={forYears}
        refYearOpts={refYearOpts}
        gradeOpts={gradeOpts}
        hasGrades={hasGrades}
        showGradeBar={allRows.length > 0}
        globalGrade={globalGrade}
        setGlobalGrade={setGlobalGrade}
        onApplyGrade={handleApplyGrade}
        sabeelFilter={sabeelFilter}
        onLoad={loadMembers}
        loading={loading}
        lastLoading={lastLoading}
      />

      {/* Loading — member list */}
      {loading && (
        <div className="bg-white rounded-xl border border-border py-10 text-center text-[13px] text-gray-400">
          Loading member list…
        </div>
      )}

      {/* Member table */}
      {allRows.length > 0 && !loading && (
        <MemberTable
          allRows={allRows}
          filteredRows={filteredRows}
          rowData={rowData}
          gradeOpts={gradeOpts}
          hasGrades={hasGrades}
          sabeelFilter={sabeelFilter}
          setSabeelFilter={setSabeelFilter}
          sabeelTypes={sabeelTypes}
          refYear={refYear}
          lastLoading={lastLoading}
          lastDone={lastDone}
          selected={selected}
          isAllSel={isAllSel}
          selCount={selCount}
          rowsWithAmount={rowsWithAmount}
          onToggleRow={handleToggleRow}
          onToggleAll={handleToggleAll}
          onSelectWithAmount={handleSelectWithAmount}
          onUpdateRow={handleUpdateRow}
          onResetRow={handleResetRow}
          submitting={submitting}
          progress={progress}
          onSubmit={handleSubmit}
        />
      )}

      {/* Empty state */}
      {allRows.length === 0 && !loading && (
        <div className="bg-white rounded-xl border border-border py-14 text-center text-[13px] text-gray-400">
          {subHead && forYear
            ? 'Click "Load Members" to see who hasn\'t done this takhmeen yet'
            : 'Select a sub head and for year above, then load members'}
        </div>
      )}
    </div>
  );
}
