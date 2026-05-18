'use client';

import { useState, useEffect, useMemo } from 'react';
import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { rbacService } from '@/services';
import toast from 'react-hot-toast';
import { moduleColor } from './constants';

export default function RoleModal({ open, onClose, editRole, scopes, onSuccess }) {
  const [form,        setForm]        = useState({ code: '', name: '', description: '', is_active: true, permission_ids: [], scope_ids: [] });
  const [permissions, setPermissions] = useState([]);
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    if (!open) return;
    rbacService.getPermissions()
      .then(r => setPermissions(r.data.data))
      .catch(() => {});

    if (editRole) {
      // Fetch full role detail to get parsed permission_ids and scope_ids arrays
      rbacService.getRole(editRole.id)
        .then(r => {
          const role = r.data.data;
          setForm({
            code:           role.code,
            name:           role.name,
            description:    role.description || '',
            is_active:      role.is_active !== undefined ? !!role.is_active : true,
            permission_ids: Array.isArray(role.permission_ids) ? role.permission_ids : [],
            scope_ids:      Array.isArray(role.scope_ids)      ? role.scope_ids      : [],
          });
        })
        .catch(e => toast.error(e.response?.data?.message || 'Failed to load role'));
    } else {
      setForm({ code: '', name: '', description: '', is_active: true, permission_ids: [], scope_ids: [] });
    }
  }, [open, editRole]);

  const permByModule = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  // Group scopes by type for display
  const scopesByType = useMemo(() => {
    const grouped = {};
    (scopes || []).forEach(s => {
      if (!grouped[s.type]) grouped[s.type] = [];
      grouped[s.type].push(s);
    });
    return grouped;
  }, [scopes]);

  const togglePerm = (permId) =>
    setForm(f => ({
      ...f,
      permission_ids: f.permission_ids.includes(permId)
        ? f.permission_ids.filter(id => id !== permId)
        : [...f.permission_ids, permId],
    }));

  const selectAllModule = (module) => {
    const moduleIds   = permissions.filter(p => p.module === module).map(p => p.id);
    const allSelected = moduleIds.every(id => form.permission_ids.includes(id));
    setForm(f => ({
      ...f,
      permission_ids: allSelected
        ? f.permission_ids.filter(id => !moduleIds.includes(id))
        : [...new Set([...f.permission_ids, ...moduleIds])],
    }));
  };

  const toggleScope = (scopeId) =>
    setForm(f => ({
      ...f,
      scope_ids: f.scope_ids.includes(scopeId)
        ? f.scope_ids.filter(id => id !== scopeId)
        : [...f.scope_ids, scopeId],
    }));

  const save = async () => {
    if (!form.name)              { toast.error('Role name required'); return; }
    if (!editRole && !form.code) { toast.error('Role code required'); return; }
    setSaving(true);
    try {
      if (editRole) {
        await rbacService.updateRole(editRole.id, form);
      } else {
        await rbacService.createRole(form);
      }
      toast.success(editRole ? 'Role updated' : 'Role created');
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
      size="xl"
      title={editRole ? `Edit Role — ${editRole.name}` : 'Create New Role'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />
            {editRole ? 'Save Changes' : 'Create Role'}
          </button>
        </>
      }
    >
      {/* Role info */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div>
          <label className="form-label">Role Code <span className="text-red-500">*</span></label>
          <input
            className="form-input font-mono text-[12px]"
            value={form.code}
            disabled={!!editRole}
            onChange={e => setForm(f => ({ ...f, code: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
            placeholder="e.g. finance_officer"
          />
        </div>
        <div>
          <label className="form-label">Role Name <span className="text-red-500">*</span></label>
          <input className="form-input" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="form-label">Description</label>
          <input className="form-input" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
      </div>

      {/* Default Scopes */}
      {Object.keys(scopesByType).length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Default Scopes
            <span className="text-gray-400 font-normal ml-1 normal-case">(users with this role inherit these unless overridden)</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {Object.entries(scopesByType).map(([type, typeScopes]) => (
              <div key={type}>
                <div className="text-[11px] font-semibold text-gray-500 mb-1.5 capitalize">{type}</div>
                <div className="flex flex-wrap gap-1.5">
                  {typeScopes.map(s => {
                    const selected = form.scope_ids.includes(s.id);
                    return (
                      <label key={s.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer transition-colors ${
                        selected ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-border text-gray-600 hover:border-gray-400'
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
        </div>
      )}

      {/* Permission matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Permissions</div>
          <div className="text-[11px] text-blue-600 font-semibold">{form.permission_ids.length} selected</div>
        </div>

        {permissions.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-[12px]">Loading permissions…</div>
        )}

        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {Object.entries(permByModule).map(([module, perms]) => {
            const moduleIds   = perms.map(p => p.id);
            const selectedCnt = moduleIds.filter(id => form.permission_ids.includes(id)).length;
            const allSelected = selectedCnt === moduleIds.length;

            return (
              <div key={module} className="border border-border rounded-lg overflow-hidden">
                <button
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                    allSelected ? 'bg-blue-50' : 'bg-surface hover:bg-gray-50'
                  }`}
                  onClick={() => selectAllModule(module)}
                >
                  <span className="text-[11.5px] font-semibold capitalize text-gray-700">
                    {module.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">{selectedCnt}/{moduleIds.length}</span>
                    <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                      allSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    }`}>
                      {allSelected && <span className="text-white text-[9px]">✓</span>}
                    </span>
                  </div>
                </button>
                <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-border">
                  {perms.map(p => (
                    <label key={p.id} className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
                      form.permission_ids.includes(p.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}>
                      <input type="checkbox" className="accent-blue-500 w-3 h-3"
                        checked={form.permission_ids.includes(p.id)}
                        onChange={() => togglePerm(p.id)} />
                      <div>
                        <span className={`text-[10px] font-mono mr-1 px-1 rounded ${moduleColor(p.module)}`}>
                          {p.action}
                        </span>
                        <span className="text-[11px] text-gray-500">{p.description || p.code}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
