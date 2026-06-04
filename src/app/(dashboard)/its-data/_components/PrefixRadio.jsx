'use client';

const PREFIXES = ['None', 'Shaikh', 'Mulla'];

export default function PrefixRadio({ name, value, onChange }) {
  return (
    <div className="flex items-center gap-2.5">
      {PREFIXES.map(p => (
        <label key={p} className="flex items-center gap-1 text-[11.5px] cursor-pointer select-none">
          <input
            type="radio"
            name={name}
            value={p}
            checked={value === p}
            onChange={() => onChange(p)}
            className="cursor-pointer accent-blue-600"
          />
          <span className={p === value ? 'text-blue-700 font-medium' : 'text-gray-600'}>{p}</span>
        </label>
      ))}
    </div>
  );
}
