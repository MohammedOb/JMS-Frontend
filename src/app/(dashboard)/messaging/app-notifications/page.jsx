'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// Load editor only on client (ProseMirror uses browser APIs)
const RichTextEditor = dynamic(() => import('@/components/shared/RichTextEditor'), { ssr: false });

const TYPE_OPTIONS = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'due_reminder', label: 'Due Reminder' },
  { value: 'general',      label: 'General' },
];

const TYPE_BADGE = {
  announcement: 'bg-blue-100 text-blue-700',
  due_reminder: 'bg-amber-100 text-amber-700',
  general:      'bg-gray-100 text-gray-600',
};

const MAX_CHARS = 1000;

function timeAgo(str) {
  if (!str) return '';
  const diff = Date.now() - new Date(str).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function AppNotificationsPage() {
  const [form, setForm]           = useState({ title: '', body: '', type: 'announcement' });
  const [editorKey, setEditorKey] = useState(0);
  const [sending, setSending]     = useState(false);
  const [history, setHistory]     = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [expanded, setExpanded]   = useState(null);

  const plainBody = stripHtml(form.body);

  const loadHistory = useCallback(() => {
    setHistLoading(true);
    api.get('/admin/notifications')
      .then(res => setHistory(res.data?.data || []))
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, []);

  useEffect(loadHistory, [loadHistory]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !plainBody) {
      toast.error('Title and message are required.');
      return;
    }
    if (plainBody.length > MAX_CHARS) {
      toast.error(`Message too long. Max ${MAX_CHARS} characters.`);
      return;
    }
    setSending(true);
    try {
      const res = await api.post('/admin/notifications/send', {
        title: form.title.trim(),
        body:  form.body,          // HTML stored in DB
        type:  form.type,
      });
      toast.success(res.data?.message || 'Notification sent!');
      setForm({ title: '', body: '', type: 'announcement' });
      setEditorKey(k => k + 1);   // remount editor to clear content
      loadHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="App Notifications"
        subtitle="Push notifications for JMS Android & iOS apps"
      />

      {/* ── Excel Bulk shortcut ── */}
      <Link
        href="/messaging/app-notifications/excel"
        className="flex items-center gap-4 border border-blue-100 bg-blue-50 hover:bg-blue-100 rounded-2xl px-5 py-4 transition-colors group"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-blue-800 group-hover:text-blue-900">Bulk Notifications via Excel</div>
          <div className="text-[12px] text-blue-600 mt-0.5">Upload a spreadsheet and send personalized push notifications using {'{column}'} variables</div>
        </div>
        <div className="text-blue-400 group-hover:text-blue-600 text-lg">›</div>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Compose ── */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <h2 className="text-[14px] font-semibold text-gray-800 mb-4">Send Notification</h2>
          <form onSubmit={handleSend} className="space-y-4">
            {/* Type selector */}
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1">Type</label>
              <div className="flex gap-2 flex-wrap">
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                      form.type === opt.value
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1">Title</label>
              <input
                type="text"
                maxLength={100}
                placeholder="Notification title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Rich text message */}
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1">Message</label>
              <RichTextEditor
                key={editorKey}
                value={form.body}
                onChange={body => setForm(f => ({ ...f, body }))}
                placeholder="Write your notification message..."
              />
              <div className={`text-[10px] text-right mt-1 ${plainBody.length > MAX_CHARS ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                {plainBody.length} / {MAX_CHARS}
              </div>
            </div>

            {/* Phone preview */}
            {(form.title || plainBody) && (
              <div className="bg-gray-900 rounded-2xl p-3 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center">
                    <span className="text-[10px] font-bold">J</span>
                  </div>
                  <span className="text-[11px] text-gray-400">JMS Portal · now</span>
                </div>
                <div className="text-[13px] font-semibold">{form.title || 'Notification Title'}</div>
                <div className="text-[12px] text-gray-300 mt-0.5 line-clamp-3 whitespace-pre-line">
                  {plainBody || 'Message preview...'}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-gray-400">Sends to all active members with the app installed.</p>
              <button
                type="submit"
                disabled={sending || plainBody.length > MAX_CHARS}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl px-5 py-2 text-[13px] transition-colors flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Now
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── History ── */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-gray-800">Sent History</h2>
            <button onClick={loadHistory} className="text-[12px] text-blue-600 hover:underline">Refresh</button>
          </div>

          {histLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-[13px] text-gray-400">No notifications sent yet.</div>
          ) : (
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {history.map(n => {
                const isOpen = expanded === n.id;
                return (
                  <div key={n.id} className="border border-gray-100 rounded-xl p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_BADGE[n.type] || TYPE_BADGE.general}`}>
                        {TYPE_OPTIONS.find(t => t.value === n.type)?.label || n.type}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-auto">{timeAgo(n.created_at)}</span>
                    </div>
                    <div className="text-[13px] font-semibold text-gray-800 mb-1">{n.title}</div>

                    {/* Formatted body — toggle expand */}
                    <div
                      className={`notif-html text-[11px] text-gray-500 ${isOpen ? '' : 'line-clamp-3'}`}
                      dangerouslySetInnerHTML={{ __html: n.body }}
                    />
                    {stripHtml(n.body || '').length > 120 && (
                      <button
                        onClick={() => setExpanded(isOpen ? null : n.id)}
                        className="text-[10px] text-blue-500 hover:underline mt-0.5"
                      >
                        {isOpen ? 'Show less' : 'Show more'}
                      </button>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                      <span>{n.recipient_count || 0} recipients</span>
                      <span>by {n.created_by}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
