'use client';

export default function VerifyStep({
  form,
  lookupMode, setLookupMode,
  lookupVal, setLookupVal,
  verifyCode, setVerifyCode,
  looking, familyLoading,
  memberData,
  verifyError, setVerifyError,
  notFoundMode, setNotFoundMode,
  verifyInputRef,
  doLookup, doVerify, proceedManually,
  onBack,
}) {
  return (
    <div className="p-6 space-y-5">
      <h2 className="text-[15px] font-bold text-gray-800">Verify Your Identity</h2>

      <div className="flex rounded-xl border border-gray-200 overflow-hidden">
        {[{ key: 'accno', label: 'By Acc No' }, { key: 'itsno', label: 'By ITS No' }].map(m => (
          <button key={m.key}
            onClick={() => {
              setLookupMode(m.key);
              setLookupVal('');
              setVerifyError('');
              setNotFoundMode(false);
            }}
            className={`flex-1 py-2.5 text-[12px] font-semibold transition-colors ${
              lookupMode === m.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}>
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
            onChange={e => { setLookupVal(e.target.value); setVerifyError(''); setNotFoundMode(false); }}
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
            ✓ Found: {memberData.FullName || memberData.Full_Name}
            {memberData.Sector ? ` · ${memberData.Sector}` : ''}
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
          <button onClick={doVerify} disabled={familyLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-[13px] py-2.5 rounded-xl transition-colors">
            {familyLoading ? 'Loading family…' : 'Verify & Continue →'}
          </button>
        </div>
      )}

      {notFoundMode && (
        Number(form.AllowOutsideRegistration) === 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-[12px] text-red-700 font-semibold">
              ⚠️ {lookupMode === 'accno' ? 'No member found for this Acc No.' : 'ITS not found in the system.'}
            </p>
            <p className="text-[12px] text-red-600 mt-1">Registration is restricted to registered members only.</p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <p className="text-[12px] text-amber-800 font-semibold">
              {lookupMode === 'accno' ? '⚠️ No member found for this Acc No.' : '⚠️ ITS not found in the system.'}
            </p>
            <p className="text-[12px] text-amber-700">You can continue and fill the form manually.</p>
            <button onClick={proceedManually}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[13px] py-2.5 rounded-xl transition-colors">
              Continue as Outside Member →
            </button>
          </div>
        )
      )}

      {verifyError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[12px] rounded-xl px-4 py-3">
          {verifyError}
        </div>
      )}

      <button onClick={onBack} className="text-[12px] text-gray-400 hover:text-gray-600">← Back</button>
    </div>
  );
}
