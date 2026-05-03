'use client';

import { useState, useEffect, useCallback } from 'react';
import { followupService } from '@/services';
import { useRouter }       from 'next/navigation';
import toast               from 'react-hot-toast';
import PageHeader          from '@/components/shared/PageHeader';
import Modal               from '@/components/shared/Modal';
import { StatusBadge }     from '@/components/shared/Badge';
import { SaveIcon, EditIcon } from '@/components/shared/Icons';

const fmt   = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
const today = () => new Date().toISOString().split('T')[0];

export default function FollowupPage() {
  const router = useRouter();
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ accno:'', date: today(), note:'', action:'Call Again' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await followupService.getAll();
      setRows(res.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ accno:'', date: today(), note:'', action:'Call Again' }); setModal(true); };
  const openEdit = (r) => { setEditing(r); setForm({ ...r }); setModal(true); };

  const save = async () => {
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

  return (
    <div>
      <PageHeader title="Follow Up List" subtitle="Members scheduled for payment follow-up">
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Follow-up</button>
      </PageHeader>

      <div className="card">
        <div className="card-header">
          Follow-up Records
          {rows.length > 0 && <span className="text-[11px] text-gray-400 font-normal">{rows.length} records</span>}
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {['Acc#','Name','Mobile','Remaining','Type','Follow-up Date','Note','Next Action','Action'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">No follow-up records</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border text-blue-500 font-semibold cursor-pointer"
                      onClick={() => router.push(`/mumin-details?accno=${r.accno}`)}>{r.accno}</td>
                  <td className="px-3 py-2.5 border-t border-border font-medium">{r.name}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.mobile || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border font-bold text-red-600">{fmt(r.remaining)}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.type || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border whitespace-nowrap">{r.followupDate}</td>
                  <td className="px-3 py-2.5 border-t border-border max-w-[200px] truncate">{r.note || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.action || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}><EditIcon className="w-3.5 h-3.5 mr-1.5" />Edit</button>
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
        title={editing ? 'Edit Follow-up' : 'Add Follow-up Note'}
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}><SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save Follow-up</button>
          </>
        }
      >
        <div className="space-y-3">
          {!editing && (
            <div>
              <label className="form-label">Account No.</label>
              <input className="form-input" placeholder="Enter Acc No." value={form.accno} onChange={e => setForm(p => ({ ...p, accno: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="form-label">Follow-up Date</label>
            <input type="date" className="form-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Reason / Note</label>
            <input className="form-input" placeholder="e.g. Called — no response" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Next Action</label>
            <select className="form-select" value={form.action} onChange={e => setForm(p => ({ ...p, action: e.target.value }))}>
              {['Call Again','Visit','Send SMS','Mark as Done'].map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
