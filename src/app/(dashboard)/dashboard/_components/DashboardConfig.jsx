'use client';
import { useState, useEffect, useRef } from 'react';
import { dashboardService, rbacService } from '@/services';

const ALL_METRICS = [
  { id: 'headCount',        label: 'Member Count by Sabeel Type',        group: 'sabeel',  desc: 'Count cards per SabeelType from DB' },
  { id: 'takhmeenStatus',   label: 'Takhmeen Done / Not Done',           group: 'sabeel',  desc: 'Green/red bar per type showing completion %' },
  { id: 'thaaliStatus',     label: 'Thaali Status Counts',               group: 'fmb',     desc: 'Count cards by ThaaliStatus (excl. Not Taken/Closed)' },
  { id: 'thaaliExcluded',   label: 'Not Taken / Closed (separate)',      group: 'fmb',     desc: 'Shown inline with Thaali Status' },
  { id: 'mutaveetenThaali', label: 'Sabeel Regular — Thaali Breakdown',  group: 'both',    desc: 'Sabeel Regular members grouped by ThaaliStatus' },
  { id: 'nonSabeelThaali',  label: 'Non-Sabeel with Thaali Count',       group: 'fmb',     desc: 'ITS-based accounts without Sabeel type but with active Thaali' },
  { id: 'receivedDues',     label: 'Received vs Dues (with sub-heads)',  group: 'general', desc: 'Hub cards with nested sub-head stacked bars + Takhmeen Not Done badge' },
  { id: 'allDues',          label: 'All Outstanding Dues (all years)',   group: 'general', desc: 'Ranked red bars across all years' },
];

const GROUP_COLORS = {
  sabeel:  'bg-blue-50 text-blue-600',
  fmb:     'bg-amber-50 text-amber-600',
  both:    'bg-purple-50 text-purple-600',
  general: 'bg-gray-50 text-gray-500',
};

function metricVisible(group, hubs) {
  if (group === 'general') return true;
  if (hubs.length === 0)   return true;
  const lower = hubs.map(h => h.toLowerCase());
  if (group === 'sabeel') return lower.includes('sabeel');
  if (group === 'fmb')    return lower.includes('fmb');
  if (group === 'both')   return lower.includes('sabeel') || lower.includes('fmb');
  return true;
}

function makeWidget() {
  return { id: `w-${Date.now()}`, title: 'New Widget', hubs: [], subheads: [], metrics: ['receivedDues', 'allDues'], chartType: 'bar' };
}

