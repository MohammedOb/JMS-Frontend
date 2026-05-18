'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { rbacService } from '@/services';
import toast from 'react-hot-toast';

const DEFAULT_FORM = { type: '', value: '', label: '', sort_order: 0 };

export default function ScopeModal({ open, onClose, editScope, onSuccess }) {
  const [form,   setForm]   = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editScope) {
      setForm({
        type:       editScope.type,
        value:      editScope.value,
        label:      editScope.label      || '',
        sort_order: editScope.sort_order || 0,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [open, editScope]);

  const save = async () => {
    if (!form.type)  { toast.error('Type is required');  return; }
    if (!form.value) { toast.error('Value is required'); return; }
    setSaving(true);
    try {
      if (editScope) {
        await rbacService.updateScope(editScope.id, { label: form.label, sort_order: form.sort_order });
      } else {
        await rbacService.createScope(form);
      }
      toast.success(editScope ? 'Scope updated' : 'Scope created');
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
      title={editScope ? `Edit Scope — ${editScope.type}:${editScope.value}` : 'Add Scope'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />
            {editScope ? 'Save Changes' : 'Add Scope'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Type <span className="text-red-500">*</span></label>
            <input
              className="form-input font-mono text-[12px]"
              value={form.type}
              disabled={!!editScope}
              onChange={e => setForm(f => ({ ...f, type: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
              placeholder="e.g. hub"
            />
          </div>
          <div>
            <label className="form-label">Value <span className="text-red-500">*</span></label>
            <input
              className="form-input font-mono text-[12px]"
              value={form.value}
              disabled={!!editScope}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              placeholder="e.g. Sabeel"
            />
          </div>
        </div>
        <div>
          <label className="form-label">Label <span className="text-gray-400 font-normal">(display name)</span></label>
          <input className="form-input" value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="e.g. Sabeel Hub" />
        </div>
        <div>
          <label className="form-label">Sort Order</label>
          <input className="form-input" type="number" value={form.sort_order}
            onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) || 0 }))} />
        </div>
        {editScope && (
          <p className="text-[11px] text-gray-400">Type and value are immutable once created.</p>
        )}
      </div>
    </Modal>
  );
}
