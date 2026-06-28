'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/shared/Modal';
import { BellIcon, SendIcon } from '@/components/shared/Icons';
import toast from 'react-hot-toast';
import { notificationService } from '@/services';

/**
 * Send a personalised app (FCM push) notification to a single member.
 * Props:
 *   open     – boolean
 *   onClose  – function
 *   accno    – member account number
 *   name     – member display name
 *   title    – pre-filled notification title (editable)
 *   body     – pre-filled notification body (editable, plain text)
 *   type     – 'due_reminder' | 'announcement' | 'general'  (default: 'due_reminder')
 */
export default function SendAppNotificationModal({ open, onClose, accno, name, title: initTitle = '', body: initBody = '', type: initType = 'due_reminder' }) {
  const [title,   setTitle]   = useState(initTitle);
  const [body,    setBody]    = useState(initBody);
  const [type,    setType]    = useState(initType);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initTitle);
      setBody(initBody);
      setType(initType);
      setSending(false);
    }
  }, [open, initTitle, initBody, initType]);

  const handleSend = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!body.trim())  { toast.error('Message body is required'); return; }
    setSending(true);
    try {
      const res = await notificationService.send({
        title: title.trim(),
        body:  body.trim(),
        type,
        accnos: [accno],
      });
      toast.success(res.data?.message || 'Notification sent');
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Send App Notification — ${name || accno}`}
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={sending}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSend} disabled={sending}>
            <SendIcon className="w-3.5 h-3.5 mr-1.5" />
            {sending ? 'Sending…' : 'Send Notification'}
          </button>
        </>
      }
    >
      <div className="space-y-4">

        {/* Member chip */}
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <BellIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-[12px] font-semibold text-blue-800">{name}</span>
          <span className="text-[11px] text-blue-500 ml-auto">AccNo: {accno}</span>
        </div>

        {/* Type */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Type</label>
          <select className="select select-sm w-full" value={type} onChange={e => setType(e.target.value)}>
            <option value="due_reminder">Due Reminder</option>
            <option value="announcement">Announcement</option>
            <option value="general">General</option>
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
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Message</label>
          <textarea
            className="textarea textarea-sm w-full resize-y font-mono text-[11px]"
            rows={8}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Plain text message…"
          />
          <div className="text-[10px] text-gray-400 mt-0.5 text-right">{body.length} chars</div>
        </div>

        <p className="text-[10px] text-gray-400">
          This sends a push notification directly to {name}&apos;s JMS app. They must be logged in and have the app installed.
        </p>
      </div>
    </Modal>
  );
}
