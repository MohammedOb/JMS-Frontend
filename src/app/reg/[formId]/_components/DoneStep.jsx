'use client';

export default function DoneStep({ form, memberData, existingResponseId, submitResult, onNewRegistration }) {
  return (
    <div className="p-10 text-center space-y-4">
      <div className="text-5xl">✅</div>
      <h2 className="text-[18px] font-bold text-gray-800">
        {existingResponseId ? 'Registration Updated!' : 'Registration Submitted!'}
      </h2>

      {submitResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-left space-y-1">
          {(submitResult.submitted ?? 0) > 0 && (
            <p className="text-[13px] text-green-700 font-semibold">
              ✓ {submitResult.submitted} member{submitResult.submitted !== 1 ? 's' : ''} registered successfully.
            </p>
          )}
          {(submitResult.updated ?? 0) > 0 && (
            <p className="text-[13px] text-blue-700 font-semibold">
              ✎ {submitResult.updated} member{submitResult.updated !== 1 ? 's' : ''} updated.
            </p>
          )}
          {(submitResult.deleted ?? 0) > 0 && (
            <p className="text-[13px] text-red-600 font-semibold">
              ✕ {submitResult.deleted} member{submitResult.deleted !== 1 ? 's' : ''} removed from registration.
            </p>
          )}
          {(submitResult.skipped ?? 0) > 0 && (
            <p className="text-[12px] text-amber-600">
              {submitResult.skipped} member{submitResult.skipped !== 1 ? 's were' : ' was'} already registered and skipped.
            </p>
          )}
        </div>
      )}

      {form.AfterSubmitMessage?.trim() ? (
        <p className="text-gray-700 text-[14px] leading-relaxed whitespace-pre-wrap">
          {form.AfterSubmitMessage}
        </p>
      ) : (
        <p className="text-gray-500 text-[13px]">
          Thank you{memberData?.FullName || memberData?.Full_Name ? `, ${memberData.FullName || memberData.Full_Name}` : ''}.
          <br />Your registration for <strong>{form.EventName || form.Title}</strong> has been saved.
        </p>
      )}

      {onNewRegistration && (
        <div className="pt-2">
          <button
            onClick={onNewRegistration}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-[13px] px-5 py-2.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Registration
          </button>
        </div>
      )}
    </div>
  );
}
