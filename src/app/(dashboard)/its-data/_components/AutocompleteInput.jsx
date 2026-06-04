'use client';

import { useState, useRef, useEffect } from 'react';

const getLabel = s => (typeof s === 'string' ? s : s.label);
const getVal   = s => (typeof s === 'string' ? s : s.value);

export default function AutocompleteInput({ value, onChange, suggestions = [], placeholder, className = '' }) {
  const [open,      setOpen]      = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);

  const filtered = value
    ? suggestions.filter(s => {
        const lv = value.toLowerCase();
        return getLabel(s).toLowerCase().includes(lv) || getVal(s).toLowerCase().includes(lv);
      }).slice(0, 20)
    : suggestions.slice(0, 20);

  useEffect(() => { setHighlight(0); }, [filtered.length]);

  useEffect(() => {
    const h = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleKeyDown = (e) => {
    if (!open || !filtered.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    if (e.key === 'Enter' && filtered[highlight]) {
      e.preventDefault();
      onChange(getVal(filtered[highlight]));
      setOpen(false);
    }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        className={`form-input ${className}`}
        value={value}
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-white border border-border rounded-md shadow-lg max-h-52 overflow-y-auto text-[12px]">
          {filtered.map((s, i) => (
            <li
              key={getVal(s)}
              className={`px-3 py-1.5 cursor-pointer truncate ${i === highlight ? 'bg-blue-500 text-white' : 'hover:bg-blue-50 text-gray-700'}`}
              onMouseDown={() => { onChange(getVal(s)); setOpen(false); }}
              onMouseEnter={() => setHighlight(i)}
            >
              {getLabel(s)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
