// Shared visual primitives for dashboard sections

const fmt = (n) => (n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—');

// Horizontal stacked bar — received (green) + dues (red)
export function StackedBar({ received = 0, remaining = 0, height = 'h-3' }) {
  const total = received + remaining;
  if (total === 0) return <div className={`w-full ${height} rounded bg-gray-100`} />;
  const recPct = Math.round((received / total) * 100);
  const remPct = 100 - recPct;
  return (
    <div className={`flex w-full ${height} rounded overflow-hidden gap-px`}>
      <div className="bg-green-500 rounded-l" style={{ width: `${recPct}%` }} title={`Received ${recPct}%`} />
      <div className="bg-red-400 rounded-r"  style={{ width: `${remPct}%` }} title={`Dues ${remPct}%`} />
    </div>
  );
}

// SVG Donut showing a single percentage (received / total)
export function DonutChart({ received = 0, total = 0, size = 88, label = 'Received' }) {
  const pct   = total > 0 ? Math.min(received / total, 1) : 0;
  const r     = 34;
  const circ  = 2 * Math.PI * r;
  const dash  = pct * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e5e7eb" strokeWidth="11" />
        <circle
          cx="44" cy="44" r={r} fill="none"
          stroke="#22c55e" strokeWidth="11"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
        />
        <text x="44" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">
          {Math.round(pct * 100)}%
        </text>
        <text x="44" y="55" textAnchor="middle" fontSize="9" fill="#94a3b8">{label}</text>
      </svg>
    </div>
  );
}

// Compact amount card
export function AmtCard({ label, value, color = 'text-navy-900', money = true }) {
  return (
    <div className="bg-surface border border-border rounded-md px-3 py-2.5">
      <div className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">{label}</div>
      <div className={`text-[14px] font-bold mt-0.5 ${color}`}>
        {money ? fmt(value) : (value ?? '—')}
      </div>
    </div>
  );
}

// Section skeleton (loading state)
export function SectionSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="card-header"><div className="h-4 w-32 bg-gray-200 rounded" /></div>
      <div className="card-body grid grid-cols-3 gap-3">
        {[0,1,2].map(i => <div key={i} className="h-16 bg-gray-100 rounded" />)}
      </div>
    </div>
  );
}

export { fmt };
