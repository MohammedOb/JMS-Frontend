'use client';

// ────────────────────────────────────────────────────────────────────────────
// DEMO PAGE — shows what the DB-driven permission catalog will look like.
// Uses 100% hardcoded mock data. Safe to delete when done reviewing.
// Route: /access-control/demo
// ────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { EditIcon, TrashIcon, SearchIcon, PlusIcon, SaveIcon, XIcon } from '@/components/shared/Icons';

// ── Mock data: what the API returns after the migration ──────────────────────
// label and controls come from DB — no hardcoded catalogs needed in the code
const MOCK_PERMISSIONS = [
  // members — some have label+controls (enriched), one does not yet
  {
    id: 1, module: 'members', action: 'view', code: 'members.view',
    description: 'Access to the Mumin Details page — view profile, takhmeen, receipts, family',
    label: 'View Member Details',
    controls: ['Mumin Details page (route guard)'],
  },
  {
    id: 2, module: 'members', action: 'add', code: 'members.add',
    description: 'Add a new member to the system; also enables Add Receipt and Add Takhmeen buttons',
    label: 'Add New Member',
    controls: ['New member button in search bar', 'Add receipt button', 'Add takhmeen button'],
  },
  {
    id: 3, module: 'members', action: 'edit', code: 'members.edit',
    description: 'Edit existing member profile information (name, mobile, sector, status, etc.)',
    label: 'Edit Member Profile',
    controls: ['Edit profile button'],
  },
  {
    id: 4, module: 'members', action: 'edit_fmb', code: 'members.edit_fmb',
    description: 'Shows the Edit FMB button on the FMB Details card in the left panel',
    label: 'Edit FMB Details',
    controls: ['Edit FMB button'],
  },
  {
    id: 5, module: 'members', action: 'print_fmb', code: 'members.print_fmb',
    description: 'Shows the Print button on the FMB Details card in the left panel',
    label: 'Print FMB Details',
    controls: ['Print button'],
  },
  {
    id: 6, module: 'members', action: 'hide_actions', code: 'members.hide_actions',
    description: 'Hides all action buttons — puts member details in read-only mode',
    label: 'Hide All Action Buttons',
    controls: ['Edit profile', 'Add receipt', 'Add takhmeen', 'Speed vajebaat'],
  },
  // members — this one has NO label/controls yet (newly added, unenriched)
  {
    id: 7, module: 'members', action: 'reset_password', code: 'members.reset_password',
    description: "Reset a member's login password from the member profile page",
    label: null,
    controls: [],
  },

  // safai
  {
    id: 8, module: 'safai', action: 'edit', code: 'safai.edit',
    description: 'Shows the Edit button on each Safai Chitthi row',
    label: 'Edit Raza Record',
    controls: ['Edit button (pencil icon) per row'],
  },
  {
    id: 9, module: 'safai', action: 'delete', code: 'safai.delete',
    description: 'Shows the Delete button on each Safai Chitthi row',
    label: 'Delete Raza Record',
    controls: ['Delete button (trash icon) per row'],
  },
  {
    id: 10, module: 'safai', action: 'print', code: 'safai.print',
    description: 'Shows the Print button on each row in the Safai Chitthi standalone page',
    label: 'Print Raza Record',
    controls: ['Print button per row'],
  },

  // receipts — no labels yet (these would be enriched via UI later)
  {
    id: 11, module: 'receipts', action: 'edit', code: 'receipts.edit',
    description: 'Edit an existing receipt record',
    label: null,
    controls: [],
  },
  {
    id: 12, module: 'receipts', action: 'delete', code: 'receipts.delete',
    description: 'Delete a receipt record',
    label: null,
    controls: [],
  },

  // bookings
  {
    id: 13, module: 'bookings', action: 'create', code: 'bookings.create',
    description: 'Create a new booking entry',
    label: 'Add Booking',
    controls: ['Add Booking button'],
  },
];

const MODULE_COLOR = {
  members:  'bg-indigo-100 text-indigo-700',
  safai:    'bg-orange-100 text-orange-700',
  receipts: 'bg-green-100 text-green-700',
  bookings: 'bg-purple-100 text-purple-700',
};
const moduleColor = (m) => MODULE_COLOR[m] || 'bg-gray-100 text-gray-600';

