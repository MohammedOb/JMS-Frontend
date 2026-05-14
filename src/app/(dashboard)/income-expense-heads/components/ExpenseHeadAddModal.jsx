'use client';

import { useState } from 'react';
import toast          from 'react-hot-toast';
import Modal          from '@/components/shared/Modal';
import { SaveIcon }   from '@/components/shared/Icons';

const EXPENSE_CATEGORIES = ['General', 'Administration', 'Operations', 'Maintenance', 'Capital', 'Other'];

const DEFAULTS = { headName: '', category: 'General', description: '', status: 'Active' };

export default function ExpenseHeadAddModal({ open, onClose, onSave }) {
  const [form, setForm] = useState(DEFAULTS);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.headName.trim()) { toast.error('Head Name is required'); return; }
    // TODO: call expenseHeadService.create(form) when API is provided
    onSave(form);
    setForm(DEFAULTS);
  };

  const handleClose = () => {
    setForm(DEFAULTS);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Expense Head"
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="form-label">Head Name <span className="text-red-500">*</span></label>
          <input
            className="form-input"
            placeholder="Enter expense head name"
            value={form.headName}
            onChange={e => set('headName', e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Category</label>
          <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
            {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Optional description"
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
