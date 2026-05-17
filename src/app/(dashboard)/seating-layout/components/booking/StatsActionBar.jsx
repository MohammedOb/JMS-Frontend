'use client';

import { CheckIcon, XIcon, PrintIcon, DownloadIcon } from '@/components/shared/Icons';

function StatChip({ label, value, color }) {
  return (
    <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${color}`}>
      <span className="text-lg font-bold font-display">{value}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>
    </div>
  );
}

export default function StatsActionBar({ stats, onAutoAssign, onClearAll, onPrint, onExport }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3 flex-wrap">
          <StatChip label="Total"     value={stats.total}     color="border-gray-200 bg-gray-50 text-gray-700" />
          <StatChip label="Allocated" value={stats.allocated} color="border-red-200 bg-red-50 text-red-700" />
          <StatChip label="Available" value={stats.available} color="border-green-200 bg-green-50 text-green-700" />
          <StatChip label="Blocked"   value={stats.blocked}   color="border-yellow-200 bg-yellow-50 text-yellow-700" />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="w-4 h-4 rounded bg-gray-200 border border-gray-300 inline-block" />Available
            <span className="w-4 h-4 rounded bg-red-500 inline-block ml-1" />Allocated
            <span className="w-4 h-4 rounded bg-yellow-400 inline-block ml-1" />Blocked
          </div>
          <button onClick={onAutoAssign} className="btn-secondary text-sm flex items-center gap-1.5">
            <CheckIcon className="w-3.5 h-3.5" />Auto Assign
          </button>
          <button onClick={onClearAll} className="btn-danger text-sm flex items-center gap-1.5">
            <XIcon className="w-3.5 h-3.5" />Clear All
          </button>
          <button onClick={onPrint} className="btn-secondary text-sm flex items-center gap-1.5">
            <PrintIcon className="w-3.5 h-3.5" />Print
          </button>
          <button onClick={onExport} className="btn-secondary text-sm flex items-center gap-1.5">
            <DownloadIcon className="w-3.5 h-3.5" />Excel
          </button>
        </div>
      </div>
    </div>
  );
}
