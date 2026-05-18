'use client';

import { EditIcon, RefreshIcon, TrashIcon } from '@/components/shared/Icons';

export default function ScopesTab({ scopes, loading, can, onRefresh, onEditScope, onDeleteScope }) {
  // Group by type for display
  const byType = (scopes || []).reduce((acc, s) => {
    if (!acc[s.type]) acc[s.type] = [];
    acc[s.type].push(s);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button className="btn btn-secondary btn-sm" onClick={onRefresh}>
          <RefreshIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          Scope Master
          <span className="badge badge-blue ml-2">{(scopes || []).length} entries</span>
        </div>

        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {['Type', 'Value', 'Label', 'Sort', 'Actions'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : (scopes || []).length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No scopes defined</td></tr>
              ) : Object.entries(byType).map(([type, typeScopes]) => (
                typeScopes.map((s, i) => (
                  <tr key={s.id} className="hover:bg-blue-500/[0.025]">
                    {i === 0 && (
                      <td
                        rowSpan={typeScopes.length}
                        className="px-3 py-2 border-t border-border font-semibold text-blue-700 capitalize align-top"
                      >
                        {type}
                      </td>
                    )}
                    <td className="px-3 py-2 border-t border-border font-mono text-[11.5px]">{s.value}</td>
                    <td className="px-3 py-2 border-t border-border text-gray-600">{s.label || '—'}</td>
                    <td className="px-3 py-2 border-t border-border text-gray-400 text-center">{s.sort_order}</td>
                    <td className="px-3 py-2 border-t border-border whitespace-nowrap">
                      <button className="btn btn-primary btn-sm mr-1" onClick={() => onEditScope(s)}>
                        <EditIcon className="w-3 h-3 mr-1" />Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => onDeleteScope(s)}>
                        <TrashIcon className="w-3 h-3 mr-1" />Delete
                      </button>
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
