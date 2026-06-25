'use client';

// MemberTable — shows loaded members with last-year reference, editable grade/amount,
// sabeel-type filter, selection controls and the save button.

const fmtAmt = (n) => (n != null && n !== '') ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

function Spinner({ className = 'w-3.5 h-3.5 text-blue-500' }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default function MemberTable({
  // data
  allRows,           // full unfiltered list (for total count display)
  filteredRows,      // after sabeel-type filter
  rowData,           // { [accno]: { grade, amount, lastGrade, lastAmount, lastYear } }
  gradeOpts,
  hasGrades,

  // sabeel filter
  sabeelFilter, setSabeelFilter, sabeelTypes,

  // ref-year label (shown in column header)
  refYear,

  // loading states
  lastLoading,
  lastDone,

  // selection
  selected,
  isAllSel,
  selCount,
  rowsWithAmount,    // filteredRows that have a pre-filled amount
  onToggleRow,
  onToggleAll,
  onSelectWithAmount,

  // row editing
  onUpdateRow,
  onResetRow,

  // submit
  submitting,
  progress,
  onSubmit,
}) {
  const colSpan = hasGrades ? 9 : 8;

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-wrap gap-2">

        {/* Left: count + sabeel filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold text-navy-800">
            {filteredRows.length !== allRows.length
              ? `${filteredRows.length} / ${allRows.length} members`
              : `${allRows.length} members`}
          </span>

          {lastDone && rowsWithAmount.length > 0 && !lastLoading && (
            <span className="text-[11px] text-gray-400">
              · {rowsWithAmount.length} pre-filled from {refYear || 'last year'}
            </span>
          )}

          {lastLoading && (
            <span className="flex items-center gap-1.5 text-[11px] text-blue-600">
              <Spinner />
              Fetching {refYear || 'last year'} data…
            </span>
          )}

          {/* Sabeel type filter */}
          {sabeelTypes.length > 0 && (
            <select
              className="form-select h-[30px] text-[11px] w-[170px]"
              value={sabeelFilter}
              onChange={e => setSabeelFilter(e.target.value)}
            >
              <option value="">All Sabeel Types</option>
              {sabeelTypes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {lastDone && rowsWithAmount.length > 0 && (
            <button
              className="btn btn-secondary btn-sm text-[11px]"
              onClick={onSelectWithAmount}
              title="Select all visible rows that have a pre-filled amount"
            >
              Select {rowsWithAmount.length} with amount
            </button>
          )}

          {submitting && (
            <span className="flex items-center gap-1.5 text-[12px] text-gray-500 tabular-nums">
              <Spinner />
              {progress.done}/{progress.total}
              {progress.errors > 0 && (
                <span className="text-red-500"> · {progress.errors} failed</span>
              )}
            </span>
          )}

          <button
            className="btn btn-primary btn-sm"
            onClick={onSubmit}
            disabled={submitting || selCount === 0}
          >
            {submitting ? 'Saving…' : `Save ${selCount} Selected`}
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px] border-collapse min-w-[720px]">
          <thead>
            <tr>
              {/* Select all */}
              <th className="th-navy w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSel}
                  onChange={onToggleAll}
                  className="accent-blue-600 cursor-pointer"
                />
              </th>
              <th className="th-navy">Acc No</th>
              <th className="th-navy">Name</th>
              <th className="th-navy">Sector</th>
              <th className="th-navy">Sabeel Type</th>
              <th className="th-navy text-center w-36">
                From {refYear || 'Last Year'}
              </th>
              {hasGrades && (
                <th className="th-navy text-center w-[130px]">Grade (new)</th>
              )}
              <th className="th-navy text-center w-[130px]">Amount ₹ (new) *</th>
              <th className="th-navy w-8"></th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map(r => {
              const d      = rowData[r.accno] || {};
              const isSel  = selected.has(r.accno);
              const noAmt  = isSel && (!d.amount || Number(d.amount) <= 0);
              const hasLast = !!d.lastYear;

              const changed = hasLast && (
                String(d.grade  ?? '') !== String(d.lastGrade  ?? '') ||
                String(d.amount ?? '') !== String(d.lastAmount ?? '')
              );

              return (
                <tr key={r.accno} className={isSel ? 'bg-blue-50' : 'hover:bg-gray-50'}>

                  {/* Checkbox */}
                  <td className="px-2 py-2 border-t border-border text-center">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => onToggleRow(r.accno)}
                      className="accent-blue-600 cursor-pointer"
                    />
                  </td>

                  {/* Acc No */}
                  <td className="px-2 py-2 border-t border-border font-mono text-gray-700 whitespace-nowrap">
                    {r.accno}
                  </td>

                  {/* Name */}
                  <td className="px-2 py-2 border-t border-border font-medium">
                    {r.fullName}
                  </td>

                  {/* Sector */}
                  <td className="px-2 py-2 border-t border-border text-gray-500 text-[11px] whitespace-nowrap">
                    {r.sector}
                  </td>

                  {/* Sabeel Type */}
                  <td className="px-2 py-2 border-t border-border text-center">
                    {r.sabeelType
                      ? <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] whitespace-nowrap">{r.sabeelType}</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </td>

                  {/* Reference year — read-only */}
                  <td className="px-2 py-2 border-t border-border text-center">
                    {hasLast ? (
                      <div className="inline-flex flex-col items-center leading-tight gap-0.5">
                        <span className="text-[10px] text-gray-400">{d.lastYear}</span>
                        <span className="text-[12px] font-semibold text-navy-800">
                          {fmtAmt(d.lastAmount)}
                        </span>
                        {d.lastGrade && (
                          <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 rounded">
                            Grade {d.lastGrade}
                          </span>
                        )}
                      </div>
                    ) : lastDone ? (
                      <span className="text-[10px] text-gray-300">No record</span>
                    ) : (
                      <span className="text-[10px] text-gray-300">
                        {lastLoading ? <Spinner className="w-3 h-3 inline" /> : '—'}
                      </span>
                    )}
                  </td>

                  {/* Grade dropdown — grade-based sub-heads only */}
                  {hasGrades && (
                    <td className="px-2 py-2 border-t border-border text-center">
                      <select
                        className="form-select h-[28px] text-[11px] w-[150px]"
                        value={d.grade ?? ''}
                        onChange={e => onUpdateRow(r.accno, 'grade', e.target.value)}
                      >
                        <option value="">—</option>
                        {d.grade && !gradeOpts.some(g => g.value === d.grade) && (
                          <option value={d.grade}>{d.grade}</option>
                        )}
                        {gradeOpts.map(g => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </td>
                  )}

                  {/* Amount input */}
                  <td className="px-2 py-2 border-t border-border text-center">
                    <input
                      type="number"
                      min="0"
                      className={`form-input h-[28px] text-[11px] w-[110px] text-right ${
                        noAmt ? 'border-red-400 bg-red-50' : ''
                      }`}
                      value={d.amount ?? ''}
                      placeholder="0"
                      onChange={e => onUpdateRow(r.accno, 'amount', e.target.value)}
                    />
                  </td>

                  {/* Reset to reference year values */}
                  <td className="px-2 py-2 border-t border-border text-center">
                    {hasLast && changed && (
                      <button
                        title={`Reset to ${d.lastYear} grade & amount`}
                        className="text-[14px] leading-none text-blue-400 hover:text-blue-700 transition-colors"
                        onClick={() => onResetRow(r.accno)}
                      >
                        ↺
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="py-10 text-center text-gray-400 text-[12px]">
                  No members match the selected sabeel type filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom save bar for long lists */}
      {filteredRows.length > 12 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-gray-50/60">
          <span className="text-[11px] text-gray-400">
            {selCount} of {allRows.length} selected
          </span>
          <button
            className="btn btn-primary btn-sm"
            onClick={onSubmit}
            disabled={submitting || selCount === 0}
          >
            {submitting ? 'Saving…' : `Save ${selCount} Selected`}
          </button>
        </div>
      )}
    </div>
  );
}
