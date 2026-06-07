'use client';

export default function AnnounceStep({ form, onNext, itsLookup }) {
  return (
    <div className="p-6">
      {form.Description ? (
        <div className="text-gray-700 text-[13px] leading-relaxed whitespace-pre-wrap mb-6">
          {form.Description}
        </div>
      ) : (
        <p className="text-gray-400 text-[13px] mb-6 italic">No announcement.</p>
      )}

      {itsLookup && (
        <div className="mb-6 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              ITS Number{' '}
              <span className="text-gray-400 font-normal normal-case">(optional — autofills your details)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={itsLookup.lookupVal}
                onChange={e => {
                  itsLookup.setLookupVal(e.target.value);
                  itsLookup.clearState();
                }}
                onKeyDown={e => e.key === 'Enter' && itsLookup.doLookup()}
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-blue-500"
                placeholder="e.g. 30012345"
              />
              <button
                onClick={itsLookup.doLookup}
                disabled={itsLookup.looking}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 rounded-xl text-[12px] font-semibold disabled:opacity-50 min-w-[60px]"
              >
                {itsLookup.looking ? '…' : 'Find'}
              </button>
            </div>
          </div>

          {itsLookup.memberData && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-[13px] text-green-700 font-semibold">
                ✓ {itsLookup.memberData.FullName || itsLookup.memberData.Full_Name}
                {itsLookup.memberData.Sector ? ` · ${itsLookup.memberData.Sector}` : ''}
              </p>
              <p className="text-[11px] text-green-600 mt-0.5">Details will be autofilled in the form.</p>
            </div>
          )}

          {itsLookup.error && !itsLookup.memberData && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-[12px] text-amber-800">{itsLookup.error} You can fill the form manually.</p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[14px] py-3 rounded-xl transition-colors"
      >
        {itsLookup ? (itsLookup.memberData ? 'Continue →' : 'Continue without autofill →') : 'Next →'}
      </button>
    </div>
  );
}
