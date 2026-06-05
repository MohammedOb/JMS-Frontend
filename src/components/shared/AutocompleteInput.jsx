'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * Autocomplete text input with suggestion dropdown.
 *
 * Props:
 *   value        – controlled text value
 *   onChange(v)  – called on every keystroke with the new string
 *   onSelect(item) – called when user clicks a suggestion (receives full item)
 *   suggestions  – array of strings OR objects
 *   getLabel(item) – fn to extract display text from an item (default: String)
 *   placeholder  – input placeholder
 *   className    – extra classes for the <input>
 *   disabled
 */
export default function AutocompleteInput({
  value = '',
  onChange,
  onSelect,
  suggestions = [],
  getLabel = (x) => String(x ?? ''),
  placeholder,
  className,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef         = useRef(null);

  const q        = String(value || '').toLowerCase();
  const filtered = q
    ? suggestions.filter(s => getLabel(s).toLowerCase().includes(q))
    : suggestions;

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (item) => {
    onChange(getLabel(item));
    onSelect?.(item);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={value ?? ''}
        className={className || 'form-input'}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && !disabled && filtered.length > 0 && (
        <ul
          className="absolute z-[9999] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-0.5 max-h-52 overflow-y-auto text-[12px]"
          style={{ top: '100%' }}
        >
          {filtered.slice(0, 80).map((item, i) => (
            <li
              key={i}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              onMouseDown={() => handleSelect(item)}
            >
              {getLabel(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