export default function DashboardConfig({ widgets, isSuperAdmin, onSave, onClose, defaultScope, defaultScopeId, lockScope }) {
  const [meta,       setMeta]       = useState({ hubs: [], subheads: [] });
  const [draft,      setDraft]      = useState(() => widgets.map(w => ({ ...w })));
  const [editing,    setEditing]    = useState(null);
  const [scope,      setScope]      = useState(defaultScope || 'global');
  const [scopeId,    setScopeId]    = useState(defaultScopeId || '');
  const [roles,      setRoles]      = useState([]);
  const [users,      setUsers]      = useState([]);
  const [showSugg,   setShowSugg]   = useState(false);
  const scopeInputRef = useRef(null);

  useEffect(() => {
    dashboardService.getDashboardMeta()
      .then(r => { if (r.data?.hubs) setMeta(r.data); })
      .catch(() => {});
  }, []);

  // Fetch roles+users once when super_admin opens the panel
  useEffect(() => {
    if (!isSuperAdmin) return;
    rbacService.getRoles().then(r => setRoles(r.data?.data || [])).catch(() => {});
    rbacService.getUsers().then(r => setUsers(r.data?.data || [])).catch(() => {});
  }, [isSuperAdmin]);

  const hubList     = meta.hubs.length ? meta.hubs : ['Sabeel', 'FMB', 'Vajebaat', 'Other', 'Rent', 'Laagat'];
  const subheadList = meta.subheads;

  const save = () => {
    const finalScopeId = scope === 'global' ? null : (scopeId.trim() || null);
    onSave(draft, scope, finalScopeId);
    onClose();
  };

  const addWidget = () => { const w = makeWidget(); setDraft(d => [...d, w]); setEditing(w.id); };
  const remove    = (id) => { setDraft(d => d.filter(w => w.id !== id)); if (editing === id) setEditing(null); };
  const update    = (id, patch) => setDraft(d => d.map(w => w.id === id ? { ...w, ...patch } : w));
  const move      = (id, dir) => {
    const idx = draft.findIndex(w => w.id === id);
    if (idx < 0) return;
    const next = [...draft];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setDraft(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />

      <div className="w-[460px] max-w-full bg-white shadow-2xl flex flex-col h-full border-l border-border">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-surface">
          <div>
            <h2 className="text-[13px] font-bold text-navy-900">Configure Dashboard</h2>
            <p className="text-[10px] text-gray-400">Add, edit, or reorder widgets. Saved to database.</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 text-[18px] leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {draft.map((w, i) => (
            <div key={w.id} className="border border-border rounded-lg overflow-hidden bg-white">
              <div className="flex items-center gap-2 px-3 py-2.5">
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button onClick={() => move(w.id, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-30 text-[10px] leading-none">▲</button>
                  <button onClick={() => move(w.id,  1)} disabled={i === draft.length - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-30 text-[10px] leading-none">▼</button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-navy-900 truncate">{w.title || 'Untitled'}</div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {w.hubs.length ? w.hubs.join(', ') : 'All hubs'}
                    &nbsp;·&nbsp;{w.metrics.length} metric{w.metrics.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <button
                  onClick={() => setEditing(editing === w.id ? null : w.id)}
                  className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                    editing === w.id
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {editing === w.id ? 'Done' : 'Edit'}
                </button>
                <button onClick={() => remove(w.id)} className="text-[10px] px-2 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50">✕</button>
              </div>

              {editing === w.id && (
                <WidgetForm widget={w} hubList={hubList} subheadList={subheadList} onChange={p => update(w.id, p)} />
              )}
            </div>
          ))}

          <button
            onClick={addWidget}
            className="w-full py-2.5 text-[12px] text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            + Add Widget
          </button>
        </div>

        {/* Scope selector — super_admin sees full selector; lockScope shows read-only label */}
        {isSuperAdmin && (
          <div className="px-4 py-2.5 border-t border-border bg-blue-50/40">
            <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Apply To</div>
            {lockScope ? (
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2.5 py-1 rounded-full border bg-blue-500 text-white border-blue-500`}>
                  {scope === 'global' ? 'All Users' : scope === 'role' ? 'Role' : 'User'}
                </span>
                {scopeId && <span className="text-[11px] font-mono text-navy-900">{scopeId}</span>}
                <span className="text-[9px] text-gray-400 ml-auto">Scope is locked for this configuration</span>
              </div>
            ) : (
              <>
                <div className="flex gap-2 flex-wrap">
                  {[{ v: 'global', l: 'All Users' }, { v: 'role', l: 'By Role' }, { v: 'user', l: 'By User ID' }].map(({ v, l }) => (
                    <button
                      key={v}
                      onClick={() => { setScope(v); setScopeId(''); }}
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                        scope === v ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500 border-border hover:border-blue-300'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {scope !== 'global' && (
                  <ScopeAutocomplete
                    scope={scope}
                    value={scopeId}
                    onChange={setScopeId}
                    roles={roles}
                    users={users}
                    showSugg={showSugg}
                    setShowSugg={setShowSugg}
                    inputRef={scopeInputRef}
                  />
                )}
                {scope === 'global' && (
                  <p className="text-[9px] text-gray-400 mt-1">Applies to all users without a role/user-specific config.</p>
                )}
              </>
            )}
          </div>
        )}

        <div className="px-4 py-3 border-t flex items-center justify-between">
          <button onClick={() => setDraft(widgets.map(w => ({ ...w })))} className="text-[11px] text-gray-400 hover:text-gray-600">Reset</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
            <button onClick={save}    className="btn btn-primary  btn-sm">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WidgetForm({ widget, hubList, subheadList, onChange }) {
  const { hubs = [], subheads = [], metrics = [] } = widget;

  const toggleHub    = (h) => onChange({ hubs:     hubs.includes(h)     ? hubs.filter(x=>x!==h)     : [...hubs, h] });
  const toggleSub    = (s) => onChange({ subheads: subheads.includes(s) ? subheads.filter(x=>x!==s) : [...subheads, s] });
  const toggleMetric = (m) => onChange({ metrics:  metrics.includes(m)  ? metrics.filter(x=>x!==m)  : [...metrics, m] });
  const clearSubs    = ()  => onChange({ subheads: [] });

  const visibleMetrics = ALL_METRICS.filter(m => metricVisible(m.group, hubs));

  return (
    <div className="border-t border-border px-3 py-3 space-y-3.5 bg-surface/50">

      <Field label="Title">
        <input
          value={widget.title}
          onChange={e => onChange({ title: e.target.value })}
          className="w-full border border-border rounded px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          placeholder="Widget title…"
        />
      </Field>

      <Field label="Hub(s)" hint="empty = all visible to you">
        <div className="flex flex-wrap gap-1.5 mt-1">
          {hubList.map(h => (
            <button
              key={h}
              onClick={() => toggleHub(h)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                hubs.includes(h) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-border hover:border-blue-300'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </Field>

      {subheadList.length > 0 && (
        <Field label="Sub-Head(s)" hint="empty = all sub-heads">
          <div className="mt-1 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {subheadList.map(s => (
              <button
                key={s}
                onClick={() => toggleSub(s)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  subheads.includes(s) ? 'bg-navy-700 text-white border-navy-700' : 'bg-white text-gray-500 border-border hover:border-navy-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {subheads.length > 0 && (
            <button onClick={clearSubs} className="mt-1 text-[10px] text-gray-400 hover:text-red-500">Clear selection</button>
          )}
        </Field>
      )}

      <Field label="Metrics">
        <div className="mt-1 space-y-1.5">
          {visibleMetrics.map(m => (
            <label key={m.id} className="flex items-start gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={metrics.includes(m.id)}
                onChange={() => toggleMetric(m.id)}
                className="mt-0.5 rounded border-border text-blue-500 cursor-pointer focus:ring-blue-400"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-700 group-hover:text-navy-900">{m.label}</span>
                  {m.group !== 'general' && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${GROUP_COLORS[m.group]}`}>{m.group}</span>
                  )}
                </div>
                <div className="text-[9px] text-gray-400">{m.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Chart Type" hint="for count/status metrics">
        <div className="flex gap-2 mt-1">
          {[{ v: 'bar', l: '▬ Bar / Progress' }, { v: 'pie', l: '◕ Pie' }].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => onChange({ chartType: v })}
              className={`text-[11px] px-3 py-1 rounded-full border transition-colors ${
                (widget.chartType || 'bar') === v
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-border hover:border-blue-300'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <p className="text-[9px] text-gray-400 mt-1">Applies to Head Count, Takhmeen Status, Thaali Status sections.</p>
      </Field>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        {hint && <span className="text-[9px] text-gray-400 normal-case font-normal">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ScopeAutocomplete({ scope, value, onChange, roles, users, showSugg, setShowSugg, inputRef }) {
  const isRole = scope === 'role';

  const suggestions = isRole
    ? roles.filter(r => {
        const q = value.toLowerCase();
        return !q || r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
      }).slice(0, 8)
    : users.filter(u => {
        const q = value.toLowerCase();
        return !q || String(u.id).includes(q) || u.username.toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q);
      }).slice(0, 8);

  const select = (val) => {
    onChange(val);
    setShowSugg(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative mt-1.5">
      <input
        ref={inputRef}
        value={value}
        onChange={e => { onChange(e.target.value); setShowSugg(true); }}
        onFocus={() => setShowSugg(true)}
        onBlur={() => setTimeout(() => setShowSugg(false), 150)}
        placeholder={isRole ? 'Role code (e.g. fmb_manager)' : 'User ID or username'}
        className="w-full border border-border rounded px-2.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
        autoComplete="off"
      />
      {showSugg && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-border rounded shadow-lg mt-0.5 max-h-44 overflow-y-auto">
          {suggestions.map(item => isRole ? (
            <li
              key={item.id}
              onMouseDown={() => select(item.code)}
              className="px-3 py-2 cursor-pointer hover:bg-blue-50 flex items-center justify-between"
            >
              <span className="text-[11px] font-medium text-navy-900">{item.code}</span>
              <span className="text-[10px] text-gray-400">{item.name}</span>
            </li>
          ) : (
            <li
              key={item.id}
              onMouseDown={() => select(String(item.id))}
              className="px-3 py-2 cursor-pointer hover:bg-blue-50 flex items-center justify-between"
            >
              <div>
                <span className="text-[11px] font-medium text-navy-900">{item.username}</span>
                {item.full_name && <span className="text-[10px] text-gray-400 ml-1.5">{item.full_name}</span>}
              </div>
              <span className="text-[10px] text-gray-300">#{item.id}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
