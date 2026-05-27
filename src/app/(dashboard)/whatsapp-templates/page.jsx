'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { waTemplateService } from '@/services';
import PageHeader from '@/components/shared/PageHeader';
import toast from 'react-hot-toast';

// ── Template type config (display labels + icons) ─────────────────────────────
const TEMPLATE_INFO = {
  receipt_added:        { label: 'Receipt Added',         icon: '🧾', desc: 'Sent when a new receipt is recorded.' },
  due_reminder:         { label: 'Due Reminder',          icon: '⚠️', desc: 'Sent to remind members of pending dues.' },
  registration_success: { label: 'Registration Confirmed',icon: '✅', desc: 'Sent on successful event registration.' },
  event_confirmation:   { label: 'Event Confirmation',    icon: '📅', desc: 'Sent to confirm event attendance.' },
};

// ── Interpolate placeholders with given vars (mirrors backend logic) ───────────
function interpolate(body, vars) {
  return body.replace(/\{(\w+)\}/g, (match, key) => (vars[key] != null ? String(vars[key]) : match));
}

// ── WhatsApp-style text renderer: bold, italic ─────────────────────────────────
function WhatsAppText({ text }) {
  const lines = text.split('\n');
  return (
    <div>
      {lines.map((line, li) => {
        // Split by *bold* and _italic_ markers
        const parts = [];
        let rest = line;
        let key  = 0;
        const re = /(\*[^*]+\*|_[^_]+_)/g;
        let last = 0;
        let m;
        while ((m = re.exec(rest)) !== null) {
          if (m.index > last) parts.push(<span key={key++}>{rest.slice(last, m.index)}</span>);
          const token = m[0];
          if (token.startsWith('*')) parts.push(<strong key={key++}>{token.slice(1, -1)}</strong>);
          else                       parts.push(<em     key={key++}>{token.slice(1, -1)}</em>);
          last = m.index + token.length;
        }
        if (last < rest.length) parts.push(<span key={key++}>{rest.slice(last)}</span>);
        return <div key={li} style={{ minHeight: line ? undefined : '0.8em' }}>{parts.length ? parts : ' '}</div>;
      })}
    </div>
  );
}

// ── Live preview bubble ────────────────────────────────────────────────────────
function PreviewBubble({ body, sampleVars }) {
  const rendered = interpolate(body || '', sampleVars || {});
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
      <WhatsAppText text={rendered} />
      <div style={{ textAlign: 'right', fontSize: '11px', color: '#8a8a8a', marginTop: '4px' }}>
        12:00 ✓✓
      </div>
    </div>
  );
}

