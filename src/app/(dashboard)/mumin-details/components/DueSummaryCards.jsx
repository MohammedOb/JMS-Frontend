'use client';

import clsx from 'clsx';
import { fmt } from '../utils';

export default function DueSummaryCards({ due }) {
  const cards = [
    { label: 'Sabeel Due',   val: due?.sabeelDue,   yr: 'Old pending' },
    { label: 'FMB Due',      val: due?.fmbDue,       yr: 'Old pending' },
    { label: 'S. Niyaz Due', val: due?.sniyazDue,    yr: 'Shehrullah' },
    { label: 'HIM Due',      val: due?.himDue,        yr: 'HIM' },
    { label: 'Vajebaat Due', val: due?.vajebaatDue,  yr: 'Total remaining' },
  ];

  return (
    <div className="grid grid-cols-5 gap-2 mb-3">
      {cards.map(d => (
        <div key={d.label} className="bg-white border border-border rounded-lg px-3 py-2.5 text-center shadow-sm">
          <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-[.6px] mb-1">{d.label}</div>
          <div className={clsx('font-display text-[16px] font-bold',
            d.val == null ? 'text-gray-400' : d.val > 0 ? 'text-red-600' : 'text-green-600'
          )}>
            {d.val == null ? '—' : fmt(d.val)}
          </div>
          <div className="text-[9px] text-gray-400 mt-0.5">{d.yr}</div>
        </div>
      ))}
    </div>
  );
}
