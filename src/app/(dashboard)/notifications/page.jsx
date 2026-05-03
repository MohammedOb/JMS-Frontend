'use client';

import { useState, useEffect, useCallback } from 'react';
import toast              from 'react-hot-toast';
import PageHeader         from '@/components/shared/PageHeader';
import Modal              from '@/components/shared/Modal';
import { StatusBadge }    from '@/components/shared/Badge';
import { notificationService } from '@/services';
import { CheckIcon, PlusIcon, XIcon, SendIcon } from '@/components/shared/Icons';

const TYPE_COLORS = {
  'Info':    'blue',
  'Warning': 'amber',
  'Alert':   'red',
  'Success': 'green',
};

const today = () => new Date().toISOString().split('T')[0];

export default function NotificationsPage() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [filter,  setFilter]  = useState('All');
  const [form,    setForm]    = useState({ title: '', message: '', type: 'Info', target: 'All Users', date: today() });

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await notificationService.getAll(); setRows(res.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!form.title || !form.message) { toast.error('Fill required fields'); return; }
    try {
      await notificationService.create(form);
      toast.success('Notification sent');
      setModal(false);
      setForm({ title: '', message: '', type: 'Info', target: 'All Users', date: today() });
      load();
    } catch { toast.error('Failed to send'); }
  };

  const markRead = async (id) => {
    try { await notificationService.markRead(id); load(); }
    catch { toast.error('Failed'); }
  };

  const markAllRead = async () => {
    try { await notificationService.markAllRead(); toast.success('All marked as read'); load(); }
    catch { toast.error('Failed'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this notification?')) return;
    try { await notificationService.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const filtered = filter === 'All' ? rows : filter === 'Unread' ? rows.filter(r => !r.isRead) : rows.filter(r => r.type === filter);
  const unreadCount = rows.filter(r => !r.isRead).length;

  return (
    <div>
      <PageHeader title="Notifications" subtitle="System alerts and announcements">
        <button className="btn btn-secondary btn-sm" onClick={markAllRead}><CheckIcon className="w-3.5 h-3.5 mr-1.5" />Mark All Read</button>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><PlusIcon className="w-3.5 h-3.5 mr-1.5" />New Notification</button>
      </PageHeader>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total',   val: rows.length,                       color: 'text-navy-800' },
          { label: 'Unread',  val: unreadCount,                       color: 'text-blue-500' },
          { label: 'Alerts',  val: rows.filter(r=>r.type==='Alert').length,   color: 'text-red-500'  },
          { label: 'Warnings',val: rows.filter(r=>r.type==='Warning').length, color: 'text-amber-500'},
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span>Notification Center</span>
          <div className="flex gap-1">
            {['All','Unread','Info','Warning','Alert','Success'].map(f => (
              <button key={f}
                className={`px-2.5 py-1 text-[11px] rounded font-medium transition-colors ${filter===f ? 'bg-navy-800 text-white' : 'bg-surface-2 text-gray-500 hover:bg-gray-200'}`}
                onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>{['','Title','Message','Type','Target','Date','Status','Actions'].map(h => <th key={h} className="th-navy">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No notifications</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={i} className={`hover:bg-blue-500/[0.025] ${!r.isRead ? 'bg-blue-500/[0.04]' : ''}`}>
                  <td className="px-3 py-2.5 border-t border-border w-6">
                    {!r.isRead && <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />}
                  </td>
                  <td className="px-3 py-2.5 border-t border-border font-semibold">{r.title}</td>
                  <td className="px-3 py-2.5 border-t border-border max-w-xs truncate">{r.message}</td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <span className={`badge badge-${TYPE_COLORS[r.type] || 'gray'}`}>{r.type}</span>
                  </td>
                  <td className="px-3 py-2.5 border-t border-border">{r.target || 'All Users'}</td>
                  <td className="px-3 py-2.5 border-t border-border whitespace-nowrap">{r.date}</td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <StatusBadge status={r.isRead ? 'Read' : 'Unread'} />
                  </td>
                  <td className="px-3 py-2.5 border-t border-border whitespace-nowrap">
                    {!r.isRead && (
                      <button className="btn btn-secondary btn-sm mr-1" onClick={() => markRead(r.id)}><CheckIcon className="w-3.5 h-3.5 mr-1" />Read</button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => del(r.id)}><XIcon className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Send New Notification" size="md"
        footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={send}><SendIcon className="w-3.5 h-3.5 mr-1.5" />Send</button></>}
      >
        <div className="space-y-3">
          <div><label className="form-label">Title *</label><input className="form-input" placeholder="Notification title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
          <div><label className="form-label">Message *</label><textarea className="form-input h-20 py-2" placeholder="Notification message…" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {['Info','Warning','Alert','Success'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="form-label">Target</label>
              <select className="form-select" value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value }))}>
                {['All Users','Super Admin Only','Accounts Only','Reports Only'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div><label className="form-label">Date</label><input type="date" className="form-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  );
}
