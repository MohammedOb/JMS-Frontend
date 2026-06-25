'use client';

import AutocompleteInput from '@/components/shared/AutocompleteInput';

export default function ConfigPanel({
  // filter state
  subHead, setSubHead,
  forYear, setForYear,
  refYear, setRefYear,
  takDate, setTakDate,

  // lookup data
  subHeadOpts,
  forYears,
  refYearOpts,
  gradeOpts,

  // grade override
  globalGrade, setGlobalGrade,
  onApplyGrade,
  sabeelFilter,          // to label "Apply to Filtered / All"
  hasGrades,
  showGradeBar,          // show only after members are loaded

  // load button
  onLoad,
  loading,
  lastLoading,
}) {
  const canLoad = !loading && !lastLoading && !!subHead && !!forYear;

  return (
    <div className="bg-white rounded-xl border border-border p-4 space-y-4">

      {/* ── Row 1: Filters + Load ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

        {/* Hub Sub Head */}
        <div>
          <label className="form-label">Hub Sub Head *</label>
          <select
            className="form-select"
            value={subHead}
            onChange={e => setSubHead(e.target.value)}
          >
            <option value="">Select sub head…</option>
            {subHeadOpts.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* For Year — year to create takhmeen for */}
        <div>
          <label className="form-label">For Year (New) *</label>
          <AutocompleteInput
            value={forYear}
            onChange={setForYear}
            suggestions={forYears}
            placeholder="Type or pick year…"
          />
        </div>

        {/* Copy From Year — which prior year to copy grade/amount from */}
        <div>
          <label className="form-label">Copy From Year</label>
          <AutocompleteInput
            value={refYear}
            onChange={setRefYear}
            suggestions={refYearOpts}
            placeholder="Auto (most recent)"
            disabled={!forYear}
          />
        </div>

        {/* Takhmeen Date */}
        <div>
          <label className="form-label">Takhmeen Date *</label>
          <input
            type="date"
            className="form-input"
            value={takDate}
            onChange={e => setTakDate(e.target.value)}
          />
        </div>

        {/* Load button */}
        <div className="flex items-end">
          <button
            className="btn btn-primary w-full"
            onClick={onLoad}
            disabled={!canLoad}
          >
            {loading ? 'Loading…' : 'Load Members'}
          </button>
        </div>
      </div>

      {/* ── Row 2: Grade override bar (grade-based sub-heads only) ──────── */}
      {hasGrades && showGradeBar && (
        <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-border">
          <div>
            <label className="form-label">Override Grade for All</label>
            <select
              className="form-select w-56"
              value={globalGrade}
              onChange={e => setGlobalGrade(e.target.value)}
            >
              <option value="">Pick a grade…</option>
              {gradeOpts.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-secondary"
            onClick={onApplyGrade}
            disabled={!globalGrade}
          >
            Apply to {sabeelFilter ? 'Filtered' : 'All'} &amp; Select
          </button>
          <p className="text-[11px] text-gray-400 self-end pb-0.5">
            Or edit grade / amount individually per row below.
          </p>
        </div>
      )}
    </div>
  );
}
