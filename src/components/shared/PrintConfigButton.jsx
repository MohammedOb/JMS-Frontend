'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { takhmeenService } from '@/services';
import Modal from '@/components/shared/Modal';
import ComboBox from '@/components/shared/ComboBox';

function normalizeArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (v.recordset) return v.recordset;
  if (Array.isArray(v.recordsets?.[0])) return v.recordsets[0];
  if (Array.isArray(v.data)) return v.data;
  return [];
}

function dbRowToTpl(row) {
  return { id: row.ID, name: row.Name };
}

// ── Settings Modal ─────────────────────────────────────────────────────────────
function PrintConfigModal({ open, onClose, buttonId, defaultSubhead, savedConfig, onSaved }) {
  const [templateId,  setTemplateId]  = useState('');
  const [subhead,     setSubhead]     = useState('');
  const [forYear,     setForYear]     = useState('');
  const [templates,   setTemplates]   = useState([]);
  const [subHeadOpts, setSubHeadOpts] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    if (!open) return;
    // Pre-populate from already-loaded config
    setTemplateId(savedConfig?.templateId || '');
    setSubhead(savedConfig?.subhead || defaultSubhead || '');
    setForYear(savedConfig?.forYear || '');

    // Load templates
    takhmeenService.loadFormTemplates()
      .then(res => setTemplates((res?.data?.data || []).map(dbRowToTpl)))
      .catch(() => {});

    // Load subhead options
    setLoading(true);
    takhmeenService.loadHubHeadDetails({ IsActive: 1 })
      .then(res => {
        const rows = normalizeArray(res?.data);
        const seen = new Set();
        const opts = [];
        for (const r of rows) {
          const sh = r.HubSubHead;
          if (sh && !seen.has(sh)) { seen.add(sh); opts.push(sh); }
        }
        setSubHeadOpts(opts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, buttonId, defaultSubhead, savedConfig]);

  async function handleSave() {
    setSaving(true);
    try {
      await takhmeenService.savePrintButtonConfig({
        ButtonId:   buttonId,
        TemplateId: templateId ? Number(templateId) : null,
        SubHead:    subhead || null,
        ForYear:    forYear || null,
      });
      const cfg = { templateId: templateId ? String(templateId) : '', subhead, forYear };
      onSaved(cfg);
      onClose();
    } catch {
      // save failed — still close, parent retains old config
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Configure Print Button"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      }
    >
      <div className="space-y-4 p-1">
        <div>
          <label className="form-label">Template</label>
          <select className="form-input" value={templateId} onChange={e => setTemplateId(e.target.value)}>
            <option value="">— Auto (match by SubHead) —</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <p className="text-[10px] text-gray-400 mt-0.5">Pick a specific template, or leave auto to match by SubHead.</p>
        </div>

        <div>
          <label className="form-label">SubHead</label>
          <ComboBox
            value={subhead}
            options={subHeadOpts}
            placeholder={loading ? 'Loading…' : 'e.g. FMB Regular'}
            onChange={v => setSubhead(v)}
          />
          <p className="text-[10px] text-gray-400 mt-0.5">Select the actual HubSubHead from the database.</p>
        </div>

        <div>
          <label className="form-label">For Year <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. 1447"
            value={forYear}
            onChange={e => setForYear(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PrintConfigButton({ buttonId, accno, serialNo, defaultSubhead, label, className, icon }) {
  const { can } = useAuth();
  const showGear = can('takhmeen.edit');
  const [open,   setOpen]   = useState(false);
  const [config, setConfig] = useState(null);

  // Remove stale localStorage key left over from old implementation
  useEffect(() => { localStorage.removeItem('print_button_configs'); }, []);

  // Load saved config from DB on mount so handlePrint uses the correct settings
  useEffect(() => {
    takhmeenService.loadPrintButtonConfig(buttonId)
      .then(res => {
        const row = res?.data?.data?.[0];
        if (row) {
          setConfig({
            templateId: row.TemplateId ? String(row.TemplateId) : '',
            subhead:    row.SubHead  || '',
            forYear:    row.ForYear  || '',
          });
        }
      })
      .catch(() => {});
  }, [buttonId]);

  function handlePrint() {
    const cfg = config;
    const params = new URLSearchParams({ accno: accno || '' });
    params.set('subhead', cfg?.subhead || defaultSubhead || '');
    if (cfg?.templateId) params.set('templateId', cfg.templateId);
    if (cfg?.forYear)    params.set('forYear',    cfg.forYear);
    if (serialNo)        params.set('serialNo',   serialNo);
    window.open(`/view-template?${params}`, '_blank');
  }

  return (
    <span className="inline-flex items-center gap-0.5">
      <button className={className} onClick={handlePrint}>
        {icon}{label}
      </button>
      {showGear && (
        <button
          title="Configure print settings"
          onClick={e => { e.stopPropagation(); setOpen(true); }}
          className="inline-flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors text-[14px] flex-shrink-0"
        >
          ⚙
        </button>
      )}
      <PrintConfigModal
        open={open}
        onClose={() => setOpen(false)}
        buttonId={buttonId}
        defaultSubhead={defaultSubhead}
        savedConfig={config}
        onSaved={setConfig}
      />
    </span>
  );
}
