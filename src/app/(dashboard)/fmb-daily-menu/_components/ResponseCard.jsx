import Stars, { RATING_LABEL } from './Stars';

export default function ResponseCard({ response: r, filledFields, menuRow }) {
  return (
    <div className="border border-border rounded-xl p-4">
      {/* Submitter info */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-gray-800">
            {r.full_name || <span className="text-gray-400 font-normal">Anonymous</span>}
            {r.acc_no && <span className="text-[11px] text-gray-400 ml-2">#{r.acc_no}</span>}
          </p>
          <p className="text-[11px] text-gray-400">
            {new Date(r.created_at).toLocaleString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <div className="text-right">
          <Stars value={r.overall_rating} />
          <p className="text-[11px] text-gray-400">{RATING_LABEL[r.overall_rating]}</p>
        </div>
      </div>

      {/* Event remark */}
      {r.event_remark && (
        <div className="bg-amber-50 rounded-lg px-3 py-2 mb-3">
          <p className="text-[11px] font-medium text-amber-700 mb-0.5">Event</p>
          <p className="text-[12px] text-gray-700">{r.event_remark}</p>
        </div>
      )}

      {/* Per-item ratings & remarks */}
      {filledFields.filter(f => r[`${f.key}_rating`] || r[`${f.key}_remark`]).map(f => (
        <div key={f.key} className="flex items-start gap-2 py-1.5 border-t border-border first:border-0">
          <div className="w-28 shrink-0">
            <p className="text-[12px] font-medium text-gray-700">{menuRow[f.key]}</p>
            <p className="text-[11px] text-gray-400">{f.label}</p>
            {r[`${f.key}_rating`] && <Stars value={r[`${f.key}_rating`]} size="text-sm" />}
          </div>
          <p className="text-[12px] text-gray-600 flex-1">{r[`${f.key}_remark`] || '—'}</p>
        </div>
      ))}
    </div>
  );
}
