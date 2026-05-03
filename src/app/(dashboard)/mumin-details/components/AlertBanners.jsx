'use client';

export default function AlertBanners({ due, onHimTakhmeen, onFmbTakhmeen }) {
  return (
    <>
      {due?.himTakhmeenPending && (
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[12px] mb-3 bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 text-amber-900">
          ⚠ HIM Takhmeen not entered for current year →
          <button className="btn btn-sm bg-amber-500 text-white border-amber-500 ml-2" onClick={onHimTakhmeen}>
            Enter HIM Takhmeen
          </button>
        </div>
      )}
      {due?.fmbTakhmeenPending && (
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[12px] mb-3 bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500 text-amber-900">
          ⚠ FMB Takhmeen not entered for current year →
          <button className="btn btn-sm bg-amber-500 text-white border-amber-500 ml-2" onClick={onFmbTakhmeen}>
            Enter FMB Takhmeen
          </button>
        </div>
      )}
    </>
  );
}
