'use client';

import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

export default function SuggestionInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  className,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Filter suggestions by what user has typed
  const matches = value
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()))
    : suggestions;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        className={clsx('form-input', className)}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        autoComplete="off"
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />

      {open && matches.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 bg-white border border-border rounded-md shadow-lg mt-0.5 max-h-44 overflow-y-auto">
          {matches.map((s, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-blue-50 hover:text-blue-600 border-b border-gray-50 last:border-0"
              onMouseDown={e => { e.preventDefault(); onChange(s); setOpen(false); }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
