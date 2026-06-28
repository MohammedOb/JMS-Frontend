'use client';

import { useState, useEffect, useMemo } from 'react';
import Modal from '@/components/shared/Modal';
import { BellIcon, RefreshIcon, SendIcon } from '@/components/shared/Icons';
import toast from 'react-hot-toast';
import { waTemplateService, notificationService } from '@/services';
import { rowVars, interpolate, PLACEHOLDERS } from '@/app/(dashboard)/due-details/components/waUtils';
import { useSystemVars } from '@/context/SystemVarsContext';

const TYPE_OPTIONS = [
  { value: 'due_reminder',  label: 'Due Reminder'  },
  { value: 'announcement',  label: 'Announcement'  },
  { value: 'general',       label: 'General'        },
];

/**
 * Send personalized app (FCM) notifications to selected due-details rows.
 * Uses the same WhatsApp templates + {FullName}/{DueAmount}/… placeholder system.
 *
 * Props:
 *   open    – boolean
 *   onClose – function
 *   rows    – array of normalised due-details rows (accno, fullName, remaining, hubSubHead, fromYear, toYear, …)
 */
export default function AppNotifDueModal({ open, onClose, rows = [] }) {
  const { vars } = useSystemVars();
  const orgName  = vars.JAMAAT_NAME_FORMAL || 'Shia Dawoodi Bohra Jamaat, Sagwara';

  const [templates,    setTemplates]    = useState([]);
  const [selectedKey,  setSelectedKey]  = useState('due_reminder');
  const [titleTpl,     setTitleTpl]     = useState('Due Reminder — {HubSubHead} ({Year})');
  const [bodyTpl,      setBodyTpl]      = useState('');
  const [type,         setType]         = useState('due_reminder');
  const [sending,      setSending]      = useState(false);
  const [result,       setResult]       = useState(null);

  // Load WA templates when modal opens
  useEffect(() => {
    if (!open) return;
    setSending(false);
    setResult(null);

    waTemplateService.getAll()
      .then(res => {
        const list = (res.data?.data || []).filter(t => t.is_active);
        setTemplates(list);
        const key = list.some(t => t.template_key === 'due_reminder')
          ? 'due_reminder'
          : (list[0]?.template_key || '');
        setSelectedKey(key);
      })
      .catch(() => {});
  }, [open]);

  // Auto-fill body when template changes
  useEffect(() => {
    if (!selectedKey || !templates.length) return;
    const tpl = templates.find(t => t.template_key === selectedKey);
    if (tpl) setBodyTpl(tpl.body);
  }, [selectedKey, templates]);

  // Live preview for first row
  const previewVars    = useMemo(() => rows[0] ? rowVars(rows[0], orgName) : {}, [rows, orgName]);
  const previewTitle   = useMemo(() => interpolate(titleTpl, previewVars), [titleTpl, previewVars]);
  const previewBody    = useMemo(() => interpolate(bodyTpl,  previewVars), [bodyTpl,  previewVars]);

  const insertTitle = (chip) => setTitleTpl(p => p + chip);
  const insertBody  = (chip) => setBodyTpl(p => p + chip);

  async function handleSend() {
    if (!titleTpl.trim()) { toast.error('Title template is required'); return; }
    if (!bodyTpl.trim())  { toast.error('Message body template is required'); return; }
    if (!rows.length)     { toast.error('No members selected'); return; }

    const items = rows.map(row => ({
      accno: row.accno,
      title: interpolate(titleTpl, rowVars(row, orgName)),
      body:  interpolate(bodyTpl,  rowVars(row, orgName)),
    }));

    setSending(true);
    try {
      const res = await notificationService.sendBatch({ type, items });
      const fcm  = res.data?.fcm || {};
      setResult({
        total:        items.length,
        successCount: fcm.successCount ?? items.length,
        failureCount: fcm.failureCount ?? 0,
      });
      toast.success(res.data?.message || 'Notifications sent');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send notifications');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Send App Notification — ${rows.length} member${rows.length !== 1 ? 's' : ''}`}
      size="xl"
      footer={
        result ? (
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={onClose} disabled={sending}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={sending || !titleTpl.trim() || !bodyTpl.trim() || !rows.length}
            >
              <BellIcon className="w-3.5 h-3.5 mr-1.5" />
              {sending ? 'Sending…' : `Notify ${rows.length} member${rows.length !== 1 ? 's' : ''}`}
            </button>
          </>
        )
      }
    >
      {result ? (
        /* ── Success ──────────────────────────────────────────────────────── */
        <div className="space-y-4 py-2 text-center">
          <div className="text-5xl">🔔</div>
          <div>
            <div className="text-[16px] font-bold text-gray-800">
              Sent to {result.total} member{result.total !== 1 ? 's' : ''}
            </div>
            <div className="text-[12px] text-gray-500 mt-1">
              FCM delivered: <span className="text-green-700 font-semibold">{result.successCount}</span>
              {result.failureCount > 0 && (
                <span className="ml-2 text-amber-600">
                  · {result.failureCount} not delivered (app not installed / no token)
                </span>
              )}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-[11px] text-blue-800 text-left">
            Each member received a personalised notification with their own name and due amount.
            It will appear in their Notifications tab in the JMS app.
          </div>
        </div>
      ) : (
        /* ── Compose ──────────────────────────────────────────────────────── */
        <div className="space-y-4">

          {/* Banner */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-[12px] text-blue-800">
            <span className="text-lg leading-none">🔔</span>
            <div>
              <strong>{rows.length}</strong> member{rows.length !== 1 ? 's' : ''} selected.
              Each will receive a <strong>personalised</strong> notification — placeholders are replaced per member.
            </div>
          </div>

          {/* Type */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
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
                  title="Reset body to template"
                  className="btn btn-secondary btn-sm px-2"
                  onClick={() => {
                    const tpl = templates.find(t => t.template_key === selectedKey);
                    if (tpl) setBodyTpl(tpl.body);
                  }}
                >
                  <RefreshIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Type</label>
              <select className="select select-sm" value={type} onChange={e => setType(e.target.value)}>
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Placeholder chips */}
          <div>
            <div className="text-[10px] text-gray-400 mb-1">
              Click to insert into the <strong>focused</strong> field (title or body):
            </div>
            <div className="flex flex-wrap gap-1">
              {PLACEHOLDERS.map(p => (
                <span key={p.key} className="flex gap-0.5">
                  <button
                    type="button"
                    title={`Insert into title: ${p.label}`}
                    className="text-[10px] bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 px-1.5 py-0.5 rounded-l font-mono transition-colors border-r border-gray-200"
                    onClick={() => insertTitle(p.key)}
                  >T</button>
                  <button
                    type="button"
                    title={`Insert into body: ${p.label}`}
                    className="text-[10px] bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 px-1.5 py-0.5 rounded-r font-mono transition-colors"
                    onClick={() => insertBody(p.key)}
                  >{p.key}</button>
                </span>
              ))}
            </div>
            <div className="text-[9px] text-gray-400 mt-1">
              <kbd className="bg-gray-200 text-gray-600 px-1 rounded text-[9px]">T</kbd> = insert into title &nbsp;|&nbsp; main button = insert into body
            </div>
          </div>

          {/* Title field */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Notification Title
              <span className="ml-1.5 font-normal text-gray-400">(placeholders replaced per member)</span>
            </label>
            <input
              type="text"
              className="input input-sm w-full font-mono text-[11px]"
              value={titleTpl}
              onChange={e => setTitleTpl(e.target.value)}
              maxLength={120}
            />
            {previewTitle && (
              <div className="text-[10px] text-blue-600 mt-0.5">
                Preview: <span className="italic">{previewTitle}</span>
              </div>
            )}
          </div>

          {/* Body textarea */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Message Body
              <span className="ml-1.5 font-normal text-gray-400">(placeholders replaced per member)</span>
            </label>
            <textarea
              className="textarea textarea-sm w-full font-mono text-[11px] resize-y"
              rows={9}
              value={bodyTpl}
              onChange={e => setBodyTpl(e.target.value)}
              placeholder="Write message using {FullName}, {DueAmount}, {HubSubHead} etc."
            />
            <div className="text-[10px] text-gray-400 text-right mt-0.5">{bodyTpl.length} chars</div>
          </div>

          {/* Live preview */}
          {rows[0] && previewBody && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Preview for <span className="text-blue-600">{rows[0].fullName}</span>
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-[11px] whitespace-pre-wrap text-gray-700 max-h-40 overflow-y-auto">
                {previewBody}
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-[11px] text-amber-800">
            Only members who have the JMS app installed and are logged in will receive the notification.
            Others will not see it.
          </div>
        </div>
      )}
    </Modal>
  );
}
