'use client';
import PermissionGuard from '@/components/shared/PermissionGuard';

import { useState, useEffect, useCallback } from 'react';
import { followupService } from '@/services';
import { useAuth }         from '@/context/AuthContext';
import { useRouter }       from 'next/navigation';
import toast               from 'react-hot-toast';
import PageHeader          from '@/components/shared/PageHeader';
import Modal               from '@/components/shared/Modal';
import { SaveIcon, EditIcon, CheckIcon, RefreshIcon } from '@/components/shared/Icons';

const fmt     = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
const today   = () => new Date().toISOString().split('T')[0];
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString('en-GB').replace(/\//g, '-');
};

const ACTION_OPTIONS = ['Call Again', 'Visit', 'Send SMS', 'Mark as Done'];

function StatusBadge({ status }) {
  return status === 'closed'
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">Closed</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">Open</span>;
}

export default function FollowupPage() {
  const router     = useRouter();
  const { can }    = useAuth();
  const [rows,     setRows]    = useState([]);
  const [loading,  setLoading] = useState(true);
  const [modal,    setModal]   = useState(false);
  const [editing,  setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState('open');
  const [form,     setForm]    = useState({ accno: '', date: today(), note: '', response: '', action: 'Call Again' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await followupService.getAll(params);
      setRows(res.data?.data ?? res.data ?? []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm({ accno: '', date: today(), note: '', response: '', action: 'Call Again' }); setModal(true); };
  const openEdit = (r) => { setEditing(r); setForm({ accno: r.accno, date: r.followup_date?.slice(0,10) || today(), note: r.note || '', response: r.response || '', action: r.next_action || 'Call Again' }); setModal(true); };

  const save = async () => {
    if (!editing && !form.accno.trim()) { toast.error('Account number is required'); return; }
    try {
      if (editing) {
        await followupService.update(editing.id, form);
        toast.success('Updated');
      } else {
        await followupService.create(form);
        toast.success('Follow-up added');
      }
      setModal(false);
      load();
    } catch { toast.error('Failed to save'); }
  };

  const handleClose = async (r) => {
    try {
      await followupService.close(r.id);
      toast.success('Follow-up closed');
      load();
    } catch { toast.error('Failed to close'); }
  };

  const handleReopen = async (r) => {
    try {
      await followupService.reopen(r.id);
      toast.success('Follow-up reopened');
      load();
    } catch { toast.error('Failed to reopen'); }
  };

  const openCount   = rows.filter(r => r.status === 'open').length;
  const closedCount = rows.filter(r => r.status === 'closed').length;

  return (
    <PermissionGuard permission="followup.view">
    <div>
      <PageHeader title="Follow Up List" subtitle="Members scheduled for payment follow-up">
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Follow-up</button>
      </PageHeader>

      {/* Summary chips */}
      <div className="flex gap-2 mb-3">
        {[
          { label: 'All',    value: '',       count: rows.length },
          { label: 'Open',   value: 'open',   count: openCount },
          { label: 'Closed', value: 'closed', count: closedCount },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
              statusFilter === f.value
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-500 border-border hover:border-blue-400 hover:text-blue-500'
            }`}
          >
            {f.label} {f.count > 0 && <span className="ml-1 opacity-70">{f.count}</span>}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          Follow-up Records
          {rows.length > 0 && <span className="text-[11px] text-gray-400 font-normal ml-2">{rows.length} records</span>}
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {['Acc#','Name','Mobile','Remaining','Type','Follow-up Date','Note','Response','Next Action','Status','Action'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-10 text-gray-400">No follow-up records</td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.id ?? i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border text-blue-500 font-semibold cursor-pointer"
                      onClick={() => router.push(`/mumin-details?accno=${r.accno}&tab=followup`)}>{r.accno}</td>
                  <td className="px-3 py-2.5 border-t border-border font-medium">{r.name || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.mobile || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border font-bold text-red-600">{fmt(r.remaining)}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.type || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border whitespace-nowrap">{fmtDate(r.followup_date)}</td>
                  <td className="px-3 py-2.5 border-t border-border max-w-[180px] truncate">{r.note || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border max-w-[200px] truncate text-green-700">{r.response || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.next_action || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>
                        <EditIcon className="w-3.5 h-3.5 mr-1" />Edit
                      </button>
                      {r.status === 'open' && can('followup.close') && (
                        <button className="btn btn-sm bg-green-50 text-green-700 border border-green-200 hover:bg-green-100" onClick={() => handleClose(r)}>
                          <CheckIcon className="w-3.5 h-3.5 mr-1" />Close
                        </button>
                      )}
                      {r.status === 'closed' && can('followup.edit') && (
                        <button className="btn btn-sm bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100" onClick={() => handleReopen(r)}>
                          <RefreshIcon className="w-3.5 h-3.5 mr-1" />Reopen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Follow-up' : 'Add Follow-up'}
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}><SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save</button>
          </>
        }
      >
        <div className="space-y-3">
          {!editing && (
            <div>
              <label className="form-label">Account No.</label>
              <input className="form-input" placeholder="Enter Acc No." value={form.accno}
                onChange={e => setForm(p => ({ ...p, accno: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="form-label">Follow-up Date</label>
            <input type="date" className="form-input" value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Reason / Note</label>
            <input className="form-input" placeholder="e.g. Called — no response" value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
          </div>
          {editing && (
            <div>
              <label className="form-label">Response / Callback Note</label>
              <textarea
                className="form-input min-h-[80px] resize-y"
                placeholder="e.g. Member said will pay by Friday…"
                value={form.response}
                onChange={e => setForm(p => ({ ...p, response: e.target.value }))}
              />
            </div>
          )}
          <div>
            <label className="form-label">Next Action</label>
            <select className="form-select" value={form.action}
              onChange={e => setForm(p => ({ ...p, action: e.target.value }))}>
              {ACTION_OPTIONS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
    </PermissionGuard>
  );
}
