'use client';

import { useState, useEffect, useCallback } from 'react';
import { safaiService }   from '@/services';
import { useRouter }      from 'next/navigation';
import toast              from 'react-hot-toast';
import PageHeader         from '@/components/shared/PageHeader';
import Modal              from '@/components/shared/Modal';
import { StatusBadge }    from '@/components/shared/Badge';
import { PrintIcon, EditIcon, SaveIcon } from '@/components/shared/Icons';

const today = () => new Date().toISOString().split('T')[0];

export default function SafaiChitthiPage() {
  const router = useRouter();
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ accno: '', issueDate: today(), validTill: '', reason: '', remark: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await safaiService.getAll(); setRows(res.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm({ accno: '', issueDate: today(), validTill: '', reason: '', remark: '' }); setModal(true); };
  const openEdit = (r) => { setEditing(r); setForm({ ...r }); setModal(true); };

  const save = async () => {
    if (!form.reason) { toast.error('Enter reason'); return; }
    try {
      if (editing) { await safaiService.update(editing.id, form); toast.success('Updated'); }
      else         { await safaiService.create(form); toast.success('Chitthi issued'); }
      setModal(false); load();
    } catch { toast.error('Failed to save'); }
  };

  return (
    <div>
      <PageHeader title="Safai Chitthi Book" subtitle="Membership clearance certificates management">
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ New Chitthi</button>
      </PageHeader>

      <div className="card">
        <div className="card-header">All Safai Chitthis</div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>{['Chitthi#','Member Name','Acc#','Issue Date','Valid Till','Reason','Status','Print','Edit'].map(h => <th key={h} className="th-navy">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">No chitthis found</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border font-semibold">{r.chitthiNo}</td>
                  <td className="px-3 py-2.5 border-t border-border font-medium text-blue-500 cursor-pointer"
                    onClick={() => router.push(`/mumin-details?accno=${r.accno}`)}>{r.memberName}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.accno}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.issueDate}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.validTill}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.reason}</td>
                  <td className="px-3 py-2.5 border-t border-border"><StatusBadge status={r.status || 'Active'} /></td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <button className="btn btn-secondary btn-sm"><PrintIcon className="w-3.5 h-3.5 mr-1.5" />Print</button>
                  </td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}><EditIcon className="w-3.5 h-3.5 mr-1.5" />Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Edit Chitthi — ${editing.chitthiNo}` : 'New Safai Chitthi'} size="md"
        footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}><SaveIcon className="w-3.5 h-3.5 mr-1.5" />{editing ? 'Update' : 'Issue Chitthi'}</button></>}
      >
        <div className="space-y-3">
          {!editing && (
            <div><label className="form-label">Account No.</label><input className="form-input" placeholder="Acc No." value={form.accno} onChange={e => setForm(p => ({ ...p, accno: e.target.value }))} /></div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Issue Date</label><input type="date" className="form-input" value={form.issueDate} onChange={e => setForm(p => ({ ...p, issueDate: e.target.value }))} /></div>
            <div><label className="form-label">Valid Till</label><input type="date" className="form-input" value={form.validTill} onChange={e => setForm(p => ({ ...p, validTill: e.target.value }))} /></div>
          </div>
          <div><label className="form-label">Reason</label><input className="form-input" placeholder="e.g. Travel, Nikah, Medical" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} /></div>
          {editing && (
            <div><label className="form-label">Status</label>
              <select className="form-select" value={form.status || 'Active'} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {['Active','Expired','Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div><label className="form-label">Remarks</label><textarea className="form-input h-16 py-2" value={form.remark} onChange={e => setForm(p => ({ ...p, remark: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  );
}
