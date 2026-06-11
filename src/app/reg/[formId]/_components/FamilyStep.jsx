'use client';
import { memberKey } from './helpers';
import MemberCellInput from './MemberCellInput';

export default function FamilyStep({
  form,
  memberData,
  familyMembers,
  selectedKeys, setSelectedKeys, toggleKey, selectAll,
  alreadyRegisteredKeys, membersToDelete,
  allQuestions,
  perMemberAnswers, setPerMemberAnswer,
  getIneligibilityReason,
  outsideMembers, addOutsideMember, updateOutside, removeOutside,
  removedOutsideCount,
  selectedCount,
  onSubmit, submitting,
  onBack,
}) {
  const eligibleCount = familyMembers.filter(m => !getIneligibilityReason(m)).length;
  const allEligibleChecked =
    eligibleCount > 0 &&
    familyMembers.filter(m => !getIneligibilityReason(m)).every(m => selectedKeys.has(memberKey(m)));

  return (
    <div className="p-4 sm:p-5 space-y-4">

      {/* HOF Details card — compact 4-column grid */}
      <div className="border border-gray-200 rounded-xl p-3.5">
        <div className="flex items-center gap-2 mb-2.5">
          <svg className="w-4 h-4 text-teal-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <h3 className="text-[13px] font-bold text-gray-800">Head of Family</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'FULL NAME',      value: memberData?.Full_Name || memberData?.FullName },
            { label: 'SABEEL NO',      value: memberData?.AccNo },
            { label: 'HOF ITS',        value: memberData?.ITS_ID || memberData?.ITSNo },
            { label: 'DEFAULT MASJID', value: (() => {
                const inner = [memberData?.Subsector, memberData?.MohallaDescription].filter(Boolean).join(' - ');
                return [memberData?.Sector, inner ? `(${inner})` : null].filter(Boolean).join(' ');
              })() },
          ].map(({ label, value }) => (
            <div key={label} className="bg-teal-50 rounded-lg p-2">
              <p className="text-[9px] font-bold text-teal-600 uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-[11px] font-bold text-gray-800 leading-tight" title={value || '—'}>{value || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Already Registered banner */}
      {alreadyRegisteredKeys.size > 0 && (
        <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5">
          <span className="text-blue-500 font-bold text-[14px] leading-none mt-0.5 shrink-0">ℹ</span>
          <p className="text-[11px] text-blue-700">
            <strong>{alreadyRegisteredKeys.size}</strong> member{alreadyRegisteredKeys.size !== 1 ? 's are' : ' is'} already registered — answers are pre-filled and editable.
            Uncheck a member to <strong>remove</strong> their registration.
          </p>
        </div>
      )}

      {/* ── Family Members table ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <h3 className="text-[13px] font-bold text-gray-800">Family Members</h3>
          </div>
          {familyMembers.length > 0 && (
            <span className="bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {familyMembers.length} member{familyMembers.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Outer border + clip */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Scrollable in both X and Y — gives sticky header a fixed frame */}
          <div className="overflow-auto max-h-[58vh]">
            <table className="w-full text-[11px] min-w-max border-collapse">

              {/* ── Sticky header ──────────────────────────────────────────── */}
              <thead className="sticky top-0 z-20">
                <tr className="bg-gray-50 border-b border-gray-200">

                  {/* Checkbox — sticky left */}
                  <th className="w-9 px-2.5 py-2 text-left sticky left-0 bg-gray-50 z-30">
                    <input
                      type="checkbox"
                      className="accent-teal-600 w-3.5 h-3.5"
                      checked={allEligibleChecked}
                      onChange={e => e.target.checked ? selectAll() : setSelectedKeys(new Set())}
                    />
                  </th>

                  {/* Name — sticky left (after checkbox) */}
                  <th className="px-2.5 py-2 text-left font-semibold text-gray-500 min-w-[150px] sticky left-9 bg-gray-50 z-30 whitespace-nowrap">
                    Full Name
                  </th>

                  {/* ITS No */}
                  <th className="px-2.5 py-2 text-left font-semibold text-gray-500 min-w-[88px] whitespace-nowrap">
                    ITS No
                  </th>

                  {/* Dynamic question columns */}
                  {allQuestions.map(q => (
                    <th
                      key={q.ID}
                      title={`${q.QuestionText}${q.IsRequired ? ' (required)' : ''}`}
                      className="px-2.5 py-2 text-left font-semibold text-gray-500 min-w-[110px] max-w-[180px]"
                    >
                      <div className="flex items-start gap-0.5">
                        <span className="line-clamp-2 leading-tight">{q.QuestionText}</span>
                        {q.IsRequired && <span className="text-red-500 shrink-0 leading-tight">*</span>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* ── Body ───────────────────────────────────────────────────── */}
              <tbody className="divide-y divide-gray-100">
                {familyMembers.length === 0 && (
                  <tr>
                    <td colSpan={3 + allQuestions.length} className="text-center py-8 text-gray-400 italic">
                      No family members found.
                    </td>
                  </tr>
                )}

                {familyMembers.map(m => {
                  const key        = memberKey(m);
                  const ineligible = getIneligibilityReason(m);
                  const alreadyReg = alreadyRegisteredKeys.has(key);
                  const isChecked  = selectedKeys.has(key);
                  const willRemove = alreadyReg && !isChecked;
                  const isLocked   = !!ineligible;

                  const rowBg = ineligible
                    ? 'opacity-40 bg-gray-50 cursor-not-allowed'
                    : willRemove
                      ? 'bg-red-50 opacity-75'
                      : isChecked
                        ? 'bg-teal-50'
                        : 'bg-white hover:bg-gray-50';

                  return (
                    <tr key={key || m.Full_Name} className={`transition-colors ${rowBg}`}>

                      {/* Checkbox — sticky */}
                      <td
                        className="px-2.5 py-2 sticky left-0 bg-inherit z-10"
                        onClick={() => !isLocked && toggleKey(key)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isLocked}
                          onChange={() => {}}
                          className="accent-teal-600 w-3.5 h-3.5 pointer-events-none"
                        />
                      </td>

                      {/* Name — sticky */}
                      <td
                        className="px-2.5 py-2 font-medium text-gray-800 sticky left-9 bg-inherit z-10 cursor-pointer"
                        onClick={() => !isLocked && toggleKey(key)}
                      >
                        <span className="block leading-snug">
                          {m.Full_Name || m.FullName || '—'}
                        </span>
                        {ineligible && (
                          <span className="block text-[9px] text-red-500 font-normal mt-0.5 leading-tight">{ineligible}</span>
                        )}
                        {alreadyReg && isChecked && !ineligible && (
                          <span className="inline-block mt-0.5 text-[8px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">✓ Registered</span>
                        )}
                        {willRemove && (
                          <span className="inline-block mt-0.5 text-[8px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Will be removed</span>
                        )}
                      </td>

                      {/* ITS */}
                      <td className="px-2.5 py-2 text-gray-500 font-mono text-[10px] whitespace-nowrap">
                        {m.ITS_ID || m.ITSNo || '—'}
                      </td>

                      {/* Question cells */}
                      {allQuestions.map(q => (
                        <td key={q.ID} className="px-2 py-1.5" onClick={e => e.stopPropagation()}>
                          {isChecked && !isLocked ? (
                            <MemberCellInput
                              question={q}
                              value={perMemberAnswers[key]?.[q.ID] ?? ''}
                              memberData={m}
                              memberAnswers={perMemberAnswers[key] ?? {}}
                              onChange={val => setPerMemberAnswer(key, q.ID, val)}
                            />
                          ) : (
                            <span className="text-gray-400 text-[10px]">
                              {perMemberAnswers[key]?.[q.ID] || '—'}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Outside / guest members ──────────────────────────────────────────── */}
      {Number(form?.AllowOutsideRegistration) !== 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[12px] font-semibold text-gray-600">
              Outside / Guest Members
              <span className="text-[11px] font-normal text-gray-400 ml-1">(not in the system)</span>
            </p>
            {outsideMembers.some(m => m._responseId) && (
              <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2 py-0.5 font-semibold">
                ✓ Loaded from previous registration
              </span>
            )}
          </div>
          <div className="space-y-2">
            {outsideMembers.map((m, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-xl px-2 py-1 ${m._responseId ? 'bg-blue-50 border border-blue-100' : ''}`}
              >
                {m._responseId && (
                  <span className="text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full shrink-0">✓ Saved</span>
                )}
                <input
                  type="text" value={m.Name}
                  onChange={e => updateOutside(i, 'Name', e.target.value)}
                  placeholder="Full Name *"
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-blue-500 bg-white"
                />
                <input
                  type="text" value={m.ITSNo}
                  onChange={e => updateOutside(i, 'ITSNo', e.target.value)}
                  placeholder="ITS (optional)"
                  className="w-28 border border-gray-300 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-blue-500 bg-white"
                />
                <button
                  onClick={() => removeOutside(i)}
                  title={m._responseId ? 'Remove from registration' : 'Remove'}
                  className="text-red-400 hover:text-red-600 text-[13px] shrink-0"
                >✕</button>
              </div>
            ))}
          </div>
          <button
            onClick={addOutsideMember}
            className="mt-2 text-[12px] text-blue-500 hover:text-blue-700 font-medium"
          >
            + Add outside / guest member
          </button>
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onBack}
          className="border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold text-[13px] py-2.5 px-4 rounded-xl transition-colors shrink-0"
        >
          ← Back
        </button>
        <button
          onClick={selectAll}
          className="border border-teal-500 text-teal-600 hover:bg-teal-50 font-semibold text-[13px] py-2.5 px-4 rounded-xl transition-colors shrink-0"
        >
          ✓ Select All
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting || (selectedCount === 0 && membersToDelete.length === 0 && removedOutsideCount === 0)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-[13px] py-2.5 rounded-xl transition-colors"
        >
          {submitting ? 'Saving…' : (() => {
            const totalRemoved = membersToDelete.length + removedOutsideCount;
            if (selectedCount > 0)
              return `Save Registration (${selectedCount} member${selectedCount !== 1 ? 's' : ''}${totalRemoved > 0 ? ` · ${totalRemoved} removed` : ''})`;
            if (totalRemoved > 0)
              return `Remove ${totalRemoved} member${totalRemoved !== 1 ? 's' : ''}`;
            return 'Save Registration';
          })()}
        </button>
      </div>

    </div>
  );
}
