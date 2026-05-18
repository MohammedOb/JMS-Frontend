'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { rbacService } from '@/services';
import toast from 'react-hot-toast';

export default function PermissionModal({ open, onClose, editPerm, prefillModule, onSuccess }) {
  const [form,   setForm]   = useState({ module: '', action: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editPerm) {
      setForm({ module: editPerm.module, action: editPerm.action, description: editPerm.description || '' });
    } else {
      setForm({ module: prefillModule || '', action: '', description: '' });
    }
  }, [open, editPerm, prefillModule]);

  const save = async () => {
    const { module, action, description } = form;
    if (!module || !action) { toast.error('Module and action are required'); return; }
    setSaving(true);
    try {
      if (editPerm) {
        await rbacService.updatePermission(editPerm.id, { description });
        toast.success('Permission updated');
      } else {
        const mod  = module.toLowerCase().replace(/\s+/g, '_');
        const act  = action.toLowerCase().replace(/\s+/g, '_');
        await rbacService.createPermission({ code: `${mod}.${act}`, module: mod, action: act, description });
        toast.success('Permission created');
      }
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
      size="sm"
      title={editPerm ? `Edit Permission — ${editPerm.code}` : 'Add New Permission'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />
            {editPerm ? 'Save' : 'Add Permission'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="form-label">
            Module <span className="text-red-500">*</span>
            <span className="text-gray-400 font-normal ml-1">(snake_case, e.g. complaints)</span>
          </label>
          <input
            className="form-input font-mono text-[12px]"
            value={form.module}
            disabled={!!editPerm}
            onChange={e => setForm(f => ({ ...f, module: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
            placeholder="complaints"
          />
        </div>

        <div>
          <label className="form-label">
            Action <span className="text-red-500">*</span>
            <span className="text-gray-400 font-normal ml-1">(view / create / edit / delete / approve…)</span>
          </label>
          <input
            className="form-input font-mono text-[12px]"
            value={form.action}
            disabled={!!editPerm}
            onChange={e => setForm(f => ({ ...f, action: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
            placeholder="view"
          />
        </div>

        {!editPerm && form.module && form.action && (
          <div className="bg-surface rounded-lg px-3 py-2 border border-border">
            <div className="text-[10px] text-gray-400 mb-0.5">Permission code (auto-generated)</div>
            <div className="font-mono text-[13px] font-semibold text-blue-600">
              {form.module}.{form.action}
            </div>
          </div>
        )}

        <div>
          <label className="form-label">Description</label>
          <input
            className="form-input text-[12px]"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="e.g. View complaints list"
          />
        </div>

        {editPerm && (
          <div className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Module and action cannot be changed — only description is editable. This protects all roles that already have this permission assigned.
          </div>
        )}
      </div>
    </Modal>
  );
}
