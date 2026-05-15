'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Autocomplete input. Options can be plain strings or { value, label } objects.
 * Filters by what the user types; picks an item on click.
 */
export default function ComboBox({
  value,
  onChange,
  options = [],
  placeholder,
  disabled,
  readOnly,
  className,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef         = useRef(null);

  const q        = String(value || '').toLowerCase();
  const valid    = (options || []).filter(o => o != null);
  const filtered = q
    ? valid.filter(o =>
        String(o.value ?? o).toLowerCase().includes(q) ||
        String(o.label ?? '').toLowerCase().includes(q)
      )
    : valid;

  useEffect(() => {
    const h = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        className={className || 'form-input'}
        value={value || ''}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete="off"
        onChange={e => { onChange(e.target.value, null); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && !readOnly && !disabled && filtered.length > 0 && (
        <ul
          className="absolute z-[9999] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-0.5 max-h-52 overflow-y-auto text-[12px]"
          style={{ top: '100%' }}
        >
          {filtered.slice(0, 80).map((o, i) => {
            const val = o.value ?? o;
            const lbl = o.label ?? val;
            return (
              <li
                key={i}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                onMouseDown={() => { onChange(val, o); setOpen(false); }}
              >
                {lbl}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
