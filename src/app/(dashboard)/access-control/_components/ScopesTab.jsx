'use client';

import { EditIcon, RefreshIcon, TrashIcon } from '@/components/shared/Icons';
import { scopeTypeColor } from './constants';

export default function ScopesTab({ scopes, loading, can, onRefresh, onEditScope, onDeleteScope }) {
  const byType = (scopes || []).reduce((acc, s) => {
    if (!acc[s.type]) acc[s.type] = [];
    acc[s.type].push(s);
    return acc;
  }, {});

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-[13px] font-semibold text-gray-600">
          {(scopes || []).length} scope entries
          <span className="text-gray-400 font-normal"> · {Object.keys(byType).length} types</span>
        </span>
        <button className="btn btn-secondary btn-sm" onClick={onRefresh} title="Refresh">
          <RefreshIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden shadow-sm">
        {/* Column header */}
        <div className="grid grid-cols-[180px_1fr_1fr_72px_96px] gap-4 px-4 py-3 bg-navy-800">
          {['Type', 'Value', 'Label', 'Sort', 'Actions'].map(h => (
            <div key={h} className="text-[11px] font-bold text-white/70 uppercase tracking-wider">{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-[14px] bg-white">Loading…</div>
        ) : (scopes || []).length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-[14px] bg-white">No scopes defined</div>
        ) : (
          <div className="divide-y divide-border bg-white">
            {Object.entries(byType).map(([type, typeScopes]) =>
              typeScopes.map((s, i) => (
                <div
                  key={s.id}
                  className="group grid grid-cols-[180px_1fr_1fr_72px_96px] items-center gap-4 px-4 py-3.5 border-l-[3px] border-l-transparent hover:border-l-blue-500 hover:bg-blue-50/70 transition-all duration-100"
                >
                  {/* Type — pill on first row, indent arrow on rest */}
                  <div>
                    {i === 0 ? (
                      <span className={`inline-block text-[11.5px] font-bold px-2.5 py-1 rounded-md capitalize ${scopeTypeColor(type)}`}>
                        {type}
                      </span>
                    ) : (
                      <span className="text-[12px] text-gray-300 pl-2">↳</span>
                    )}
                  </div>

                  {/* Value */}
                  <div className="text-[13px] font-mono font-semibold text-navy-900">{s.value}</div>

                  {/* Label */}
                  <div className="text-[13px] font-medium text-gray-700">
                    {s.label || <span className="italic text-gray-400">—</span>}
                  </div>

                  {/* Sort */}
                  <div className="text-[13px] text-gray-500 text-center">{s.sort_order ?? '—'}</div>

                  {/* Actions — appear on hover */}
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="btn btn-secondary btn-sm px-2.5" title="Edit" onClick={() => onEditScope(s)}>
                      <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    <button className="btn btn-danger btn-sm px-2.5" title="Delete" onClick={() => onDeleteScope(s)}>
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
