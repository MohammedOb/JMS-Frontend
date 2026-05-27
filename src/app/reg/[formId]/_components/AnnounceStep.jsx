'use client';

export default function AnnounceStep({ form, onNext }) {
  return (
    <div className="p-6">
      {form.Description ? (
        <div className="text-gray-700 text-[13px] leading-relaxed whitespace-pre-wrap mb-6">
          {form.Description}
        </div>
      ) : (
        <p className="text-gray-400 text-[13px] mb-6 italic">No announcement.</p>
      )}
      <button onClick={onNext}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[14px] py-3 rounded-xl transition-colors">
        Next →
      </button>
    </div>
  );
}