// ── Permission row — the new DB-driven design ─────────────────────────────────
function PermRow({ p, onEdit, onDelete }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-surface">
      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold shrink-0 w-28 text-center mt-0.5 ${moduleColor(p.module)}`}>
        {p.action}
      </span>

      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold font-mono text-gray-800">{p.code}</div>

        {p.label
          ? <div className="text-[12px] font-medium text-gray-800 mt-0.5">{p.label}</div>
          : <div className="text-[11px] italic text-gray-400 mt-0.5">No label — add one via Edit</div>
        }

        <div className="text-[11px] text-gray-400 mt-0.5">
          {p.description || <span className="italic">No description</span>}
        </div>

        {p.controls?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {p.controls.map(c => (
              <span key={c} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{c}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-1 shrink-0 mt-0.5">
        <button className="btn btn-secondary btn-sm" title="Edit" onClick={() => onEdit(p)}>
          <EditIcon className="w-3 h-3" />
        </button>
        <button className="btn btn-danger btn-sm" title="Delete" onClick={() => onDelete(p)}>
          <TrashIcon className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Module section ────────────────────────────────────────────────────────────
function ModuleSection({ module, perms, onAdd, onEdit, onDelete }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${moduleColor(module)}`}>
            {module}
          </span>
          <span className="capitalize text-gray-700">{module.replace(/_/g, ' ')}</span>
          <span className="badge badge-blue text-[10px]">{perms.length}</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => onAdd(module)}>
          <PlusIcon className="w-3 h-3 mr-1" />Add to {module}
        </button>
      </div>
      <div className="divide-y divide-border">
        {perms.map(p => (
          <PermRow key={p.id} p={p} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

// ── New Permission Modal (demo — no API call, just shows the new fields) ─────
function DemoPermissionModal({ open, onClose, editPerm, prefillModule }) {
  const [form, setForm] = useState({
    module: '', action: '', description: '', label: '', controls: '',
  });
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens
  useState(() => {
    if (!open) return;
    if (editPerm) {
      setForm({
        module: editPerm.module,
        action: editPerm.action,
        description: editPerm.description || '',
        label: editPerm.label || '',
        controls: (editPerm.controls || []).join(', '),
      });
    } else {
      setForm({ module: prefillModule || '', action: '', description: '', label: '', controls: '' });
    }
  }, [open, editPerm, prefillModule]);

  if (!open) return null;

  const controlTags = form.controls
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="font-semibold text-gray-900 text-[14px]">
              {editPerm ? `Edit Permission — ${editPerm.code}` : 'Add New Permission'}
            </div>
            <div className="text-[10px] text-amber-600 font-medium mt-0.5">DEMO — no data is saved</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
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

          {/* ── NEW FIELDS ── */}
          <div className="pt-1 border-t border-dashed border-gray-200">
            <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">
              New fields (stored in DB)
            </div>

            <div className="mb-3">
              <label className="form-label">
                Label
                <span className="text-gray-400 font-normal ml-1">— human-readable name shown in catalog</span>
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
          </div>

          {editPerm && (
            <div className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Module and action cannot be changed. Only description, label, and controls are editable.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border bg-surface rounded-b-xl">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving…' : editPerm ? 'Save Changes' : 'Add Permission'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main demo page ────────────────────────────────────────────────────────────
export default function AccessControlDemoPage() {
  const [perms, setPerms]       = useState(MOCK_PERMISSIONS);
  const [search, setSearch]     = useState('');
  const [modalOpen, setModal]   = useState(false);
  const [editPerm, setEditPerm] = useState(null);
  const [prefillMod, setPrefill] = useState('');

  const filtered = perms.filter(p =>
    !search ||
    p.code.includes(search.toLowerCase()) ||
    p.module.includes(search.toLowerCase()) ||
    (p.label || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const byModule = filtered.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  const openAdd = (module) => { setEditPerm(null); setPrefill(module); setModal(true); };
  const openEdit = (p)     => { setEditPerm(p); setPrefill(''); setModal(true); };
  const openDelete = (p)   => { setPerms(prev => prev.filter(x => x.id !== p.id)); };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Demo banner */}
      <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-blue-800">Demo preview — DB-driven permission catalog</div>
          <div className="text-[11px] text-blue-600 mt-0.5">
            Mock data only. No API calls, no DB changes. Delete this page when done reviewing.
          </div>
        </div>
        <div className="text-[10px] font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
          /access-control/demo
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            className="form-input pl-8 text-[12px]"
            placeholder="Search by code, label, description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="text-[12px] text-gray-500">
          {filtered.length} of {perms.length} · {Object.keys(byModule).length} modules
        </span>
        <button className="btn btn-primary btn-sm" onClick={() => openAdd('')}>
          <PlusIcon className="w-3 h-3 mr-1" />Add Permission
        </button>
      </div>

      <div className="space-y-3">
        {Object.entries(byModule).map(([module, modPerms]) => (
          <ModuleSection
            key={module}
            module={module}
            perms={modPerms}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        ))}
        {Object.keys(byModule).length === 0 && (
          <div className="text-center py-16 text-gray-400">
            {search ? `No permissions match "${search}"` : 'No permissions'}
          </div>
        )}
      </div>

      <DemoPermissionModal
        open={modalOpen}
        onClose={() => setModal(false)}
        editPerm={editPerm}
        prefillModule={prefillMod}
      />
    </div>
  );
}
