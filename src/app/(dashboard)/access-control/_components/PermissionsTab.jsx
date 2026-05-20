'use client';

import { useState } from 'react';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, RefreshIcon } from '@/components/shared/Icons';
import Modal from '@/components/shared/Modal';
import { moduleColor } from './constants';

const CONFIRM_WORD = 'delete';

export default function PermissionsTab({
  permissions,
  loading,
  onRefresh,
  onAddPermission,
  onEditPermission,
  onDeletePermission,
}) {
  const [search,       setSearch]       = useState('');
  const [deleteModal,  setDeleteModal]  = useState(false);
  const [confirmText,  setConfirmText]  = useState('');
  const [targetPerm,   setTargetPerm]   = useState(null);

  const openDelete = (p) => {
    setTargetPerm(p);
    setConfirmText('');
    setDeleteModal(true);
  };

  const confirmDelete = () => {
    onDeletePermission(targetPerm);
    setDeleteModal(false);
    setTargetPerm(null);
  };

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
    <>
      <div>
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="form-input pl-9 text-[13px]"
              placeholder="Search by code, label, description…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="text-[13px] font-semibold text-gray-600">
            {filtered.length} of {permissions.length} permissions
            <span className="text-gray-400 font-normal"> · {Object.keys(byModule).length} modules</span>
          </span>
          <button className="btn btn-secondary btn-sm" onClick={onRefresh} title="Refresh">
            <RefreshIcon className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-[14px]">Loading…</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(byModule).map(([module, perms]) => (
              <div key={module} className="rounded-xl border border-border overflow-hidden shadow-sm">

                {/* Module header */}
                <div className="flex items-center justify-between px-4 py-3 bg-navy-800">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[11px] font-mono px-2.5 py-1 rounded-md font-bold ${moduleColor(module)}`}>
                      {module}
                    </span>
                    <span className="text-[15px] font-bold text-white capitalize tracking-wide">
                      {module.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] font-bold bg-white/15 text-white/90 px-2 py-0.5 rounded-full">
                      {perms.length}
                    </span>
                  </div>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white text-[12px] font-semibold border border-white/20 transition-colors"
                    onClick={() => onAddPermission(module)}
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Add to {module}
                  </button>
                </div>

                {/* Permission rows */}
                <div className="divide-y divide-border bg-white">
                  {perms.map(p => (
                    <div
                      key={p.id}
                      className="group flex items-start gap-4 px-4 py-4 border-l-[3px] border-l-transparent hover:border-l-blue-500 hover:bg-blue-50/70 transition-all duration-100"
                    >
                      {/* Action badge */}
                      <span className={`text-[11px] font-mono px-2.5 py-1 rounded-md font-bold shrink-0 min-w-[76px] text-center mt-0.5 leading-tight ${moduleColor(p.module)}`}>
                        {p.action}
                      </span>

                      {/* Text content */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="text-[13px] font-bold font-mono text-navy-900">
                          {p.code}
                        </div>
                        {p.label
                          ? <div className="text-[14.5px] font-semibold text-gray-900">{p.label}</div>
                          : <div className="text-[12px] italic text-gray-400">No label</div>
                        }
                        <div className="text-[12.5px] text-gray-600 leading-snug">
                          {p.description || <span className="italic text-gray-400">No description</span>}
                        </div>
                        {p.controls?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {p.controls.map(c => (
                              <span key={c} className="text-[11.5px] bg-gray-100 border border-gray-300 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Row actions — appear on hover */}
                      <div className="flex gap-2 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="btn btn-secondary btn-sm px-2.5"
                          title="Edit"
                          onClick={() => onEditPermission(p)}
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          className="btn btn-danger btn-sm px-2.5"
                          title="Delete"
                          onClick={() => openDelete(p)}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(byModule).length === 0 && (
              <div className="text-center py-20 text-gray-500 text-[14px]">
                {search ? `No permissions match "${search}"` : 'No permissions found'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        size="sm"
        title="Delete Permission"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={confirmDelete}
              disabled={confirmText !== CONFIRM_WORD}
            >
              <TrashIcon className="w-3.5 h-3.5 mr-1.5" />
              Delete Permission
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-[13px] text-red-700">
            This will permanently delete{' '}
            <span className="font-bold font-mono">{targetPerm?.code}</span>.
            This action cannot be undone.
          </div>
          <div>
            <label className="form-label">
              Type <span className="font-mono font-bold text-red-600">delete</span> to confirm
            </label>
            <input
              className="form-input"
              placeholder="Type delete to confirm"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              autoFocus
            />
          </div>
          {confirmText.length > 0 && confirmText !== CONFIRM_WORD && (
            <p className="text-[12px] text-red-500">Must type exactly "delete" to proceed</p>
          )}
        </div>
      </Modal>
    </>
  );
}