// ── Placeholder chip ──────────────────────────────────────────────────────────
function PlaceholderChip({ ph, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(ph.key)}
      title={`Insert ${ph.key} — ${ph.label}`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
    >
      {ph.key}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WhatsAppTemplatesPage() {
  const [meta,        setMeta]        = useState(null);   // { placeholders, sampleVars, defaults }
  const [templates,   setTemplates]   = useState({});     // key → { name, body, is_active }
  const [activeKey,   setActiveKey]   = useState('receipt_added');
  const [editing,     setEditing]     = useState({});     // local edits for each key
  const [dirty,       setDirty]       = useState({});     // key → bool
  const [saving,      setSaving]      = useState({});
  const [resetting,   setResetting]   = useState({});
  const [loading,     setLoading]     = useState(true);
  const textareaRef = useRef(null);

  // ── Load meta + all templates ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [metaRes, tplsRes] = await Promise.all([
          waTemplateService.getMeta(),
          waTemplateService.getAll(),
        ]);
        setMeta(metaRes.data.data);
        const map = {};
        const editMap = {};
        for (const t of tplsRes.data.data) {
          map[t.template_key]     = t;
          editMap[t.template_key] = { name: t.name, body: t.body, is_active: t.is_active };
        }
        setTemplates(map);
        setEditing(editMap);
      } catch (err) {
        toast.error('Failed to load templates: ' + (err?.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentEdit = editing[activeKey] || { name: '', body: '', is_active: true };
  const currentMeta = meta?.placeholders?.[activeKey] || [];
  const sampleVars  = meta?.sampleVars  || {};

  const setField = (field, value) => {
    setEditing(prev => ({ ...prev, [activeKey]: { ...prev[activeKey], [field]: value } }));
    setDirty(prev => ({ ...prev, [activeKey]: true }));
  };

  // Insert placeholder at cursor in textarea
  const insertPlaceholder = useCallback((key) => {
    const ta = textareaRef.current;
    if (!ta) { setField('body', currentEdit.body + key); return; }
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const body  = currentEdit.body || '';
    const next  = body.slice(0, start) + key + body.slice(end);
    setField('body', next);
    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + key.length, start + key.length);
    });
  }, [activeKey, currentEdit.body]); // eslint-disable-line

  const handleSave = async () => {
    if (saving[activeKey]) return;
    setSaving(prev => ({ ...prev, [activeKey]: true }));
    try {
      await waTemplateService.save(activeKey, {
        name:      currentEdit.name,
        body:      currentEdit.body,
        is_active: currentEdit.is_active ? 1 : 0,
      });
      setTemplates(prev => ({ ...prev, [activeKey]: { ...prev[activeKey], ...currentEdit } }));
      setDirty(prev => ({ ...prev, [activeKey]: false }));
      toast.success('Template saved');
    } catch (err) {
      toast.error('Save failed: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSaving(prev => ({ ...prev, [activeKey]: false }));
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset to the default template? Your customisations will be overwritten.')) return;
    setResetting(prev => ({ ...prev, [activeKey]: true }));
    try {
      const res = await waTemplateService.resetToDefault(activeKey);
      const t   = res.data.data;
      setTemplates(prev => ({ ...prev, [activeKey]: t }));
      setEditing(prev => ({ ...prev, [activeKey]: { name: t.name, body: t.body, is_active: t.is_active } }));
      setDirty(prev => ({ ...prev, [activeKey]: false }));
      toast.success('Reset to default');
    } catch (err) {
      toast.error('Reset failed: ' + (err?.response?.data?.message || err.message));
    } finally {
      setResetting(prev => ({ ...prev, [activeKey]: false }));
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="WhatsApp Templates" subtitle="Customise message templates" />
        <p className="text-[12px] text-gray-400 animate-pulse mt-4">Loading templates…</p>
      </div>
    );
  }

  const keys = meta?.templateKeys || Object.keys(TEMPLATE_INFO);

  return (
    <div>
      <PageHeader title="WhatsApp Message Templates" subtitle="Customise message content with dynamic placeholders. Changes take effect immediately." />

      <div className="flex gap-4 flex-col lg:flex-row">

        {/* ── Left: template type selector ──────────────────────────── */}
        <div className="flex flex-row lg:flex-col gap-2 lg:w-52 shrink-0 overflow-x-auto pb-1 lg:pb-0">
          {keys.map(key => {
            const info = TEMPLATE_INFO[key] || { label: key, icon: '📝', desc: '' };
            const isDirty = dirty[key];
            return (
              <button
                key={key}
                onClick={() => setActiveKey(key)}
                className={[
                  'flex items-start gap-2 px-3 py-2.5 rounded-lg border text-left transition-all text-[12px] shrink-0 lg:w-full',
                  activeKey === key
                    ? 'bg-blue-500/10 border-blue-400 text-blue-800'
                    : 'bg-surface border-border text-gray-600 hover:bg-blue-50/40',
                ].join(' ')}
              >
                <span className="text-[16px] leading-none mt-0.5">{info.icon}</span>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{info.label}</div>
                  {isDirty && <div className="text-[10px] text-amber-600 font-medium">Unsaved changes</div>}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Right: editor + preview ───────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col xl:flex-row gap-4">

          {/* Editor card */}
          <div className="card flex-1 min-w-0">
            <div className="card-header flex items-center justify-between gap-2">
              <div>
                <span className="font-semibold">{TEMPLATE_INFO[activeKey]?.label || activeKey}</span>
                <span className="ml-2 text-[11px] text-gray-400">{TEMPLATE_INFO[activeKey]?.desc}</span>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  className="accent-green-600 w-3.5 h-3.5"
                  checked={!!currentEdit.is_active}
                  onChange={e => setField('is_active', e.target.checked)}
                />
                <span className={currentEdit.is_active ? 'text-green-700 font-medium' : 'text-gray-400'}>Active</span>
              </label>
            </div>

            <div className="card-body space-y-3">

              {/* Template name */}
              <div>
                <label className="form-label">Template Name</label>
                <input
                  className="form-input"
                  value={currentEdit.name || ''}
                  onChange={e => setField('name', e.target.value)}
                  placeholder="e.g. Receipt Added"
                />
              </div>

              {/* Placeholder chips */}
              <div>
                <div className="form-label mb-1">Available Placeholders — click to insert at cursor</div>
                <div className="flex flex-wrap gap-1.5">
                  {currentMeta.map(ph => (
                    <PlaceholderChip key={ph.key} ph={ph} onClick={insertPlaceholder} />
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
                  value={currentEdit.body || ''}
                  onChange={e => setField('body', e.target.value)}
                  placeholder="Type your message here. Use placeholders like {FullName}, {Amount}…"
                  style={{ resize: 'vertical' }}
                />
                <p className="text-[10.5px] text-gray-400 mt-1">
                  WhatsApp formatting: *bold*, _italic_. Line breaks are preserved.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap pt-1">
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving[activeKey] || !dirty[activeKey]}
                >
                  {saving[activeKey] ? 'Saving…' : 'Save Template'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={resetting[activeKey]}
                >
                  {resetting[activeKey] ? 'Resetting…' : 'Reset to Default'}
                </button>
              </div>

            </div>
          </div>

          {/* Live preview card */}
          <div className="card xl:w-80 shrink-0">
            <div className="card-header">Live Preview</div>
            <div className="card-body">
              <p className="text-[10.5px] text-gray-400 mb-3">
                Shown with sample data. Actual values are filled at send time.
              </p>

              {/* Phone frame */}
              <div style={{
                background: '#e5ddd5',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23c5b9aa\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                borderRadius: '12px',
                padding: '16px',
                minHeight: '200px',
              }}>
                <div className="flex justify-end">
                  <PreviewBubble body={currentEdit.body || ''} sampleVars={sampleVars} />
                </div>
              </div>

              {/* Placeholder reference table */}
              {currentMeta.length > 0 && (
                <div className="mt-4">
                  <div className="text-[10.5px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Sample values used in preview
                  </div>
                  <div className="border border-border rounded overflow-hidden">
                    <table className="w-full border-collapse text-[11px]">
                      <tbody>
                        {currentMeta.map(ph => (
                          <tr key={ph.key} className="border-b border-border last:border-0">
                            <td className="px-2 py-1.5 font-mono text-blue-700 bg-blue-50/40 whitespace-nowrap">{ph.key}</td>
                            <td className="px-2 py-1.5 text-gray-500">{ph.label}</td>
                            <td className="px-2 py-1.5 text-gray-700 font-medium truncate max-w-[100px]">{sampleVars[ph.key.replace(/[{}]/g, '')] || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
