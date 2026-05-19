'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { rbacService } from '@/services';
import toast from 'react-hot-toast';

export default function PermissionModal({ open, onClose, editPerm, prefillModule, onSuccess }) {
  const [form,   setForm]   = useState({ module: '', action: '', description: '', label: '', controls: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editPerm) {
      setForm({
        module:      editPerm.module,
        action:      editPerm.action,
        description: editPerm.description || '',
        label:       editPerm.label || '',
        controls:    (editPerm.controls || []).join(', '),
      });
    } else {
      setForm({ module: prefillModule || '', action: '', description: '', label: '', controls: '' });
    }
  }, [open, editPerm, prefillModule]);

  const controlTags = form.controls.split(',').map(s => s.trim()).filter(Boolean);

  const save = async () => {
    const { module, action, description, label, controls } = form;
    if (!module || !action) { toast.error('Module and action are required'); return; }
    setSaving(true);
    try {
      const payload = {
        description,
        label:    label.trim() || null,
        controls: controls.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (editPerm) {
        await rbacService.updatePermission(editPerm.id, payload);
        toast.success('Permission updated');
      } else {
        const mod = module.toLowerCase().replace(/\s+/g, '_');
        const act = action.toLowerCase().replace(/\s+/g, '_');
        await rbacService.createPermission({ code: `${mod}.${act}`, module: mod, action: act, ...payload });
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Module <span className="text-red-500">*</span></label>
            <input
              className="form-input font-mono text-[12px]"
              value={form.module}
              disabled={!!editPerm}
              onChange={e => setForm(f => ({ ...f, module: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
              placeholder="members"
            />
          </div>
          <div>
            <label className="form-label">Action <span className="text-red-500">*</span></label>
            <input
              className="form-input font-mono text-[12px]"
              value={form.action}
              disabled={!!editPerm}
              onChange={e => setForm(f => ({ ...f, action: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
              placeholder="edit_fmb"
            />
          </div>
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
            placeholder="e.g. Shows the Edit FMB button on the FMB Details card"
          />
        </div>

        <div>
          <label className="form-label">
            Label
            <span className="text-gray-400 font-normal ml-1">— short name shown in catalog</span>
          </label>
          <input
            className="form-input text-[12px]"
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="e.g. Edit FMB Details"
            maxLength={200}
          />
          <div className="text-[10px] text-gray-400 mt-0.5">{form.label.length}/200</div>
        </div>

        <div>
          <label className="form-label">
            Controls
            <span className="text-gray-400 font-normal ml-1">— UI elements this gates, comma-separated</span>
          </label>
          <input
            className="form-input text-[12px]"
            value={form.controls}
            onChange={e => setForm(f => ({ ...f, controls: e.target.value }))}
            placeholder="Edit FMB button, FMB Details card"
          />
          {controlTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {controlTags.map((c, i) => (
                <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{c}</span>
              ))}
            </div>
          )}
        </div>

        {editPerm && (
          <div className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Module and action cannot be changed — they are part of the permission code used in code with <code className="font-mono">can()</code>.
          </div>
        )}
      </div>
    </Modal>
  );
}
