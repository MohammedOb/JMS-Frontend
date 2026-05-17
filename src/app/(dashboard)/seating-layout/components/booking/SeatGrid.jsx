'use client';

import { getRowLabel, getRowIndex, buildSeatKey } from '../constants';
import SeatCell from './SeatCell';

// Builds a map of anchorKey → spanInfo and a set of covered (skipped) keys.
// Handles two sources:
//   1. voidGroups  — permanent structural blocks (passed as raw DB rows)
//   2. seatMap     — blocked seats sharing the same Remark that form a complete rectangle
function buildSpans(voidGroups, seatMap) {
  const anchors = {};
  const covered = new Set();

  // ── Void groups (permanent) ───────────────────────────────────────────────
  for (const g of (voidGroups || [])) {
    const fi = getRowIndex(g.RowFrom);
    const ti = getRowIndex(g.RowTo);
    const cf = parseInt(g.ColFrom);
    const ct = parseInt(g.ColTo);
    const anchorKey = buildSeatKey(g.RowFrom, cf);
    anchors[anchorKey] = {
      label:   g.Label,
      rowSpan: ti - fi + 1,
      colSpan: ct - cf + 1,
      type:    'void',
      rowFrom: g.RowFrom,
      rowTo:   g.RowTo,
      colFrom: cf,
      colTo:   ct,
    };
    for (let ri = fi; ri <= ti; ri++) {
      for (let col = cf; col <= ct; col++) {
        const k = buildSeatKey(getRowLabel(ri), col);
        if (k !== anchorKey) covered.add(k);
      }
    }
  }

  // ── Blocked-range groups (event-specific) ─────────────────────────────────
  // Group all blocked seats that have a Remark, then check if each remark group
  // forms a complete filled rectangle — if so, render as a single spanning cell.
  const byRemark = {};
  for (const [key, alloc] of Object.entries(seatMap || {})) {
    if (alloc.SeatStatus !== 'Blocked' || !alloc.Remark) continue;
    if (!byRemark[alloc.Remark]) byRemark[alloc.Remark] = [];
    byRemark[alloc.Remark].push({ key, rowLabel: alloc.RowLabel, col: parseInt(alloc.ColNo) });
  }

  for (const [remark, cells] of Object.entries(byRemark)) {
    if (cells.length < 2) continue; // single cell: render via SeatCell as normal

    let minRi = Infinity, maxRi = -Infinity, minCol = Infinity, maxCol = -Infinity;
    for (const c of cells) {
      const ri = getRowIndex(c.rowLabel);
      minRi = Math.min(minRi, ri); maxRi = Math.max(maxRi, ri);
      minCol = Math.min(minCol, c.col); maxCol = Math.max(maxCol, c.col);
    }

    // Verify the group is a complete rectangle (no missing cells inside the bbox)
    const keySet = new Set(cells.map(c => c.key));
    let complete = true;
    outer: for (let ri = minRi; ri <= maxRi; ri++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (!keySet.has(buildSeatKey(getRowLabel(ri), col))) { complete = false; break outer; }
      }
    }
    if (!complete) continue;

    const anchorRow    = getRowLabel(minRi);
    const anchorKey    = buildSeatKey(anchorRow, minCol);
    anchors[anchorKey] = {
      label:   remark,
      rowSpan: maxRi - minRi + 1,
      colSpan: maxCol - minCol + 1,
      type:    'blocked',
      rowFrom: getRowLabel(minRi),
      rowTo:   getRowLabel(maxRi),
      colFrom: minCol,
      colTo:   maxCol,
    };
    for (let ri = minRi; ri <= maxRi; ri++) {
      for (let col = minCol; col <= maxCol; col++) {
        const k = buildSeatKey(getRowLabel(ri), col);
        if (k !== anchorKey) covered.add(k);
      }
    }
  }

  return { anchors, covered };
}

// Dynamic font size based on the area of the span so large blocks get big text.
function spanFontClass(rowSpan, colSpan) {
  const area = rowSpan * colSpan;
  if (area >= 30) return 'text-lg font-extrabold';
  if (area >= 10) return 'text-base font-bold';
  if (area >= 4)  return 'text-sm font-semibold';
  return 'text-xs font-medium';
}

export default function SeatGrid({ activeSec, seatMap, voidGroups, onSeatClick, onSpanClick }) {
  if (!activeSec) {
    return (
      <div className="bg-white rounded-xl border border-border p-12 text-center text-gray-400 shadow-sm">
        <p className="text-sm">Select a Hall and Section, then click Search to view the seating grid.</p>
      </div>
    );
  }

  const { anchors, covered } = buildSpans(voidGroups, seatMap);

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
                  const key = buildSeatKey(rowLabel, col);

                  // Cell is covered by an earlier span — omit entirely
                  if (covered.has(key)) return null;

                  // Span anchor cell — render as one big labelled block
                  const span = anchors[key];
                  if (span) {
                    const isVoid = span.type === 'void';
                    return (
                      <td
                        key={col}
                        rowSpan={span.rowSpan}
                        colSpan={span.colSpan}
                        title={`${isVoid ? 'Void' : 'Blocked'}: ${span.label} — click to manage`}
                        onClick={() => onSpanClick?.(span)}
                        className={`rounded align-middle text-center px-2 py-1 select-none cursor-pointer transition-opacity hover:opacity-80
                          ${isVoid
                            ? 'bg-slate-700 text-white'
                            : 'bg-yellow-400 text-yellow-900 border border-yellow-500'
                          } ${spanFontClass(span.rowSpan, span.colSpan)}`}
                      >
                        {span.label}
                      </td>
                    );
                  }

                  // Normal seat cell
                  return (
                    <td key={col}>
                      <SeatCell
                        row={rowLabel}
                        col={col}
                        allocation={seatMap[key] || null}
                        onClick={onSeatClick}
                      />
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
