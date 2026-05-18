'use client';

import { useState } from 'react';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, RefreshIcon, CheckIcon } from '@/components/shared/Icons';
import { moduleColor, MEMBER_FEATURE_CATALOG, SAFAI_FEATURE_CATALOG } from './constants';

// ── Reusable catalog section ─────────────────────────────────────────────────
function CatalogSection({ module, colorClass, catalog, dbPermissions, onAddPermission, onEditPermission, onDeletePermission, onQuickCreate }) {
  const dbByCode = Object.fromEntries(dbPermissions.map(p => [p.code, p]));

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${colorClass}`}>
            {module}
          </span>
          <span className="capitalize text-gray-700">{module.replace(/_/g, ' ')}</span>
          <span className="badge badge-blue text-[10px]">
            {catalog.filter(c => dbByCode[c.code]).length} / {catalog.length}
          </span>
          <span className="text-[10px] text-gray-400">pre-defined feature catalog</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => onAddPermission(module)}>
          <PlusIcon className="w-3 h-3 mr-1" />Add to {module}
        </button>
      </div>

      <div className="divide-y divide-border">
        {catalog.map(item => {
          const dbPerm = dbByCode[item.code];
          return (
            <div key={item.code} className={`flex items-start gap-3 px-4 py-3 ${dbPerm ? 'hover:bg-surface' : 'bg-amber-50/40'}`}>
              <div className="mt-0.5 flex-shrink-0">
                {dbPerm ? (
                  <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckIcon className="w-2.5 h-2.5 text-green-600" />
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 text-[9px] font-bold">!</span>
                )}
              </div>

              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold shrink-0 w-36 text-center ${colorClass} mt-0.5`}>
                {item.action}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-gray-800 font-mono">{item.code}</span>
                  {!dbPerm && (
                    <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">NOT IN DB</span>
                  )}
                </div>
                <div className="text-[11px] font-medium text-gray-700 mt-0.5">{item.label}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{item.description}</div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {item.controls.map(c => (
                    <span key={c} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{c}</span>
                  ))}
                </div>
              </div>

              <div className="flex gap-1 shrink-0 mt-0.5">
                {dbPerm ? (
                  <>
                    <button className="btn btn-secondary btn-sm" title="Edit description" onClick={() => onEditPermission(dbPerm)}>
                      <EditIcon className="w-3 h-3" />
                    </button>
                    <button className="btn btn-danger btn-sm" title="Delete permission" onClick={() => onDeletePermission(dbPerm)}>
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <button className="btn btn-primary btn-sm" title="Create this permission in DB" onClick={() => onQuickCreate(item)}>
                    <PlusIcon className="w-3 h-3 mr-1" />Create
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Extra DB permissions for this module not in the catalog */}
        {dbPermissions.filter(p => !catalog.find(c => c.code === p.code)).map(p => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface">
            <div className="w-4 flex-shrink-0" />
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold shrink-0 w-36 text-center ${colorClass}`}>
              {p.action}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-gray-800 font-mono">{p.code}</div>
              <div className="text-[11px] text-gray-400 truncate">
                {p.description || <span className="italic">No description</span>}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button className="btn btn-secondary btn-sm" onClick={() => onEditPermission(p)}>
                <EditIcon className="w-3 h-3" />
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => onDeletePermission(p)}>
                <TrashIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Catalog modules with pre-defined schemas ──────────────────────────────────
const CATALOG_MODULES = {
  members: { catalog: MEMBER_FEATURE_CATALOG, colorClass: 'bg-indigo-100 text-indigo-700' },
  safai:   { catalog: SAFAI_FEATURE_CATALOG,  colorClass: 'bg-orange-100 text-orange-700' },
};

// ── Main tab ─────────────────────────────────────────────────────────────────
export default function PermissionsTab({
  permissions,
  loading,
  onRefresh,
  onAddPermission,
  onEditPermission,
  onDeletePermission,
  onQuickCreate,
}) {
  const [search, setSearch] = useState('');

  const filtered = permissions.filter(p =>
    !search ||
    p.code.includes(search.toLowerCase()) ||
    p.module.includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const byModule = filtered.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  // Ensure catalog modules always appear even if DB has 0 rows for them
  Object.keys(CATALOG_MODULES).forEach(m => { if (!byModule[m]) byModule[m] = []; });

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            className="form-input pl-8 text-[12px]"
            placeholder="Search permissions…"
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
          {Object.entries(byModule).map(([module, perms]) => {
            const catalogDef = CATALOG_MODULES[module];
            if (catalogDef) {
              return (
                <CatalogSection
                  key={module}
                  module={module}
                  colorClass={catalogDef.colorClass}
                  catalog={catalogDef.catalog}
                  dbPermissions={perms}
                  onAddPermission={onAddPermission}
                  onEditPermission={onEditPermission}
                  onDeletePermission={onDeletePermission}
                  onQuickCreate={onQuickCreate}
                />
              );
            }

            return (
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
                    <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold shrink-0 w-24 text-center ${moduleColor(p.module)}`}>
                        {p.action}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-gray-800 font-mono">{p.code}</div>
                        <div className="text-[11px] text-gray-400 truncate">
                          {p.description || <span className="italic">No description</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button className="btn btn-secondary btn-sm" onClick={() => onEditPermission(p)}>
                          <EditIcon className="w-3 h-3" />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => onDeletePermission(p)}>
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

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
