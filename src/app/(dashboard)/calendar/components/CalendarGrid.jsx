'use client';

import clsx from 'clsx';
import { MONTHS, DAYS, getHijriLabel } from '../utils/hijri';

export default function CalendarGrid({
  year, month, cells, bookingsByDay, todayKey,
  selectedCellKey, onCellClick, onAddClick, canAdd,
  onPrev, onNext,
}) {
  const prevMonthLabel = MONTHS[(month + 11) % 12];
  const nextMonthLabel = MONTHS[(month + 1) % 12];
  const currentMonthLabel = `${MONTHS[month]} ${year}`;


  return (
    <div className="card overflow-hidden">
      {/* ── Month nav bar ── */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center bg-navy-700 px-4 py-2.5 text-white">
        <div>
          <button
            onClick={onPrev}
            className="rounded-md bg-white/10 hover:bg-white/20 px-3 py-1.5 text-[12px] font-semibold transition-colors"
          >
            ← {prevMonthLabel}
          </button>
        </div>
        <div className="text-center text-[15px] font-display font-bold">{currentMonthLabel}</div>
        <div className="flex justify-end">
          <button
            onClick={onNext}
            className="rounded-md bg-white/10 hover:bg-white/20 px-3 py-1.5 text-[12px] font-semibold transition-colors"
          >
            {nextMonthLabel} →
          </button>
        </div>
      </div>

      <div className="bg-white px-3 pt-3 pb-4">
        {/* ── Day headers ── */}
        <div className="grid grid-cols-7 border border-b-0 border-border rounded-t-lg overflow-hidden">
          {DAYS.map((day) => (
            <div
              key={day}
              className="bg-navy-800 px-2 py-2.5 text-center text-[12px] font-bold uppercase tracking-wider text-white border-r border-navy-700 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* ── Calendar cells ── */}
        <div className="grid grid-cols-7 border border-t-0 border-border rounded-b-lg overflow-hidden">
          {cells.map((cell) => {
            const dayBookings = bookingsByDay[cell.key] || [];
            const isToday = cell.key === todayKey;
            const isSelected = cell.key === selectedCellKey;
            const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 7;

            return (
              <div
                key={cell.key}
                onClick={() => onCellClick(cell)}
                className={clsx(
                  'min-h-[112px] p-2 flex flex-col border-r border-b border-border last:border-r-0 cursor-pointer group transition-colors',
                  cell.isCurrentMonth
                    ? isWeekend ? 'bg-surface/60 hover:bg-blue-50/40' : 'bg-white hover:bg-blue-50/20'
                    : 'bg-surface/40 hover:bg-surface',
                  isSelected && 'ring-[3px] ring-inset ring-blue-500 z-10 relative bg-blue-100'
                )}
              >
                {/* Hijri date */}
                <div className={clsx(
                  'text-[10.5px] font-semibold leading-tight mb-1 truncate',
                  cell.isCurrentMonth ? 'text-[#8a6a10]' : 'text-gray-400'
                )}>
                  {getHijriLabel(cell.date)}
                </div>

                {/* Gregorian day + add button */}
                <div className="flex items-start justify-between gap-1 mb-1">
                  <div className={clsx(
                    'text-[24px] font-bold leading-none',
                    cell.isCurrentMonth ? (isToday ? 'text-red-600' : 'text-navy-800') : 'text-gray-300'
                  )}>
                    {cell.day}
                  </div>
                  {canAdd && (
                    <button
                      onClick={e => { e.stopPropagation(); onAddClick(cell); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-navy-800 text-white text-[13px] font-bold hover:bg-blue-500 mt-0.5"
                      title="Add event"
                    >
                      +
                    </button>
                  )}
                </div>

                {/* Event list */}
                <div className="flex-1 space-y-0.5 overflow-hidden">
                  {dayBookings.slice(0, 4).map((b, i) => (
                    <div key={i} className="text-[13px] font-medium leading-tight text-blue-600 truncate">
                      {b.eventName || b.name || 'Event'}
                    </div>
                  ))}
                  {dayBookings.length > 4 && (
                    <div className="text-[10px] font-semibold text-gray-400">
                      +{dayBookings.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Legend ── */}
      </div>
    </div>
  );
}
