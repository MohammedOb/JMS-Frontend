'use client';

import { useEffect, useState } from 'react';
import muminApi from '@/lib/muminApi';

function timeAgo(str) {
  if (!str) return '';
  const diff = Date.now() - new Date(str).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const TYPE_BADGE = {
  announcement: { cls: 'bg-blue-100 text-blue-700',   label: 'Announcement' },
  due_reminder: { cls: 'bg-amber-100 text-amber-700', label: 'Due Reminder' },
  general:      { cls: 'bg-gray-100 text-gray-600',   label: 'General' },
};

function NotificationCard({ notif, onRead }) {
  const badge = TYPE_BADGE[notif.type] || TYPE_BADGE.general;

  return (
    <div
      className={`rounded-xl border p-4 transition-colors cursor-pointer ${
        notif.is_read
          ? 'bg-white border-gray-200'
          : 'bg-blue-50 border-blue-200'
      }`}
      onClick={() => !notif.is_read && onRead(notif.id)}
    >
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.is_read ? 'bg-gray-300' : 'bg-blue-500'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
            <span className="text-[10px] text-gray-400">{timeAgo(notif.created_at)}</span>
          </div>
          <div className="text-[13px] font-semibold text-gray-900">{notif.title}</div>
          <div
            className="notif-html text-[12px] text-gray-600 mt-0.5 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: notif.body }}
          />
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = () => {
    setLoading(true);
    muminApi.get('/mumin/notifications')
      .then(res => setNotifs(res.data?.data || []))
      .catch(() => setError('Failed to load notifications.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRead = async (id) => {
    try {
      await muminApi.put(`/mumin/notifications/${id}/read`);
      setNotifs(n => n.map(x => x.id === id ? { ...x, is_read: 1 } : x));
    } catch {}
  };

  const handleReadAll = async () => {
    try {
      await muminApi.put('/mumin/notifications/read-all');
      setNotifs(n => n.map(x => ({ ...x, is_read: 1 })));
    } catch {}
  };

  const unread = notifs.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-gray-900">Notifications</h1>
          {unread > 0 && <p className="text-[11px] text-blue-600">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button
            onClick={handleReadAll}
            className="text-[12px] text-blue-600 hover:underline font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>}

      <div className="space-y-2">
        {notifs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-[13px] text-gray-400">No notifications yet.</p>
          </div>
        ) : (
          notifs.map(n => (
            <NotificationCard key={n.id} notif={n} onRead={handleRead} />
          ))
        )}
      </div>
    </div>
  );
}
