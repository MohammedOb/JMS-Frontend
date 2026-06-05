'use client';

import { useState, useEffect } from 'react';
import { systemVarsService }   from '@/services';
import { useAuth }             from '@/context/AuthContext';
import { useSystemVars }       from '@/context/SystemVarsContext';
import toast                   from 'react-hot-toast';
import Modal                   from '@/components/shared/Modal';
import { SaveIcon, TrashIcon } from '@/components/shared/Icons';

const EMPTY = { Name: '', Value: '', Description: '' };

export default function SystemVariablesPage() {
  const { can } = useAuth();

  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [addModal,    setAddModal]    = useState(false);
  const [editModal,   setEditModal]   = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [form,        setForm]        = useState(EMPTY);
  const [target,      setTarget]      = useState(null); // row being edited / deleted

  const { refreshVars } = useSystemVars();

  const canEdit   = can('utility.view');
  const canDelete = can('utility.view');

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const res = await systemVarsService.getAll({});
      setRows(Array.isArray(res.data) ? res.data : (res.data?.data ?? []));
    } catch {
      toast.error('Failed to load system variables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Save (add / edit) ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.Name?.trim())  { toast.error('Name is required');  return; }
    if (!form.Value?.trim()) { toast.error('Value is required'); return; }
    setSaving(true);
    try {
      await systemVarsService.save(form);
      toast.success(editModal ? 'Variable updated' : 'Variable added');
      setAddModal(false);
      setEditModal(false);
      setForm(EMPTY);
      await load();
      refreshVars();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setSaving(true);
    try {
      await systemVarsService.delete({ Name: target.Name });
      toast.success('Variable deleted');
      setDeleteModal(false);
      setTarget(null);
      await load();
      refreshVars();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => { setForm(EMPTY); setAddModal(true); };
  const openEdit = (row) => { setForm({ Name: row.Name, Value: row.Value, Description: row.Description || '' }); setTarget(row); setEditModal(true); };
  const openDelete = (row) => { setTarget(row); setDeleteModal(true); };

  return (
    <div className="max-w-4xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-bold text-navy-900">System Variables</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">Global configuration values — running years, system settings</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Variable</button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {['Name', 'Value', 'Description', 'Actions'].map(h => (
                  <th key={h} className="th-navy text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">No variables configured</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border font-mono font-semibold text-navy-900">{r.Name}</td>
                  <td className="px-3 py-2.5 border-t border-border font-semibold text-blue-700">{r.Value}</td>
                  <td className="px-3 py-2.5 border-t border-border text-gray-500">{r.Description || '—'}</td>
                  <td className="px-2 py-2 border-t border-border">
                    <div className="flex gap-1">
                      {canEdit && (
                        <button
                          className="btn btn-secondary btn-sm p-1.5"
                          title="Edit"
                          onClick={() => openEdit(r)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      )}
                      {canDelete && (
                        <button
                          className="btn btn-sm p-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                          title="Delete"
                          onClick={() => openDelete(r)}
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Modal ─────────────────────────────────────────────────────── */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Add System Variable"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <SaveIcon className="w-3.5 h-3.5 mr-1.5" />{saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <VariableForm form={form} setForm={setForm} />
      </Modal>

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={`Edit — ${target?.Name}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <SaveIcon className="w-3.5 h-3.5 mr-1.5" />{saving ? 'Saving…' : 'Update'}
            </button>
          </>
        }
      >
        <VariableForm form={form} setForm={setForm} nameReadOnly />
      </Modal>

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Variable"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteModal(false)}>Cancel</button>
            <button className="btn btn-sm bg-red-600 text-white border-red-600 hover:bg-red-700" onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-[13px] text-gray-700">
          Delete variable <span className="font-mono font-semibold">{target?.Name}</span>?
          This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function VariableForm({ form, setForm, nameReadOnly = false }) {
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="space-y-3">
      <div>
        <label className="form-label">Name <span className="text-red-500">*</span></label>
        <input
          className="form-input font-mono"
          placeholder="e.g. ForYearAll"
          value={form.Name}
          onChange={set('Name')}
          readOnly={nameReadOnly}
        />
        {nameReadOnly && (
          <p className="text-[11px] text-gray-400 mt-1">Name cannot be changed after creation.</p>
        )}
      </div>
      <div>
        <label className="form-label">Value <span className="text-red-500">*</span></label>
        <input
          className="form-input"
          placeholder="e.g. 1446"
          value={form.Value}
          onChange={set('Value')}
        />
      </div>
      <div>
        <label className="form-label">Description</label>
        <input
          className="form-input"
          placeholder="e.g. Current running Hijri year for Sabeel/Takhmeen"
          value={form.Description}
          onChange={set('Description')}
        />
      </div>
    </div>
  );
}
