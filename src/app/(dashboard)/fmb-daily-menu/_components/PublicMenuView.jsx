import { useState } from 'react';
import { PAGE_SIZES, buildLine } from './constants';
import { fmtDate } from '@/utils/dateUtils';
import { ClipboardListIcon, SendIcon } from '@/components/shared/Icons';

function ItemChip({ value, isFirst, isLast, onMoveLeft, onMoveRight }) {
  return (
    <span className="inline-flex items-center gap-0 bg-gray-100 border border-gray-200 rounded text-[12px] text-gray-700 overflow-hidden">
      <button
        className="px-1.5 py-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-default transition-colors"
        disabled={isFirst}
        onClick={onMoveLeft}
        title="Move left"
      >‹</button>
      <span className="px-1 py-0.5 select-none">{value}</span>
      <button
        className="px-1.5 py-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-20 disabled:cursor-default transition-colors"
        disabled={isLast}
        onClick={onMoveRight}
        title="Move right"
      >›</button>
    </span>
  );
}

export default function PublicMenuView({ rows, getItems, onMove, onCopy, onSendWA }) {
  const [pageSize, setPageSize] = useState(30);

  if (!rows.length) return null;

  const displayed = pageSize === 'All' ? rows : rows.slice(0, pageSize);

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <span>Public Menu View</span>
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-gray-400">{rows.length} records</span>
          <select
            className="form-select py-0.5 px-2 text-[12px] w-auto"
            value={pageSize}
            onChange={e => setPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value))}
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="p-4 space-y-0">
        {displayed.map((r, i) => {
          const items = getItems(r);
          const line  = buildLine(r.menu_date, items);
          return (
            <div key={i} className="py-3 border-b border-border last:border-0">
              {/* Reorderable chips */}
              <div className="flex items-center flex-wrap gap-1.5 mb-2">
                <span className="text-[11px] bg-blue-100 text-blue-700 rounded px-2 py-0.5 font-medium shrink-0">
                  {r.meal_type}
                </span>
                <span className="text-[12px] text-gray-500 font-medium shrink-0">{fmtDate(r.menu_date)}</span>
                {items.map((val, idx) => (
                  <ItemChip
                    key={idx}
                    value={val}
                    isFirst={idx === 0}
                    isLast={idx === items.length - 1}
                    onMoveLeft={() => onMove(r, idx, -1)}
                    onMoveRight={() => onMove(r, idx, 1)}
                  />
                ))}
              </div>
              {/* Resulting line + actions */}
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-gray-500 flex-1">{line}</span>
                <button className="btn btn-secondary btn-sm" title="Copy" onClick={() => onCopy(line)}>
                  <ClipboardListIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  className="btn btn-sm bg-green-600 hover:bg-green-700 text-white border-0"
                  title="Send via WhatsApp"
                  onClick={() => onSendWA(line)}
                >
                  <SendIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
