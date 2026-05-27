export default function ProgressBar({ visited, total }) {
  if (total <= 1) return null;
  const pct = Math.round((visited / total) * 100);
  return (
    <div className="h-1 bg-gray-200">
      <div className="h-1 bg-blue-500 transition-all duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}
