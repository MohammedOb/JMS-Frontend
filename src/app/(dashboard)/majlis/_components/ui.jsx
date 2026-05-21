'use client';
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

// Shared UI primitives for Majlis Management

export const Label = ({ children }) => (
  <span className="block text-[10.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
    {children}
  </span>
);

export const RO = ({ value, accent }) => (
  <div className={`h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-md text-[13px] truncate ${accent || 'text-gray-700'}`}>
    {value || <span className="text-gray-300 italic text-[12px]">—</span>}
  </div>
);

export const inp = 'form-input h-9 text-[13px]';
export const sel = 'form-select h-9 text-[13px]';
export const td  = 'px-3 py-2.5 border-t border-gray-100 text-[12.5px] whitespace-nowrap';
export const th  = 'th-navy text-[11px] py-2.5';

export function StatusPill({ status }) {
  const map = {
    'Done':     'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    'Not Done': 'bg-red-100 text-red-700 ring-1 ring-red-200',
    'Pending':  'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  };
  const dot = {
    'Done':     'bg-emerald-500',
    'Not Done': 'bg-red-500',
    'Pending':  'bg-amber-500',
  };
  const cls = map[status] || 'bg-gray-100 text-gray-600 ring-1 ring-gray-200';
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status] || 'bg-gray-400'}`} />
      {status || 'Pending'}
    </span>
  );
}

export function CardSection({ children, color = 'blue', title, subtitle }) {
  const headerBg = {
    blue:   'bg-blue-600',
    indigo: 'bg-indigo-600',
    purple: 'bg-purple-600',
    teal:   'bg-teal-600',
    navy:   'bg-slate-700',
    green:  'bg-emerald-600',
    orange: 'bg-orange-500',
  }[color] || 'bg-blue-600';

  const borderColor = {
    blue:   'border-blue-200',
    indigo: 'border-indigo-200',
    purple: 'border-purple-200',
    teal:   'border-teal-200',
    navy:   'border-slate-300',
    green:  'border-emerald-200',
    orange: 'border-orange-200',
  }[color] || 'border-blue-200';

  return (
    <div className={`rounded-lg border ${borderColor} shadow-sm overflow-hidden`}>
      <div className={`${headerBg} px-4 py-2.5 flex items-center justify-between`}>
        <span className="text-white text-[11px] font-bold uppercase tracking-widest">{title}</span>
        {subtitle && <span className="text-white/60 text-[10px]">{subtitle}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function AutocompleteInput({ name, value: rawValue, onChange, options = [], placeholder, className }) {
  const value = rawValue ?? '';
  const [open, setOpen]       = useState(false);
  const [dropRect, setDropRect] = useState(null);
  const inputRef = useRef(null);

  const filtered = options
    .filter(o => !value || String(o).toLowerCase().includes(String(value).toLowerCase()))
    .slice(0, 20);

  const captureRect = () => {
    if (inputRef.current) setDropRect(inputRef.current.getBoundingClientRect());
  };

  const handleChange = (e) => {
    captureRect();
    onChange(e);
  };

  const dropdown = open && filtered.length > 0 && dropRect ? (
    <ul
      style={{ position: 'fixed', top: dropRect.bottom + 2, left: dropRect.left, width: dropRect.width, zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-lg shadow-2xl max-h-52 overflow-y-auto"
    >
      {filtered.map((o, i) => (
        <li
          key={i}
          className={`px-3 py-2 text-[12.5px] cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${
            String(value) === String(o)
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'hover:bg-blue-50 hover:text-blue-700'
          }`}
          onMouseDown={(e) => {
            e.preventDefault();
            onChange({ target: { name, value: String(o) } });
            setOpen(false);
          }}
        >
          {o}
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        name={name}
        className={className}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={handleChange}
        onFocus={() => { captureRect(); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
      />
      {dropdown && createPortal(dropdown, document.body)}
    </div>
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex bg-white border-b-2 border-gray-200 mb-5 overflow-x-auto">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-6 py-3.5 text-[13px] font-semibold border-b-2 -mb-[2px] transition-all whitespace-nowrap ${
            active === t.key
              ? 'border-blue-600 text-blue-700 bg-blue-50/60'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
