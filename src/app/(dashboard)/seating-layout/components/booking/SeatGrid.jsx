'use client';

import { getRowLabel, buildSeatKey } from '../constants';
import SeatCell from './SeatCell';

export default function SeatGrid({ activeSec, seatMap, voidMap, onSeatClick }) {
  if (!activeSec) {
    return (
      <div className="bg-white rounded-xl border border-border p-12 text-center text-gray-400 shadow-sm">
        <p className="text-sm">Select a Hall and Section, then click Search to view the seating grid.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-sm overflow-auto">
      <p className="text-xs text-gray-500 mb-3 font-medium">
        {activeSec.SectionName} — {activeSec.SectionType} &nbsp;|&nbsp;
        {activeSec.RowCount} rows × {activeSec.ColCount} cols &nbsp;|&nbsp;
        Position: {activeSec.Position}
      </p>

      <table className="border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="w-8 h-8 bg-navy-800 text-white text-[10px] rounded text-center">*</th>
            {Array.from({ length: activeSec.ColCount }, (_, i) => (
              <th key={i} className="w-9 h-8 bg-navy-800 text-white text-[10px] rounded text-center">{i + 1}</th>
            ))}
            <th className="w-8 h-8 bg-navy-800 text-white text-[10px] rounded text-center">*</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: activeSec.RowCount }, (_, ri) => {
            const rowLabel = getRowLabel(ri);
            return (
              <tr key={rowLabel}>
                <td className="w-8 h-9 bg-navy-800 text-white text-[10px] font-bold rounded text-center">{rowLabel}</td>
                {Array.from({ length: activeSec.ColCount }, (_, ci) => {
                  const col = ci + 1;
                  const alloc = seatMap[buildSeatKey(rowLabel, col)] || null;
                  return (
                    <td key={col}>
                      <SeatCell row={rowLabel} col={col} allocation={alloc} voidInfo={voidMap?.[buildSeatKey(rowLabel, col)] || null} onClick={onSeatClick} />
                    </td>
                  );
                })}
                <td className="w-8 h-9 bg-navy-800 text-white text-[10px] font-bold rounded text-center">{rowLabel}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th className="w-8 h-8 bg-navy-800 text-white text-[10px] rounded text-center">*</th>
            {Array.from({ length: activeSec.ColCount }, (_, i) => (
              <th key={i} className="w-9 h-8 bg-navy-800 text-white text-[10px] rounded text-center">{i + 1}</th>
            ))}
            <th className="w-8 h-8 bg-navy-800 text-white text-[10px] rounded text-center">*</th>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
