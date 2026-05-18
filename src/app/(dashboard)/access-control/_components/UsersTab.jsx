'use client';

import { useState } from 'react';
import { EditIcon, KeyIcon, SearchIcon, RefreshIcon } from '@/components/shared/Icons';
import Modal from '@/components/shared/Modal';
import { roleColor, initials, fmtDate } from './constants';

export default function UsersTab({ users, loading, can, onEditUser, onResetPassword, onRefresh, onToggleActive }) {
  const [search,  setSearch]  = useState('');
  const [confirm, setConfirm] = useState(null); // { user, newValue }
  const [saving,  setSaving]  = useState(false);

  const filtered = users.filter(u =>
    !search ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onToggleActive(confirm.user, confirm.newValue);
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  return (
    <>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 max-w-xs">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            className="form-input pl-8 text-[12px]"
            placeholder="Search users…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onRefresh}>
          <RefreshIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          System Users <span className="badge badge-blue ml-2">{users.length}</span>
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {['', 'User', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border w-9">
                    <div className={`w-7 h-7 rounded-full ${roleColor(i)} flex items-center justify-center text-white text-[10px] font-bold`}>
                      {initials(u.full_name || u.username)}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <div className="font-semibold text-gray-800">{u.username}</div>
                    <div className="text-[11px] text-gray-400">{u.full_name || '—'}</div>
                  </td>
                  <td className="px-3 py-2.5 border-t border-border">
                    {u.role
                      ? <span className="badge badge-blue text-[10px]">{u.role.name}</span>
                      : <span className="text-gray-400 text-[11px]">No role</span>}
                  </td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold ${u.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        title={u.is_active ? 'Deactivate user' : 'Activate user'}
                        onClick={() => setConfirm({ user: u, newValue: !u.is_active })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                          u.is_active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                          u.is_active ? 'translate-x-[18px]' : 'translate-x-[2px]'
                        }`} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 border-t border-border text-gray-500 text-[11px]">
                    {fmtDate(u.last_login_at)}
                  </td>
                  <td className="px-3 py-2.5 border-t border-border whitespace-nowrap">
                    {can('users.edit') && (
                      <button className="btn btn-primary btn-sm mr-1" onClick={() => onEditUser(u)}>
                        <EditIcon className="w-3 h-3 mr-1" />Edit
                      </button>
                    )}
                    {can('users.reset_password') && (
                      <button className="btn btn-secondary btn-sm" onClick={() => onResetPassword(u.id)}>
                        <KeyIcon className="w-3 h-3 mr-1" />Password
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation modal */}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        size="sm"
        title={confirm?.newValue ? 'Activate User' : 'Deactivate User'}
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
            ? <>Are you sure you want to <span className="font-semibold text-green-600">activate</span> user <span className="font-semibold">"{confirm?.user?.username}"</span>? They will be able to login immediately.</>
            : <>Are you sure you want to <span className="font-semibold text-red-600">deactivate</span> user <span className="font-semibold">"{confirm?.user?.username}"</span>? They will not be able to login until reactivated.</>
          }
        </p>
      </Modal>
    </>
  );
}
