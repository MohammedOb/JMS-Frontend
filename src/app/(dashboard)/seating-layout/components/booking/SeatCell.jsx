'use client';

import { SEAT_COLORS } from '../constants';

export default function SeatCell({ row, col, allocation, onClick }) {
  const status     = allocation ? allocation.SeatStatus : 'Available';
  const colorClass = SEAT_COLORS[status] || SEAT_COLORS.Available;
  const title      = allocation?.FullName
    ? `${allocation.FullName}${allocation.Age ? ` · Age ${allocation.Age}` : ''} (ITS: ${allocation.ITSNo})`
    : `${row}${col} — Available`;

  return (
    <button
      onClick={() => onClick(row, col, allocation)}
      title={title}
      className={`w-9 h-9 rounded text-[10px] font-semibold transition-all flex items-center justify-center overflow-hidden leading-none ${colorClass}`}
    >
      {status === 'Allocated' && allocation?.FullName ? (
        <span className="truncate px-0.5 text-[8px]">{allocation.FullName.split(' ')[0]}</span>
      ) : status === 'Blocked' ? (
        // Single blocked cell (not part of a rect group) — show remark in the cell
        <span className="text-[7px] font-bold leading-tight px-0.5 text-center break-all">
          {allocation?.Remark || '✕'}
        </span>
      ) : null}
    </button>
  );
}
