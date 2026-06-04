'use client';

export default function TypeBadge({ type }) {
  if (!type) return <span className="text-gray-400 text-[11px]">—</span>;
  const isHOF = String(type).toUpperCase() === 'HOF';
  return (
    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold leading-none
      ${isHOF ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
      {String(type).toUpperCase()}
    </span>
  );
}
