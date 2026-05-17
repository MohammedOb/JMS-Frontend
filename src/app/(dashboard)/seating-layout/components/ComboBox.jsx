'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ComboBox({
  value = '',
  onChange,
  options = [],
  placeholder = '',
  className = '',
}) {
  const [query, setQuery]   = useState(value);
  const [open, setOpen]     = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const inputRef            = useRef(null);

  // Keep local query in sync when parent resets value (e.g. modal close/reopen)
  useEffect(() => { setQuery(value ?? ''); }, [value]);

  // Recalculate drop position relative to the input element
  const updatePos = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropPos({
      top:   rect.bottom + window.scrollY + 4,
      left:  rect.left   + window.scrollX,
      width: rect.width,
    });
  };

  // Close when clicking outside the input
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleInput = (e) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    updatePos();
    setOpen(true);
  };

  const handleFocus = () => {
    updatePos();
    setOpen(true);
  };

  const handleSelect = (opt) => {
    setQuery(opt);
    onChange(opt);
    setOpen(false);
  };

  // Render dropdown via portal so modal overflow-y-auto doesn't clip it
  const dropdown = open && filtered.length > 0
    ? createPortal(
        <div
          style={{ position: 'absolute', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
          className="bg-white border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto"
        >
          {filtered.map(opt => (
            <button
              key={opt}
              type="button"
              onMouseDown={() => handleSelect(opt)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors
                ${opt === value
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-navy-800 hover:bg-surface'}`}
            >
              {opt}
            </button>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        className="form-input w-full"
        value={query}
        onChange={handleInput}
        onFocus={handleFocus}
        placeholder={placeholder}
        autoComplete="off"
      />
      {dropdown}
    </div>
  );
}
