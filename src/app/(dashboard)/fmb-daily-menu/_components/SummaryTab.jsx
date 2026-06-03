import Stars, { RATING_LABEL } from './Stars';

export default function SummaryTab({ summary, filledFields, menuRow }) {
  if (!summary || summary.total_count === 0) {
    return <p className="text-center text-gray-400 text-sm py-10">No feedback yet.</p>;
  }

  return (
    <div>
      {/* Overall */}
      <div className="bg-blue-50 rounded-xl p-4 mb-5 flex items-center gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-blue-700">{summary.avg_overall}</p>
          <Stars value={summary.avg_overall} size="text-xl" />
          <p className="text-[11px] text-gray-500 mt-1">{RATING_LABEL[Math.round(summary.avg_overall)] || ''}</p>
        </div>
        <div className="border-l border-blue-200 pl-4">
          <p className="text-sm font-semibold text-gray-700">
            {summary.total_count} response{summary.total_count !== 1 ? 's' : ''}
          </p>
          <p className="text-[12px] text-gray-400">Overall average</p>
        </div>
      </div>

      {/* Per-item averages */}
      {filledFields.length > 0 && (
        <div className="space-y-2">
          {filledFields.map(f => {
            const avg = summary[`avg_${f.key}`];
            if (!avg) return null;
            return (
              <div key={f.key} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="w-28 shrink-0">
                  <p className="text-[12px] font-medium text-gray-700">{menuRow[f.key]}</p>
                  <p className="text-[11px] text-gray-400">{f.label}</p>
                </div>
                <Stars value={avg} />
                <span className="text-[12px] text-gray-500 ml-1">{avg}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
