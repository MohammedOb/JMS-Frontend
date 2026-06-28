'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/shared/Modal';
import { BellIcon, SendIcon } from '@/components/shared/Icons';
import toast from 'react-hot-toast';
import { notificationService } from '@/services';

const TYPE_OPTIONS = [
  { value: 'due_reminder',  label: 'Due Reminder'  },
  { value: 'announcement',  label: 'Announcement'  },
  { value: 'general',       label: 'General'        },
];

/**
 * Send a bulk app (FCM push) notification to multiple members at once.
 * Props:
 *   open         – boolean
 *   onClose      – function
 *   rows         – array of { accno, name } (name falls back from fullName)
 *   defaultTitle – pre-filled title (editable)
 *   defaultBody  – pre-filled body  (editable)
 *   defaultType  – 'due_reminder' | 'announcement' | 'general'
 */
export default function AppNotifBulkModal({
  open,
  onClose,
  rows = [],
  defaultTitle = '',
  defaultBody  = '',
  defaultType  = 'due_reminder',
}) {
  const [title,   setTitle]   = useState(defaultTitle);
  const [body,    setBody]    = useState(defaultBody);
  const [type,    setType]    = useState(defaultType);
  const [sending, setSending] = useState(false);
  const [result,  setResult]  = useState(null); // { successCount, failureCount }

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setBody(defaultBody);
      setType(defaultType);
      setSending(false);
      setResult(null);
    }
  }, [open, defaultTitle, defaultBody, defaultType]);

  const accnos = rows.map(r => r.accno).filter(Boolean);

  const handleSend = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!body.trim())  { toast.error('Message body is required'); return; }
    if (!accnos.length){ toast.error('No members selected'); return; }

    setSending(true);
    try {
      const res = await notificationService.send({
        title: title.trim(),
        body:  body.trim(),
        type,
        accnos,
      });
      const fcm = res.data?.fcm || {};
      setResult({
        successCount: fcm.successCount ?? res.data?.recipientCount ?? accnos.length,
        failureCount: fcm.failureCount ?? 0,
        total: accnos.length,
      });
      toast.success(res.data?.message || 'Notifications sent');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send notifications');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Send App Notification — ${accnos.length} member${accnos.length !== 1 ? 's' : ''}`}
      size="lg"
      footer={
        result ? (
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={onClose} disabled={sending}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim() || !accnos.length}
            >
              <SendIcon className="w-3.5 h-3.5 mr-1.5" />
              {sending ? 'Sending…' : `Send to ${accnos.length} member${accnos.length !== 1 ? 's' : ''}`}
            </button>
          </>
        )
      }
    >
      {result ? (
        /* ── Success state ─────────────────────────────────────────────── */
        <div className="space-y-4 py-2 text-center">
          <div className="text-5xl">🔔</div>
          <div>
            <div className="text-[16px] font-bold text-gray-800">
              Notifications sent to {result.total} member{result.total !== 1 ? 's' : ''}
            </div>
            <div className="text-[12px] text-gray-500 mt-1">
              FCM delivered: <span className="text-green-700 font-semibold">{result.successCount}</span>
              {result.failureCount > 0 && (
                <span className="ml-2 text-amber-600">· {result.failureCount} failed (not installed / no token)</span>
              )}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-[11px] text-blue-800 text-left">
            Members who have the JMS app installed and are logged in will see the notification in their Notifications tab.
          </div>
        </div>
      ) : (
        /* ── Compose state ─────────────────────────────────────────────── */
        <div className="space-y-4">

          {/* Summary banner */}
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-[12px] text-blue-800">
            <BellIcon className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>{accnos.length}</strong> member{accnos.length !== 1 ? 's' : ''} will receive this notification.
              Members without the JMS app installed will not receive it.
            </span>
          </div>

          {/* Type */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Type</label>
            <select className="select select-sm w-full" value={type} onChange={e => setType(e.target.value)}>
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Notification Title</label>
            <input
              type="text"
              className="input input-sm w-full"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Due Reminder"
              maxLength={120}
            />
            <div className="text-[10px] text-gray-400 mt-0.5 text-right">{title.length}/120</div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
              Message
              <span className="ml-1.5 font-normal text-gray-400">(same message sent to all members)</span>
            </label>
            <textarea
              className="textarea textarea-sm w-full resize-y font-mono text-[11px]"
              rows={7}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Plain text message…"
            />
            <div className="text-[10px] text-gray-400 mt-0.5 text-right">{body.length} chars</div>
          </div>

          {/* Member list preview */}
          {rows.length > 0 && (
            <div>
              <div className="text-[10px] text-gray-400 mb-1">
                Recipients ({Math.min(rows.length, 5)} shown{rows.length > 5 ? ` of ${rows.length}` : ''})
              </div>
              <div className="flex flex-wrap gap-1">
                {rows.slice(0, 5).map(r => (
                  <span key={r.accno} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                    {r.name || r.fullName || r.accno}
                  </span>
                ))}
                {rows.length > 5 && (
                  <span className="text-[10px] text-gray-400 px-1 py-0.5">+{rows.length - 5} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
