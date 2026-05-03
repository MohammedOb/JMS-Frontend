'use client';

import { useState, useEffect } from 'react';
import { musaidaService }  from '@/services';
import toast               from 'react-hot-toast';
import PageHeader          from '@/components/shared/PageHeader';
import Modal               from '@/components/shared/Modal';
import { StatusBadge }     from '@/components/shared/Badge';
import { SaveIcon } from '@/components/shared/Icons';

const today = () => new Date().toISOString().split('T')[0];

export default function MusaidaPage() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState({ accno: '', type: 'Medical Aid', amount: '', date: today(), reason: '', status: 'Pending' });

  const load = () => {
    musaidaService.getAll()
      .then(r => setRows(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.accno || !form.amount) { toast.error('Fill required fields'); return; }
    try {
      await musaidaService.create(form);
      toast.success('Record added');
      setModal(false);
      load();
    } catch { toast.error('Failed to save'); }
  };

  return (
    <div>
      <PageHeader title="Musaida List" subtitle="Financial assistance records">
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Record</button>
      </PageHeader>

      <div className="card">
        <div className="card-header">Musaida Records</div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>{['Acc#','Name','Type','Amount','Date','Reason','Status','Action'].map(h => <th key={h} className="th-navy">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No records found</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border">{r.accno}</td>
                  <td className="px-3 py-2.5 border-t border-border font-medium">{r.name}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.type}</td>
                  <td className="px-3 py-2.5 border-t border-border font-semibold">₹{Number(r.amount).toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.date}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.reason}</td>
                  <td className="px-3 py-2.5 border-t border-border"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <button className="btn btn-secondary btn-sm">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Musaida Record" size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}><SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save</button></>}
      >
        <div className="space-y-3">
          <div><label className="form-label">Account No.</label><input className="form-input" value={form.accno} onChange={e => setForm(p => ({ ...p, accno: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Type</label><select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>{['Medical Aid','Education','Housing','Food','Other'].map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="form-label">Amount (₹)</label><input type="number" className="form-input" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
          </div>
          <div><label className="form-label">Date</label><input type="date" className="form-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
          <div><label className="form-label">Reason</label><input className="form-input" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} /></div>
          <div><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>{['Pending','Approved','Rejected'].map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
      </Modal>
    </div>
  );
}
