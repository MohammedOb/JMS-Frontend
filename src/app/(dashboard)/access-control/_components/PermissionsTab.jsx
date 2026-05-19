'use client';

import { useState } from 'react';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, RefreshIcon } from '@/components/shared/Icons';
import { moduleColor } from './constants';

export default function PermissionsTab({
  permissions,
  loading,
  onRefresh,
  onAddPermission,
  onEditPermission,
  onDeletePermission,
}) {
  const [search, setSearch] = useState('');

  const filtered = permissions.filter(p =>
    !search ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.module.toLowerCase().includes(search.toLowerCase()) ||
    (p.label || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const byModule = filtered.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            className="form-input pl-8 text-[12px]"
            placeholder="Search by code, label, description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="text-[12px] text-gray-500">
          {filtered.length} of {permissions.length} permissions · {Object.keys(byModule).length} modules
        </span>
        <button className="btn btn-secondary btn-sm" onClick={onRefresh}>
          <RefreshIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-3">
          {Object.entries(byModule).map(([module, perms]) => (
            <div key={module} className="card">
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${moduleColor(module)}`}>
                    {module}
                  </span>
                  <span className="capitalize text-gray-700">{module.replace(/_/g, ' ')}</span>
                  <span className="badge badge-blue text-[10px]">{perms.length}</span>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => onAddPermission(module)}>
                  <PlusIcon className="w-3 h-3 mr-1" />Add to {module}
                </button>
              </div>

              <div className="divide-y divide-border">
                {perms.map(p => (
                  <div key={p.id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold shrink-0 w-28 text-center mt-0.5 ${moduleColor(p.module)}`}>
                      {p.action}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold font-mono text-gray-800">{p.code}</div>
                      {p.label
                        ? <div className="text-[12px] font-medium text-gray-800 mt-0.5">{p.label}</div>
                        : <div className="text-[11px] italic text-gray-400 mt-0.5">No label</div>
                      }
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {p.description || <span className="italic">No description</span>}
                      </div>
                      {p.controls?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {p.controls.map(c => (
                            <span key={c} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{c}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 shrink-0 mt-0.5">
                      <button className="btn btn-secondary btn-sm" title="Edit" onClick={() => onEditPermission(p)}>
                        <EditIcon className="w-3 h-3" />
                      </button>
                      <button className="btn btn-danger btn-sm" title="Delete" onClick={() => onDeletePermission(p)}>
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(byModule).length === 0 && (
            <div className="text-center py-16 text-gray-400">
              {search ? `No permissions match "${search}"` : 'No permissions found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
