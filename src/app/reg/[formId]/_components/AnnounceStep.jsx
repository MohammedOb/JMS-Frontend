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
        <div className="mb-6">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            ITS Number{' '}
            <span className="text-gray-400 font-normal normal-case">(optional — autofills your details)</span>
          </label>
          <input
            type="text"
            value={itsLookup.lookupVal}
            onChange={e => {
              itsLookup.setLookupVal(e.target.value);
              itsLookup.clearState();
            }}
            onKeyDown={e => e.key === 'Enter' && !itsLookup.looking && onNext()}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:border-blue-500"
            placeholder="e.g. 30012345"
          />
        </div>
      )}

      <button
        onClick={onNext}
        disabled={itsLookup?.looking}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-[14px] py-3 rounded-xl transition-colors"
      >
        {itsLookup?.looking ? 'Looking up…' : 'Continue →'}
      </button>
    </div>
  );
}
