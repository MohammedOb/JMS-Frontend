'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { waTemplateService } from '@/services';
import PageHeader from '@/components/shared/PageHeader';
import toast from 'react-hot-toast';

const BUILTIN_INFO = {
  receipt_added:        { label: 'Receipt Added',          icon: '🧾' },
  due_reminder:         { label: 'Due Reminder',           icon: '⚠️' },
  registration_success: { label: 'Registration Confirmed', icon: '✅' },
  event_confirmation:   { label: 'Event Confirmation',     icon: '📅' },
};

const COMMON_PLACEHOLDERS = [
  { key: '{FullName}',       label: 'Full Name' },
  { key: '{AccNo}',          label: 'Account Number' },
  { key: '{ReceiptNo}',      label: 'Receipt Number' },
  { key: '{Amount}',         label: 'Amount' },
  { key: '{Date}',           label: 'Date' },
  { key: '{ITSNo}',          label: 'ITS Number' },
  { key: '{Mode}',           label: 'Payment Mode' },
  { key: '{HubSubHead}',     label: 'Hub Sub Head' },
  { key: '{ForYear}',        label: 'For Year' },
  { key: '{Remark}',         label: 'Remark' },
  { key: '{OrgName}',        label: 'Organisation Name' },
  { key: '{DueAmount}',      label: 'Due Amount' },
  { key: '{RegistrationNo}', label: 'Registration No.' },
  { key: '{EventName}',      label: 'Event Name' },
  { key: '{EventDate}',      label: 'Event Date' },
  { key: '{Venue}',          label: 'Venue' },
];

function interpolate(body, vars) {
  return body.replace(/\{(\w+)\}/g, (_, key) => (vars[key] != null ? String(vars[key]) : `{${key}}`));
}

function WhatsAppText({ text }) {
  return (
    <div>
      {text.split('\n').map((line, li) => {
        const parts = [];
        const re = /(\*[^*]+\*|_[^_]+_)/g;
        let last = 0, k = 0, m;
        while ((m = re.exec(line)) !== null) {
          if (m.index > last) parts.push(<span key={k++}>{line.slice(last, m.index)}</span>);
          const tok = m[0];
          if (tok.startsWith('*')) parts.push(<strong key={k++}>{tok.slice(1, -1)}</strong>);
          else                     parts.push(<em     key={k++}>{tok.slice(1, -1)}</em>);
          last = m.index + tok.length;
        }
        if (last < line.length) parts.push(<span key={k++}>{line.slice(last)}</span>);
        return <div key={li} style={{ minHeight: line ? undefined : '0.8em' }}>{parts.length ? parts : ' '}</div>;
      })}
    </div>
  );
}

function PreviewBubble({ body, sampleVars }) {
  return (
    <div style={{
      background: '#dcf8c6',
      borderRadius: '12px 0 12px 12px',
      padding: '10px 14px',
      maxWidth: '340px',
      fontSize: '13px',
      lineHeight: 1.55,
      color: '#111',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
      wordBreak: 'break-word',
    }}>
      <WhatsAppText text={interpolate(body || '', sampleVars || {})} />
      <div style={{ textAlign: 'right', fontSize: '11px', color: '#8a8a8a', marginTop: '4px' }}>
        12:00 ✓✓
      </div>
    </div>
  );
}

