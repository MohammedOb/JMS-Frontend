'use client';

import { useState, useEffect, useMemo } from 'react';
import { takhmeenService, lookupService, systemVarsService } from '@/services';
import toast from 'react-hot-toast';
import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import RulesTable from './components/RulesTable';
import RuleForm from './components/RuleForm';

const EMPTY = {
  sabeel_type: '',
  label: '',
  main_head: '',
  sub_head: '',
  btn_label: '',
  check_by: 'subHead',
  year_key: '',
  year_override: '',
  is_active: 1,
  sort_order: 0,
};

export default function TakhmeenAlertRulesPage() {
  const [rows,         setRows]         = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [modal,        setModal]        = useState(null); // 'add' | 'edit' | 'delete'
  const [form,         setForm]         = useState(EMPTY);
  const [target,       setTarget]       = useState(null);
  const [toggling,     setToggling]     = useState({}); // id → true while saving
  const [toggleTarget, setToggleTarget] = useState(null); // row pending confirm

  // Options for autocomplete fields — loaded once
  const [sabeelTypes, setSabeelTypes] = useState([]);
  const [headOptions, setHeadOptions] = useState([]); // [{mainHead, subHead}]
  const [yearOptions, setYearOptions] = useState([]);
  const [sysVarKeys,  setSysVarKeys]  = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await takhmeenService.loadAllRequiredTakhmeenRules();
      setRows(res.data?.data ?? []);
    } catch {
      toast.error('Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Load autocomplete data once on mount
  useEffect(() => {
    lookupService.getSabeelTypes()
      .then(r => setSabeelTypes(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});

    lookupService.getYears()
      .then(r => setYearOptions(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});

    takhmeenService.loadHubHeadDetails({ IsActive: 1 })
      .then(r => {
        const rows = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        const seen = new Set();
        const opts = [];
        for (const row of rows) {
          const key = `${row.HubMainHead}||${row.HubSubHead}`;
          if (!seen.has(key)) { seen.add(key); opts.push({ mainHead: row.HubMainHead, subHead: row.HubSubHead }); }
        }
        setHeadOptions(opts);
      })
      .catch(() => {});

    systemVarsService.getAll({})
      .then(r => {
        const vars = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        setSysVarKeys(vars.filter(v => v.Name?.startsWith('ForYear')).map(v => v.Name));
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!form.sabeel_type?.trim()) { toast.error('Sabeel Type is required'); return; }
    if (!form.label?.trim())       { toast.error('Label is required');       return; }
    if (!form.main_head?.trim())   { toast.error('Main Head is required');   return; }
    if (!form.sub_head?.trim())    { toast.error('Sub Head is required');    return; }
    if (!form.btn_label?.trim())   { toast.error('Button label is required'); return; }
    setSaving(true);
    try {
      await takhmeenService.saveRequiredTakhmeenRule({
        ...form,
        id: modal === 'edit' ? target.id : undefined,
        year_key:      form.year_key      || null,
        year_override: form.year_override || null,
      });
      toast.success(modal === 'edit' ? 'Rule updated' : 'Rule added');
      setModal(null);
      await load();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await takhmeenService.deleteRequiredTakhmeenRule({ id: target.id });
      toast.success('Rule deleted');
      setModal(null);
      await load();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (row) => setToggleTarget(row);

  const confirmToggle = async () => {
    const row = toggleTarget;
    if (!row) return;
    setToggleTarget(null);
    setToggling(p => ({ ...p, [row.id]: true }));
    try {
      await takhmeenService.saveRequiredTakhmeenRule({
        id:            row.id,
        sabeel_type:   row.sabeel_type,
        label:         row.label,
        main_head:     row.main_head,
        sub_head:      row.sub_head,
        btn_label:     row.btn_label,
        check_by:      row.check_by,
        year_key:      row.year_key      || null,
        year_override: row.year_override || null,
        is_active:     row.is_active ? 0 : 1,
        sort_order:    row.sort_order,
      });
      toast.success(row.is_active ? 'Rule deactivated' : 'Rule activated');
      await load();
    } catch {
      toast.error('Failed to update');
    } finally {
      setToggling(p => ({ ...p, [row.id]: false }));
    }
  };

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (row) => {
    setForm({
      sabeel_type:   row.sabeel_type,
      label:         row.label,
      main_head:     row.main_head,
      sub_head:      row.sub_head,
      btn_label:     row.btn_label,
      check_by:      row.check_by,
      year_key:      row.year_key      || '',
      year_override: row.year_override || '',
      is_active:     row.is_active ?? 1,
      sort_order:    row.sort_order ?? 0,
    });
    setTarget(row);
    setModal('edit');
  };
  const openDelete = (row) => { setTarget(row); setModal('delete'); };

  // Group rows dynamically by sabeel_type
  const groups = useMemo(() => {
    const map = {};
    for (const r of rows) {
      if (!map[r.sabeel_type]) map[r.sabeel_type] = [];
      map[r.sabeel_type].push(r);
    }
    return Object.entries(map);
  }, [rows]);

  return (
    <div className="max-w-5xl mx-auto space-y-4">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-bold text-navy-900">Takhmeen Alert Rules</h1>
          <p className="text-[12px] text-gray-400 mt-0.5">
            Controls which missing-takhmeen alerts appear on the member details page
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Rule</button>
      </div>

      {loading && groups.length === 0 ? (
        <div className="card"><div className="card-body text-center text-gray-400 py-10">Loading…</div></div>
      ) : groups.length === 0 ? (
        <div className="card"><div className="card-body text-center text-gray-400 py-10">No rules configured</div></div>
      ) : groups.map(([type, typeRows]) => (
        <RulesTable
          key={type}
          title={type}
          rows={typeRows}
          toggling={toggling}
          onEdit={openEdit}
          onDelete={openDelete}
          onToggleActive={handleToggleActive}
        />
      ))}

      {/* Add / Edit Modal */}
      <Modal
        open={modal === 'add' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'edit' ? 'Edit Rule' : 'Add Rule'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <SaveIcon className="w-3.5 h-3.5 mr-1.5" />{saving ? 'Saving…' : (modal === 'edit' ? 'Update' : 'Save')}
            </button>
          </>
        }
      >
        <RuleForm
          form={form}
          setForm={setForm}
          sabeelTypes={sabeelTypes}
          headOptions={headOptions}
          yearOptions={yearOptions}
          sysVarKeys={sysVarKeys}
        />
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={modal === 'delete'}
        onClose={() => setModal(null)}
        title="Delete Rule"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button
              className="btn btn-sm bg-red-600 text-white border-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-[13px] text-gray-700">
          Delete the rule <span className="font-semibold">"{target?.label}"</span>? This cannot be undone.
        </p>
      </Modal>

      {/* Active/Inactive toggle confirm */}
      {toggleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-gray-800 mb-2">
              {toggleTarget.is_active ? 'Deactivate' : 'Activate'} Rule
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to mark <strong>"{toggleTarget.label}"</strong> as{' '}
              <strong>{toggleTarget.is_active ? 'Inactive' : 'Active'}</strong>?
              {toggleTarget.is_active && (
                <span className="block mt-1 text-amber-600 text-[11.5px]">
                  This will stop the alert from appearing on member pages.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button className="btn btn-secondary btn-sm" onClick={() => setToggleTarget(null)}>Cancel</button>
              <button
                className={`btn btn-sm ${toggleTarget.is_active ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' : 'btn-primary'}`}
                onClick={confirmToggle}
              >
                {toggleTarget.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
