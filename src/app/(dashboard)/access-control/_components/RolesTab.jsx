'use client';

import { useState } from 'react';
import { EditIcon } from '@/components/shared/Icons';
import Modal from '@/components/shared/Modal';
import { roleColor, initials } from './constants';

export default function RolesTab({ roles, loading, can, onEditRole, onToggleActive }) {
  const [confirm, setConfirm] = useState(null); // { role, newValue }
  const [saving,  setSaving]  = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onToggleActive(confirm.role, confirm.newValue);
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-16 text-gray-400">Loading roles…</div>
        ) : roles.map((r, i) => (
          <div key={r.id} className="card hover:shadow-md transition-shadow">
            <div className="card-body">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${roleColor(i)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                  {initials(r.name)}
                </div>

                {/* Active / Inactive toggle */}
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-semibold ${r.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                    {r.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    title={r.is_active ? 'Deactivate role' : 'Activate role'}
                    onClick={() => setConfirm({ role: r, newValue: !r.is_active })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                      r.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      r.is_active ? 'translate-x-[18px]' : 'translate-x-[2px]'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="font-semibold text-gray-800 mb-0.5">{r.name}</div>
              <div className="text-[11px] text-gray-500 mb-3 line-clamp-2">{r.description || '—'}</div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="badge badge-blue">{r.permission_count} permissions</span>
                  {r.is_system_role ? <span className="badge badge-amber text-[10px]">System</span> : null}
                </div>
                {can('roles.edit') && (
                  <button className="btn btn-secondary btn-sm" onClick={() => onEditRole(r)}>
                    <EditIcon className="w-3 h-3 mr-1" />Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation modal */}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        size="sm"
        title={confirm?.newValue ? 'Activate Role' : 'Deactivate Role'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setConfirm(null)} disabled={saving}>
              Cancel
            </button>
            <button
              className={`btn ${confirm?.newValue ? 'btn-primary' : 'btn-danger'}`}
              onClick={handleConfirm}
              disabled={saving}
            >
              {saving ? 'Saving…' : confirm?.newValue ? 'Yes, Activate' : 'Yes, Deactivate'}
            </button>
          </>
        }
      >
        <p className="text-[13px] text-gray-700">
          {confirm?.newValue
            ? <>Are you sure you want to <span className="font-semibold text-green-600">activate</span> the role <span className="font-semibold">"{confirm?.role?.name}"</span>? Users with this role will gain its permissions immediately on next login.</>
            : <>Are you sure you want to <span className="font-semibold text-red-600">deactivate</span> the role <span className="font-semibold">"{confirm?.role?.name}"</span>? Users assigned this role will lose its permissions on next login.</>
          }
        </p>
      </Modal>
    </>
  );
}