// ── Editor Modal ──────────────────────────────────────────────────────────────
function TemplateModal({ template, isNew, meta, onClose, onSaved, onDeleted }) {
  const [name,      setName]      = useState(template?.name      ?? '');
  const [body,      setBody]      = useState(template?.body      ?? '');
  const [isActive,  setIsActive]  = useState(template?.is_active ?? true);
  const [saving,    setSaving]    = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const textareaRef = useRef(null);

  const isBuiltin    = !isNew && !!template?.is_builtin;
  const placeholders = isBuiltin
    ? (meta?.placeholders?.[template.template_key] || [])
    : COMMON_PLACEHOLDERS;
  const sampleVars   = meta?.sampleVars || {};

  const insertPlaceholder = useCallback((ph) => {
    const ta = textareaRef.current;
    if (!ta) { setBody(b => b + ph); return; }
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const next  = body.slice(0, start) + ph + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + ph.length, start + ph.length);
    });
  }, [body]);

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Template name is required');
    if (!body.trim()) return toast.error('Message body is required');
    setSaving(true);
    try {
      let res;
      if (isNew) {
        res = await waTemplateService.create({ name: name.trim(), body, is_active: isActive ? 1 : 0 });
      } else {
        res = await waTemplateService.save(template.template_key, {
          name: name.trim(), body, is_active: isActive ? 1 : 0,
        });
      }
      toast.success(isNew ? 'Template created' : 'Template saved');
      onSaved(res.data.data);
    } catch (err) {
      toast.error('Save failed: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset to the default template? Your customisations will be overwritten.')) return;
    setResetting(true);
    try {
      const res = await waTemplateService.resetToDefault(template.template_key);
      const t   = res.data.data;
      setName(t.name);
      setBody(t.body);
      setIsActive(!!t.is_active);
      toast.success('Reset to default');
    } catch (err) {
      toast.error('Reset failed: ' + (err?.response?.data?.message || err.message));
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await waTemplateService.delete(template.template_key);
      toast.success('Template deleted');
      onDeleted(template.template_key);
    } catch (err) {
      toast.error('Delete failed: ' + (err?.response?.data?.message || err.message));
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-5xl my-8">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="font-semibold text-[14px]">
            {isNew ? 'Add New Template' : `Edit: ${template.name}`}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-[20px] leading-none w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100">
            ×
          </button>
        </div>

        {/* Body: editor + preview */}
        <div className="flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-border">

          {/* Editor */}
          <div className="flex-1 p-5 space-y-3">

            {/* Name + Active toggle */}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="form-label">Template Name</label>
                <input
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. General Announcement"
                />
              </div>
              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer mb-0.5 shrink-0">
                <input
                  type="checkbox"
                  className="accent-green-600 w-3.5 h-3.5"
                  checked={!!isActive}
                  onChange={e => setIsActive(e.target.checked)}
                />
                <span className={isActive ? 'text-green-700 font-medium' : 'text-gray-400'}>Active</span>
              </label>
            </div>

            {/* Placeholder chips */}
            <div>
              <div className="form-label mb-1.5">
                {isBuiltin ? 'Available Placeholders' : 'Common Placeholders'} — click to insert at cursor
              </div>
              <div className="flex flex-wrap gap-1.5">
                {placeholders.map(ph => (
                  <button
                    key={ph.key}
                    type="button"
                    onClick={() => insertPlaceholder(ph.key)}
                    title={ph.label}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    {ph.key}
                  </button>
                ))}
              </div>
            </div>

            {/* Body textarea */}
            <div>
              <label className="form-label">Message Body</label>
              <textarea
                ref={textareaRef}
                className="form-input font-mono text-[12px] leading-relaxed"
                rows={14}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Type your message here. Use placeholders like {FullName}, {Amount}…"
                style={{ resize: 'vertical' }}
              />
              <p className="text-[10.5px] text-gray-400 mt-1">
                WhatsApp formatting: *bold*, _italic_. Line breaks are preserved.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : isNew ? 'Create Template' : 'Save Changes'}
              </button>
              {isBuiltin && (
                <button className="btn btn-secondary" onClick={handleReset} disabled={resetting}>
                  {resetting ? 'Resetting…' : 'Reset to Default'}
                </button>
              )}
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              {!isNew && !isBuiltin && (
                <button
                  className="btn ml-auto text-[11px]"
                  style={{ color: '#dc2626', borderColor: '#fca5a5', background: 'transparent' }}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Delete Template'}
                </button>
              )}
            </div>
          </div>

          {/* Live preview */}
          <div className="xl:w-80 shrink-0 p-5">
            <div className="text-[12px] font-semibold text-gray-600 mb-1">Live Preview</div>
            <p className="text-[10.5px] text-gray-400 mb-3">
              Shown with sample data. Actual values are filled at send time.
            </p>
            <div style={{
              background: '#e5ddd5',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23c5b9aa\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              borderRadius: '12px',
              padding: '16px',
              minHeight: '180px',
            }}>
              <div className="flex justify-end">
                <PreviewBubble body={body} sampleVars={sampleVars} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WhatsAppTemplatesPage() {
  const [meta,      setMeta]      = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,        setModal]        = useState(null); // null | { template, isNew }
  const [toggling,     setToggling]     = useState({});   // key → bool
  const [toggleTarget, setToggleTarget] = useState(null); // tpl pending confirmation

  useEffect(() => {
    (async () => {
      try {
        const [metaRes, tplsRes] = await Promise.all([
          waTemplateService.getMeta(),
          waTemplateService.getAll(),
        ]);
        setMeta(metaRes.data.data);
        setTemplates(tplsRes.data.data);
      } catch (err) {
        toast.error('Failed to load templates: ' + (err?.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggleActive = (tpl) => {
    if (toggling[tpl.template_key]) return;
    setToggleTarget(tpl);
  };

  const confirmToggle = async () => {
    const tpl = toggleTarget;
    if (!tpl) return;
    setToggleTarget(null);
    const newActive = !tpl.is_active;
    setToggling(prev => ({ ...prev, [tpl.template_key]: true }));
    try {
      await waTemplateService.save(tpl.template_key, {
        name:      tpl.name,
        body:      tpl.body,
        is_active: newActive ? 1 : 0,
      });
      setTemplates(prev =>
        prev.map(t => t.template_key === tpl.template_key ? { ...t, is_active: newActive } : t)
      );
      toast.success(newActive ? 'Template activated' : 'Template deactivated');
    } catch (err) {
      toast.error('Failed: ' + (err?.response?.data?.message || err.message));
    } finally {
      setToggling(prev => ({ ...prev, [tpl.template_key]: false }));
    }
  };

  const handleSaved = (updated) => {
    setTemplates(prev => {
      const idx = prev.findIndex(t => t.template_key === updated.template_key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
    setModal(null);
  };

  const handleDeleted = (key) => {
    setTemplates(prev => prev.filter(t => t.template_key !== key));
    setModal(null);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="WhatsApp Templates" subtitle="Manage message templates" />
        <p className="text-[12px] text-gray-400 animate-pulse mt-4">Loading templates…</p>
      </div>
    );
  }

  const builtins = templates.filter(t => t.is_builtin);
  const customs  = templates.filter(t => !t.is_builtin);

  return (
    <div>
      <PageHeader
        title="WhatsApp Message Templates"
        subtitle="Manage and customise message templates for WhatsApp notifications."
      />

      {/* Toolbar */}
      <div className="flex justify-end mb-4">
        <button
          className="btn btn-primary"
          onClick={() => setModal({ template: null, isNew: true })}
        >
          + Add Template
        </button>
      </div>

      {/* Built-in templates */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="font-semibold">Built-in Templates</span>
          <span className="ml-2 text-[11px] text-gray-400">{builtins.length} templates · can edit but not delete</span>
        </div>
        <div className="card-body p-0">
          <div className="divide-y divide-border">
            {builtins.map(tpl => (
              <TemplateRow
                key={tpl.template_key}
                tpl={tpl}
                toggling={toggling}
                onToggle={handleToggleActive}
                onEdit={() => setModal({ template: tpl, isNew: false })}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Custom templates */}
      <div className="card">
        <div className="card-header">
          <span className="font-semibold">Custom Templates</span>
          <span className="ml-2 text-[11px] text-gray-400">{customs.length} templates</span>
        </div>
        <div className="card-body p-0">
          {customs.length === 0 ? (
            <div className="text-center text-[12px] text-gray-400 py-8">
              No custom templates yet.{' '}
              <button
                className="text-blue-600 hover:underline"
                onClick={() => setModal({ template: null, isNew: true })}
              >
                Add one
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {customs.map(tpl => (
                <TemplateRow
                  key={tpl.template_key}
                  tpl={tpl}
                  toggling={toggling}
                  onToggle={handleToggleActive}
                  onEdit={() => setModal({ template: tpl, isNew: false })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor modal */}
      {modal && (
        <TemplateModal
          template={modal.template}
          isNew={modal.isNew}
          meta={meta}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}

      {/* Toggle active/inactive confirmation */}
      {toggleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-gray-800 mb-2">
              {toggleTarget.is_active ? 'Deactivate' : 'Activate'} Template
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to mark <strong>{toggleTarget.name}</strong> as{' '}
              <strong>{toggleTarget.is_active ? 'Inactive' : 'Active'}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button className="btn btn-secondary btn-sm" onClick={() => setToggleTarget(null)}>
                Cancel
              </button>
              <button
                className={`btn btn-sm ${toggleTarget.is_active ? 'btn-danger' : 'btn-primary'}`}
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

// ── Single template row ───────────────────────────────────────────────────────
function TemplateRow({ tpl, toggling, onToggle, onEdit }) {
  const info = BUILTIN_INFO[tpl.template_key];
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50/30 transition-colors">
      <div className="text-[20px] shrink-0 select-none">{info?.icon || '📝'}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[13px]">{tpl.name}</div>
        <div className="text-[11px] text-gray-400 font-mono mt-0.5">{tpl.template_key}</div>
      </div>

      {/* Slide toggle */}
      <button
        onClick={() => onToggle(tpl)}
        disabled={!!toggling[tpl.template_key]}
        title={tpl.is_active ? 'Click to deactivate' : 'Click to activate'}
        className="shrink-0 flex items-center gap-2 cursor-pointer disabled:opacity-50"
      >
        <div className={[
          'relative w-10 h-5 rounded-full transition-colors duration-200',
          tpl.is_active ? 'bg-green-500' : 'bg-gray-300',
        ].join(' ')}>
          <span className={[
            'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
            tpl.is_active ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')} />
        </div>
        {/* <span className={`text-[11px] font-medium w-12 ${tpl.is_active ? 'text-green-700' : 'text-gray-400'}`}>
          {toggling[tpl.template_key] ? '…' : tpl.is_active ? 'Active' : 'Inactive'}
        </span> */}
      </button>

      {/* Edit button */}
      <button
        onClick={onEdit}
        className="btn btn-secondary text-[11px] shrink-0"
      >
        Edit
      </button>
    </div>
  );
}
