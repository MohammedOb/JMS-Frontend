'use client';

import { useState, useEffect, useCallback } from 'react';
import { rbacService } from '@/services';
import toast           from 'react-hot-toast';
import PageHeader      from '@/components/shared/PageHeader';
import Modal           from '@/components/shared/Modal';
import { StatusBadge } from '@/components/shared/Badge';
import { SaveIcon }    from '@/components/shared/Icons';

export default function ManageUsersPage() {
  const [users,       setUsers]       = useState([]);
  const [roles,       setRoles]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [editUser,    setEditUser]    = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [newModal,    setNewModal]    = useState(false);
  const [newForm,     setNewForm]     = useState({ username: '', password: '', full_name: '', role_id: '' });
  const [resetUser,   setResetUser]   = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        rbacService.getUsers(),
        rbacService.getRoles(),
      ]);
      setUsers(usersRes.data.data  || []);
      setRoles(rolesRes.data.data  || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openRoleAssign = (u) => {
    setEditUser(u);
    setSelectedRoleId(u.role?.id ?? '');
  };

  const saveRole = async () => {
    try {
      await rbacService.assignRole(editUser.id, { role_id: selectedRoleId || null });
      toast.success('Role updated');
      setEditUser(null);
      load();
    } catch { toast.error('Failed to update role'); }
  };

  const doResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      await rbacService.resetPassword(resetUser.id, { new_password: newPassword });
      toast.success('Password reset');
      setResetUser(null);
      setNewPassword('');
    } catch { toast.error('Failed to reset password'); }
  };

  const createUser = async () => {
    if (!newForm.username || !newForm.password) { toast.error('Username and password are required'); return; }
    try {
      await rbacService.createUser({ ...newForm, role_id: newForm.role_id || null });
      toast.success('User created');
      setNewModal(false);
      setNewForm({ username: '', password: '', full_name: '', role_id: '' });
      load();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to create user'); }
  };

  const ROLE_BADGE = { super_admin: 'blue', accounts: 'blue', reports_only: 'amber', read_only: 'red' };
  const activeRoles = roles.filter(r => r.is_active);

  return (
    <div>
      <PageHeader title="Manage Users" subtitle="Role-based access control for all system users">
        <button className="btn btn-primary btn-sm" onClick={() => setNewModal(true)}>+ Add New User</button>
      </PageHeader>

      <div className="card mb-4">
        <div className="card-header">System Users</div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>{['Username', 'Full Name', 'Role', 'Last Login', 'Status', 'Actions'].map(h => (
                <th key={h} className="th-navy">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : users.map((u, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border font-semibold">{u.username}</td>
                  <td className="px-3 py-2.5 border-t border-border">{u.full_name || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">
                    {u.role
                      ? <span className={`badge badge-${ROLE_BADGE[u.role.code] || 'gray'}`}>{u.role.name}</span>
                      : <span className="text-gray-400 text-[11px]">No role</span>}
                  </td>
                  <td className="px-3 py-2.5 border-t border-border">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <StatusBadge status={u.is_active ? 'Active' : 'Inactive'} />
                  </td>
                  <td className="px-3 py-2.5 border-t border-border whitespace-nowrap">
                    <button className="btn btn-primary btn-sm mr-1" onClick={() => openRoleAssign(u)}>Assign Role</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setResetUser(u); setNewPassword(''); }}>Reset Pass</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role assignment panel */}
      {editUser && (
        <div className="card">
          <div className="card-header">
            Assign Role — <strong>{editUser.username}</strong>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" onClick={() => setEditUser(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveRole}>
                <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save Role
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="mb-4">
              <label className="form-label">Role</label>
              <select
                className="form-select w-64"
                value={selectedRoleId}
                onChange={e => setSelectedRoleId(e.target.value)}
              >
                <option value="">— No Role —</option>
                {activeRoles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            {selectedRoleId && (() => {
              const role = roles.find(r => String(r.id) === String(selectedRoleId));
              return role ? (
                <p className="text-[11px] text-gray-400">
                  This role grants <strong>{role.permission_count}</strong> permission(s).
                  Manage permissions per role via the Roles settings.
                </p>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* Reset password modal */}
      <Modal
        open={!!resetUser}
        onClose={() => setResetUser(null)}
        title={`Reset Password — ${resetUser?.username}`}
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setResetUser(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={doResetPassword}>
              <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Reset
            </button>
          </>
        }
      >
        <div>
          <label className="form-label">New Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Min. 6 characters"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
        </div>
      </Modal>

      {/* New user modal */}
      <Modal
        open={newModal}
        onClose={() => setNewModal(false)}
        title="Add New User"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setNewModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={createUser}>
              <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Create User
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="form-label">Username *</label>
            <input className="form-input" value={newForm.username} onChange={e => setNewForm(p => ({ ...p, username: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Full Name</label>
            <input className="form-input" value={newForm.full_name} onChange={e => setNewForm(p => ({ ...p, full_name: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Password *</label>
            <input type="password" className="form-input" value={newForm.password} onChange={e => setNewForm(p => ({ ...p, password: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Role</label>
            <select className="form-select" value={newForm.role_id} onChange={e => setNewForm(p => ({ ...p, role_id: e.target.value }))}>
              <option value="">— No Role —</option>
              {activeRoles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
