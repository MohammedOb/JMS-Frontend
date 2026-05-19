'use client';

// ─────────────────────────────────────────────────────────────────────────────
// DEMO PAGE — Interactive can() usage guide.
// Toggle permissions on the left → watch the UI react on the right.
// Route: /access-control/demo/can
// Safe to delete when done reviewing.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { EditIcon, TrashIcon, PlusIcon, PrintIcon, CheckIcon, RefreshIcon } from '@/components/shared/Icons';

// ── All permission codes used in this demo ────────────────────────────────────
const ALL_PERMS = [
  { code: 'members.view',                group: 'Members',   label: 'View Member Details' },
  { code: 'members.add',                 group: 'Members',   label: 'Add New Member' },
  { code: 'members.edit',                group: 'Members',   label: 'Edit Profile' },
  { code: 'members.reset_password',      group: 'Members',   label: 'Reset Password' },
  { code: 'members.edit_fmb',            group: 'Members',   label: 'Edit FMB Details' },
  { code: 'members.print_overalldue',    group: 'Members',   label: 'Overall Due Button' },
  { code: 'members.quick_entry',         group: 'Members',   label: 'Speed Vajebaat Entry' },
  { code: 'members.hide_actions',        group: 'Members',   label: 'Hide All Buttons (restriction)' },
  { code: 'members.create.razachitthitab', group: 'Members', label: 'Add Raza Chitthi' },
  { code: 'takhmeen.edit',               group: 'Takhmeen',  label: 'Edit Takhmeen' },
  { code: 'takhmeen.delete',             group: 'Takhmeen',  label: 'Delete Takhmeen' },
  { code: 'receipts.edit',               group: 'Receipts',  label: 'Edit Receipt' },
  { code: 'receipts.delete',             group: 'Receipts',  label: 'Delete Receipt' },
  { code: 'safai.edit',                  group: 'Safai',     label: 'Edit Raza Record' },
  { code: 'safai.delete',                group: 'Safai',     label: 'Delete Raza Record' },
  { code: 'safai.print',                 group: 'Safai',     label: 'Print Raza Record' },
  { code: 'safai.update_raza',           group: 'Safai',     label: 'Approve / Revert Raza' },
];

const GROUPS = [...new Set(ALL_PERMS.map(p => p.group))];

const GROUP_COLOR = {
  Members:  'bg-indigo-100 text-indigo-700',
  Takhmeen: 'bg-teal-100 text-teal-700',
  Receipts: 'bg-green-100 text-green-700',
  Safai:    'bg-orange-100 text-orange-700',
};

