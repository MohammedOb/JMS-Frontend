'use client';
import { useState, useEffect, useRef } from 'react';

export default function MultiComboBox({ value = [], options = [], placeholder, onChange }) {
  const [inputVal, setInputVal] = useState('');
  const [open, setOpen]         = useState(false);
  const wrapRef                 = useRef(null);

  const q        = inputVal.toLowerCase();
  const filtered = options.filter(o => !value.includes(o) && (q ? o.toLowerCase().includes(q) : true));

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const select = (opt) => { onChange([...value, opt]); setInputVal(''); setOpen(true); };
  const remove = (opt) => onChange(value.filter(v => v !== opt));

  return (
    <div ref={wrapRef} className="relative">
      <div
        className="form-input min-h-[36px] flex flex-wrap gap-1 items-center cursor-text py-1"
        onClick={() => { setOpen(true); wrapRef.current?.querySelector('input')?.focus(); }}
      >
        {value.map(v => (
          <span key={v} className="bg-blue-100 text-blue-700 text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
            {v}
            <button
              type="button"
              onMouseDown={e => { e.stopPropagation(); remove(v); }}
              className="text-blue-400 hover:text-blue-700 leading-none ml-0.5"
            >✕</button>
          </span>
        ))}
        <input
          type="text"
          value={inputVal}
          onChange={e => { setInputVal(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={value.length ? '' : placeholder}
          className="flex-1 min-w-[80px] outline-none bg-transparent text-[13px]"
          autoComplete="off"
        />
      </div>
      {open && filtered.length > 0 && (
        <ul
          className="absolute z-[9999] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-0.5 max-h-52 overflow-y-auto text-[12px]"
          style={{ top: '100%' }}
        >
          {filtered.slice(0, 80).map((opt, i) => (
            <li key={i} className="px-3 py-2 hover:bg-blue-50 cursor-pointer" onMouseDown={() => select(opt)}>
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
