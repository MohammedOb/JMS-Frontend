'use client';

import { useState, useEffect, useMemo } from 'react';
import Modal from '@/components/shared/Modal';
import { waTemplateService, waQueueService } from '@/services';
import { SendIcon, RefreshIcon } from '@/components/shared/Icons';
import toast from 'react-hot-toast';
import { rowVars, interpolate, PLACEHOLDERS } from './waUtils';
import { useSystemVars } from '@/context/SystemVarsContext';

const DEFAULT_KEY = 'takhmeen_reminder';

function etaStr(n) {
  if (n <= 0) return null;
  const secs = n * 18.5 + Math.floor(n / 7.5) * 35;
  if (secs < 60)   return `~${Math.round(secs)}s`;
  if (secs < 3600) return `~${Math.round(secs / 60)} min`;
  return `~${(secs / 3600).toFixed(1)} hrs`;
}

export default function WABulkModal({ open, onClose, rows = [], batchLabel = 'Member Message' }) {
  const { vars } = useSystemVars();
  const orgName = vars.JAMAAT_NAME_FORMAL || 'Shia Dawoodi Bohra Jamaat, Sagwara';

  const [templates,   setTemplates]   = useState([]);
  const [selectedKey, setSelectedKey] = useState(DEFAULT_KEY);
  const [msgTemplate, setMsgTemplate] = useState('');
  const [queuing,     setQueuing]     = useState(false);
  const [queued,      setQueued]      = useState(null);

  const noMobileCount = rows.filter(r => !(r.mobile || '').trim()).length;

  const previewMessage = useMemo(() => {
    if (!msgTemplate || !rows[0]) return '';
    return interpolate(msgTemplate, rowVars(rows[0], orgName));
  }, [msgTemplate, rows, orgName]);

  useEffect(() => {
    if (!open) return;
    setQueued(null);
    setQueuing(false);
    waTemplateService.getAll()
      .then(res => {
        const list = (res.data?.data || []).filter(t => t.is_active);
        setTemplates(list);
        const key = list.some(t => t.template_key === DEFAULT_KEY)
          ? DEFAULT_KEY
          : (list[0]?.template_key || '');
        setSelectedKey(key);
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!selectedKey || !templates.length) return;
    const tpl = templates.find(t => t.template_key === selectedKey);
    if (tpl) setMsgTemplate(tpl.body);
  }, [selectedKey, templates]);

  async function handleQueue() {
    if (!msgTemplate.trim()) { toast.error('Message template cannot be empty'); return; }

    const items = rows.map(row => ({
      accno:    row.accno    || null,
      fullName: row.name     || null,
      mobile:   (row.mobile || '').trim() || null,
      message:  interpolate(msgTemplate, rowVars(row, orgName)),
    }));

    setQueuing(true);
    try {
      const res = await waQueueService.create({
        label: `${batchLabel} — ${rows.length} member${rows.length !== 1 ? 's' : ''}`,
        items,
      });
      if (res.data?.success) {
        setQueued(res.data.data);
        toast.success(`${res.data.data.total} messages queued`);
      } else {
        toast.error(res.data?.message || 'Failed to queue');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to queue');
    } finally {
      setQueuing(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Send WhatsApp Messages — ${rows.length} member${rows.length !== 1 ? 's' : ''}`}
      size="xl"
      footer={
        queued ? (
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={onClose} disabled={queuing}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleQueue}
              disabled={queuing || !msgTemplate.trim() || rows.length === 0}
            >
              <SendIcon className="w-3.5 h-3.5 mr-1.5" />
              {queuing ? 'Queuing…' : `Queue ${rows.length} Message${rows.length !== 1 ? 's' : ''}`}
            </button>
          </>
        )
      }
    >
      {queued ? (
        <div className="space-y-4 py-2">
          <div className="flex flex-col items-center gap-3 text-center py-4">
            <div className="text-5xl">✅</div>
            <div>
              <div className="text-[16px] font-bold text-gray-800">
                {queued.total} message{queued.total !== 1 ? 's' : ''} queued
              </div>
              <div className="text-[12px] text-gray-500 mt-1">
                The background worker will send them automatically.
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                You can safely close this page — sending continues in the background.
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-[11px] text-blue-800">
            <strong>Track progress</strong> in the <em>Queue Status</em> panel on this page.
            Estimated send time: <strong>{etaStr(queued.total - noMobileCount) || '—'}</strong>.
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-[10px] text-gray-400 font-mono break-all">
            Batch: {queued.batchId}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-[12px] text-blue-800">
            <span className="text-lg leading-none">📱</span>
            <div>
              <strong>{rows.length}</strong> member{rows.length !== 1 ? 's' : ''} selected.
              {noMobileCount > 0 && (
                <span className="ml-1.5 text-amber-700">
                  ⚠️ {noMobileCount} have no mobile and will be skipped automatically.
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Template</label>
            <div className="flex gap-2">
              <select
                className="select select-sm flex-1"
                value={selectedKey}
                onChange={e => setSelectedKey(e.target.value)}
              >
                {templates.map(t => (
                  <option key={t.template_key} value={t.template_key}>{t.name}</option>
                ))}
              </select>
              <button
                type="button"
                title="Reset to template"
                className="btn btn-secondary btn-sm px-2"
                onClick={() => {
                  const tpl = templates.find(t => t.template_key === selectedKey);
                  if (tpl) setMsgTemplate(tpl.body);
                }}
              >
                <RefreshIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-gray-400 mb-1">Click to insert placeholder:</div>
            <div className="flex flex-wrap gap-1">
              {PLACEHOLDERS.map(p => (
                <button
                  key={p.key}
                  type="button"
                  title={p.label}
                  className="text-[10px] bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 px-1.5 py-0.5 rounded font-mono transition-colors"
                  onClick={() => setMsgTemplate(prev => prev + p.key)}
                >
                  {p.key}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Message Template
              <span className="ml-1.5 font-normal text-gray-400">(placeholders replaced per member)</span>
            </label>
            <textarea
              className="textarea textarea-sm w-full font-mono text-[11px] resize-y"
              rows={9}
              value={msgTemplate}
              onChange={e => setMsgTemplate(e.target.value)}
              placeholder="Write your message using {FullName}, {Sector} etc."
            />
            <div className="text-[10px] text-gray-400 text-right mt-0.5">{msgTemplate.length} chars</div>
          </div>

          {rows[0] && previewMessage && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Preview for <span className="text-blue-600">{rows[0].name}</span>
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-[11px] whitespace-pre-wrap text-gray-700 max-h-40 overflow-y-auto">
                {previewMessage}
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-[11px] text-amber-800">
            <strong>Background sending:</strong> Messages are queued in the database and sent by the server worker —
            you can close this page, navigate away, or even log out.
            Estimated time: <strong>{etaStr(rows.length - noMobileCount) || '—'}</strong>.
            Track progress in the <em>Queue Status</em> panel below the filters.
          </div>
        </div>
      )}
    </Modal>
  );
}
