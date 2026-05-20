'use client';

import { useState, useEffect, useMemo } from 'react';
import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { rbacService } from '@/services';
import toast from 'react-hot-toast';

const DEFAULT_FORM = {
  username: '', full_name: '', email: '', password: '',
  is_active: true, role_id: null, scope_ids: null,
};

export default function UserModal({ open, onClose, editUser, roles, scopes, onSuccess }) {
  const [form,   setForm]   = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editUser) {
      setForm({
        username:  editUser.username,
        full_name: editUser.full_name || '',
        email:     editUser.email     || '',
        password:  '',
        is_active: editUser.is_active,
        role_id:   editUser.role?.id  || null,
        scope_ids: editUser.scope_ids ?? null,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [open, editUser]);

  // Group scopes by type for display
  const scopesByType = useMemo(() => {
    const grouped = {};
    (scopes || []).forEach(s => {
      if (!grouped[s.type]) grouped[s.type] = [];
      grouped[s.type].push(s);
    });
    return grouped;
  }, [scopes]);

  const toggleScope = (scopeId) =>
    setForm(f => {
      const current = f.scope_ids || [];
      return {
        ...f,
        scope_ids: current.includes(scopeId)
          ? current.filter(id => id !== scopeId)
          : [...current, scopeId],
      };
    });

  const save = async () => {
    setSaving(true);
    try {
      const data = {
        full_name:  form.full_name,
        email:      form.email,
        is_active:  form.is_active,
        role_id:    form.role_id || null,
        scope_ids:  form.scope_ids,
      };
      if (editUser) {
        await rbacService.updateUser(editUser.id, data);
      } else {
        if (!form.username) { toast.error('Username required'); return; }
        if (!form.password) { toast.error('Password required'); return; }
        await rbacService.createUser({ ...data, username: form.username, password: form.password });
      }
      toast.success(editUser ? 'User updated' : 'User created');
      onSuccess();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editUser ? `Edit User — ${editUser.username}` : 'Add New User'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />
            {editUser ? 'Save Changes' : 'Create User'}
          </button>
        </>
      }
    >
      {/* Basic info */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="form-label">Username {!editUser && <span className="text-red-500">*</span>}</label>
          <input className="form-input" value={form.username} disabled={!!editUser}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
        </div>
        <div>
          <label className="form-label">Full Name</label>
          <input className="form-input" value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
        </div>
        <div>
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        {!editUser && (
          <div>
            <label className="form-label">Password <span className="text-red-500">*</span></label>
            <input className="form-input" type="password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
        )}
        {editUser && (
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" id="uactive" checked={!!form.is_active} className="accent-blue-500"
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
            <label htmlFor="uactive" className="text-[12.5px] text-gray-700 cursor-pointer">Account Active</label>
          </div>
        )}
      </div>

      {/* Assign Role (single) */}
      <div className="mb-4">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Role</div>
        <select
          className="form-input"
          value={form.role_id || ''}
          onChange={e => setForm(f => ({ ...f, role_id: Number(e.target.value) || null }))}
        >
          <option value="">— No role —</option>
          {roles.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Data Scopes */}
      <div>
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Data Scopes
        </div>

        {/* Inherit toggle */}
        <label className="flex items-center gap-2 mb-3 cursor-pointer">
          <input
            type="checkbox"
            className="accent-indigo-500"
            checked={form.scope_ids !== null}
            onChange={e => setForm(f => ({ ...f, scope_ids: e.target.checked ? [] : null }))}
          />
          <span className="text-[12px] text-gray-700">Override role&apos;s default scopes</span>
          {form.scope_ids === null && (
            <span className="text-[11px] text-gray-400 italic">Inheriting from role</span>
          )}
        </label>

        {form.scope_ids !== null && (
          Object.keys(scopesByType).length === 0
            ? <p className="text-[12px] text-gray-400">No scopes defined. Add scopes in the Scopes tab first.</p>
            : <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                {Object.entries(scopesByType).map(([type, typeScopes]) => (
                  <div key={type} className="flex items-start gap-4 px-3 py-2.5">
                    <div className="w-24 shrink-0 pt-0.5 text-[11px] font-semibold text-gray-600 capitalize">{type}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {typeScopes.map(s => {
                        const selected = (form.scope_ids || []).includes(s.id);
                        return (
                          <label key={s.id} className={`flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer select-none transition-colors ${
                            selected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-border text-gray-600 bg-white hover:border-gray-400 hover:bg-gray-50'
                          }`}>
                            <input type="checkbox" className="hidden"
                              checked={selected} onChange={() => toggleScope(s.id)} />
                            {s.label || s.value}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
        )}
      </div>
    </Modal>
  );
}