// ── Code block component ──────────────────────────────────────────────────────
function Code({ children }) {
  return (
    <pre className="bg-gray-950 text-green-300 text-[11px] rounded-lg p-3 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap">
      {children}
    </pre>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionTitle({ number, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-3">
      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <div className="font-semibold text-gray-900 text-[13px]">{title}</div>
        {subtitle && <div className="text-[11px] text-gray-500 mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}

// ── Live preview panel ────────────────────────────────────────────────────────
function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />LIVE
    </span>
  );
}

// ── Main demo page ────────────────────────────────────────────────────────────
export default function CanDemoPage() {
  // Simulate the user's active permissions
  const [activePerms, setActivePerms] = useState(new Set([
    'members.view', 'members.edit', 'members.add',
    'takhmeen.edit', 'receipts.edit', 'safai.edit', 'safai.print',
  ]));
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const toggle = (code) => setActivePerms(prev => {
    const next = new Set(prev);
    next.has(code) ? next.delete(code) : next.add(code);
    return next;
  });

  // This is what can() does in the real app
  const can = (code) => {
    if (isSuperAdmin) return true;
    // Special: hide_actions is a restriction — must NOT be in perms
    if (code === '__not_hide_actions') return !activePerms.has('members.hide_actions');
    return activePerms.has(code);
  };

  const hideButtons = activePerms.has('members.hide_actions') && !isSuperAdmin;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="font-bold text-gray-900 text-[15px]">can() Interactive Guide</div>
            <div className="text-[11px] text-amber-600 font-medium">DEMO — toggle permissions on the left, watch the UI change on the right</div>
          </div>
          <a href="/access-control/demo" className="btn btn-secondary btn-sm">← Back to Catalog Demo</a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">

        {/* ── LEFT: Permission toggles ─────────────────────────────────────── */}
        <div className="w-64 shrink-0">
          <div className="sticky top-6 space-y-3">
            <div className="card">
              <div className="card-header">
                <span className="text-[12px] font-semibold">Simulated Permissions</span>
                <LiveBadge />
              </div>

              {/* super_admin toggle */}
              <div className="px-3 py-2 border-b border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${isSuperAdmin ? 'bg-yellow-400' : 'bg-gray-200'}`}
                    onClick={() => setIsSuperAdmin(v => !v)}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${isSuperAdmin ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-yellow-700">super_admin</div>
                    <div className="text-[10px] text-gray-400">bypasses all checks</div>
                  </div>
                </label>
              </div>

              <div className="divide-y divide-border">
                {GROUPS.map(group => (
                  <div key={group} className="px-3 py-2">
                    <div className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded inline-block mb-1.5 ${GROUP_COLOR[group]}`}>
                      {group}
                    </div>
                    <div className="space-y-1">
                      {ALL_PERMS.filter(p => p.group === group).map(p => (
                        <label key={p.code} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={isSuperAdmin || activePerms.has(p.code)}
                            disabled={isSuperAdmin}
                            onChange={() => toggle(p.code)}
                            className="w-3 h-3 rounded accent-blue-600"
                          />
                          <span className={`text-[10px] leading-snug ${p.code === 'members.hide_actions' ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                            {p.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-3 py-2 border-t border-border">
                <button
                  className="btn btn-secondary btn-sm w-full justify-center text-[10px]"
                  onClick={() => { setActivePerms(new Set()); setIsSuperAdmin(false); }}
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Examples ──────────────────────────────────────────────── */}
        <div className="flex-1 space-y-5">

          {/* ── Setup ── */}
          <div className="card p-4">
            <SectionTitle number="0" title="Setup — one line in any component" />
            <Code>{`// At the top of any page or component:
const { can } = useAuth();

// Then use can() anywhere in your JSX.
// That's it — no props, no context drilling.`}</Code>
          </div>

          {/* ── 1: Hide a button ── */}
          <div className="card p-4">
            <SectionTitle
              number="1"
              title="Hide / show a button"
              subtitle="The most common use — wrap the button in a conditional"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Code</div>
                <Code>{`{can('members.edit') && (
  <button onClick={openEditModal}>
    <EditIcon /> Edit Profile
  </button>
)}

{can('members.add') && (
  <button onClick={openAddModal}>
    <PlusIcon /> New Member
  </button>
)}`}</Code>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">Result <LiveBadge /></div>
                <div className="bg-surface rounded-lg p-3 flex flex-wrap gap-2 min-h-[80px] items-start content-start">
                  {!hideButtons && can('members.edit') && (
                    <button className="btn btn-primary btn-sm">
                      <EditIcon className="w-3.5 h-3.5 mr-1.5" />Edit Profile
                    </button>
                  )}
                  {!hideButtons && can('members.add') && (
                    <button className="btn btn-secondary btn-sm">
                      <PlusIcon className="w-3.5 h-3.5 mr-1.5" />New Member
                    </button>
                  )}
                  {!hideButtons && !can('members.edit') && !can('members.add') && (
                    <span className="text-[11px] text-gray-400 italic">No buttons — no permissions</span>
                  )}
                  {hideButtons && (
                    <span className="text-[11px] text-red-500 italic">Hidden by members.hide_actions</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── 2: Row action buttons ── */}
          <div className="card p-4">
            <SectionTitle
              number="2"
              title="Row actions in a table"
              subtitle="Each action button gated individually — user sees only what they can do"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Code</div>
                <Code>{`// Inside your table row:
<div className="flex gap-1">
  {can('safai.edit') && (
    <button title="Edit" onClick={() => openEdit(row)}>
      <EditIcon />
    </button>
  )}
  {can('safai.print') && (
    <button title="Print" onClick={() => window.print()}>
      <PrintIcon />
    </button>
  )}
  {can('safai.delete') && (
    <button title="Delete" onClick={() => openDelete(row)}>
      <TrashIcon />
    </button>
  )}
</div>`}</Code>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">Result <LiveBadge /></div>
                <div className="bg-surface rounded-lg p-3">
                  {['Row 1 — Raza #001', 'Row 2 — Raza #002'].map(row => (
                    <div key={row} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <span className="text-[12px] text-gray-700">{row}</span>
                      <div className="flex gap-1">
                        {can('safai.edit') && (
                          <button className="btn btn-secondary btn-sm p-1.5" title="Edit">
                            <EditIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {can('safai.print') && (
                          <button className="btn btn-secondary btn-sm p-1.5" title="Print">
                            <PrintIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {can('safai.delete') && (
                          <button className="btn btn-sm p-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" title="Delete">
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!can('safai.edit') && !can('safai.print') && !can('safai.delete') && (
                          <span className="text-[10px] text-gray-400 italic">view only</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── 3: Hide entire section ── */}
          <div className="card p-4">
            <SectionTitle
              number="3"
              title="Hide an entire card / section"
              subtitle="Gate a whole panel, not just a button"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Code</div>
                <Code>{`// Hide the entire FMB Details card:
{can('members.view') && (
  <FmbDetailsCard
    showEdit={can('members.edit_fmb')}
  />
)}

// Or hide the takhmeen section footer:
{can('takhmeen.edit') && (
  <div className="card-footer">
    <button>Add Takhmeen</button>
  </div>
)}`}</Code>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">Result <LiveBadge /></div>
                <div className="space-y-2">
                  {can('members.view') ? (
                    <div className="bg-white border border-border rounded-lg p-3">
                      <div className="text-[11px] font-semibold text-gray-800 mb-1">FMB Details Card</div>
                      <div className="text-[10px] text-gray-500">Hub: Sabeel · Grade: A</div>
                      {can('members.edit_fmb') && (
                        <button className="btn btn-primary btn-sm mt-2">
                          <EditIcon className="w-3 h-3 mr-1" />Edit FMB
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-100 border border-dashed border-gray-300 rounded-lg p-3 text-center">
                      <span className="text-[11px] text-gray-400 italic">Card hidden — no members.view</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── 4: Restriction flag pattern ── */}
          <div className="card p-4 border-red-200 bg-red-50/30">
            <SectionTitle
              number="4"
              title="Restriction flag — members.hide_actions"
              subtitle="Special case: this permission REMOVES access, not grants it. Do NOT use can() for this."
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Code</div>
                <Code>{`const { user } = useAuth();

// ✅ Correct — direct array check, NOT can()
// can() returns true for super_admin on ANY code,
// so using can('members.hide_actions') would hide
// buttons for super_admin too — wrong!
const hideButtons =
  Array.isArray(user?.permissions) &&
  user.permissions.includes('members.hide_actions');

// Then gate every action button:
{!hideButtons && can('members.edit') && (
  <button>Edit Profile</button>
)}

{!hideButtons && can('members.add') && (
  <button>New Member</button>
)}`}</Code>
                <div className="mt-2 text-[10px] text-red-700 bg-red-100 border border-red-200 rounded px-2 py-1.5">
                  <strong>Why not can()?</strong> — <code>can()</code> always returns <code>true</code> for <code>super_admin</code>.
                  A restriction flag must only fire if <em>explicitly assigned</em> to that user — super_admin should never be restricted.
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
                  Result <LiveBadge />
                  <span className="text-[10px] text-red-600 font-semibold">← tick "Hide All Buttons" on left</span>
                </div>
                <div className="bg-surface rounded-lg p-3 space-y-2">
                  <div className="text-[11px] font-semibold text-gray-700">Member Profile Actions:</div>
                  <div className="flex flex-wrap gap-2">
                    {!hideButtons && can('members.edit') && (
                      <button className="btn btn-primary btn-sm">
                        <EditIcon className="w-3 h-3 mr-1" />Edit
                      </button>
                    )}
                    {!hideButtons && can('members.add') && (
                      <button className="btn btn-secondary btn-sm">
                        <PlusIcon className="w-3 h-3 mr-1" />Add Receipt
                      </button>
                    )}
                    {!hideButtons && can('members.reset_password') && (
                      <button className="btn btn-secondary btn-sm">
                        <RefreshIcon className="w-3 h-3 mr-1" />Reset Password
                      </button>
                    )}
                    {hideButtons && (
                      <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 w-full">
                        All buttons hidden — read-only mode (members.hide_actions is set)
                      </div>
                    )}
                    {!hideButtons && !can('members.edit') && !can('members.add') && !can('members.reset_password') && (
                      <span className="text-[11px] text-gray-400 italic">No buttons visible</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 5: Multiple permissions ── */}
          <div className="card p-4">
            <SectionTitle
              number="5"
              title="Quick reference — all patterns"
              subtitle="Copy-paste ready"
            />
            <Code>{`import { useAuth } from '@/context/AuthContext';

export default function MyPage() {
  const { can, user } = useAuth();

  // ── Pattern 1: Hide a button ──────────────────────────────────────
  {can('members.edit') && <button>Edit</button>}

  // ── Pattern 2: Pass as prop ───────────────────────────────────────
  <MyCard showEdit={can('members.edit')} />

  // ── Pattern 3: Conditional value ─────────────────────────────────
  <DueSummaryCards
    onOverallDue={can('members.print_overalldue') ? handleDue : null}
  />

  // ── Pattern 4: Gate a whole section ──────────────────────────────
  {can('takhmeen.edit') && (
    <div className="card-footer">
      <button>Add Takhmeen</button>
    </div>
  )}

  // ── Pattern 5: Disable (show but not clickable) ───────────────────
  <button disabled={!can('receipts.edit')}>
    Edit Receipt
  </button>

  // ── Pattern 6: Restriction flag (NOT can) ────────────────────────
  const hideButtons =
    Array.isArray(user?.permissions) &&
    user.permissions.includes('members.hide_actions');

  {!hideButtons && can('members.edit') && <button>Edit</button>}
}`}</Code>
          </div>

        </div>
      </div>
    </div>
  );
}
