'use client';

import { useState, useEffect } from 'react';
import { majlisService }  from '@/services';
import toast              from 'react-hot-toast';
import PageHeader         from '@/components/shared/PageHeader';
import Modal              from '@/components/shared/Modal';
import { StatusBadge }    from '@/components/shared/Badge';
import { PrintIcon, PlusIcon, SaveIcon } from '@/components/shared/Icons';

const today = () => new Date().toISOString().split('T')[0];

export default function MajlisPage() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState({ date: today(), name: '', venue: 'Masjid Al-Amin', organizer: '', notes: '' });

  const load = () => {
    majlisService.getAll()
      .then(r => setRows(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name) { toast.error('Enter Majlis name'); return; }
    try {
      await majlisService.create(form);
      toast.success('Majlis added');
      setModal(false);
      load();
    } catch { toast.error('Failed to save'); }
  };

  return (
    <div>
      <PageHeader title="Majlis List" subtitle="Community gatherings and event management">
        <button className="btn btn-secondary btn-sm"><PrintIcon className="w-3.5 h-3.5 mr-1.5" />Print List</button>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><PlusIcon className="w-3.5 h-3.5 mr-1.5" />Add Majlis</button>
      </PageHeader>

      <div className="card">
        <div className="card-header">All Majlis Events</div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>{['Date','Majlis Name','Venue','Organizer','Status','Action'].map(h => <th key={h} className="th-navy">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No majlis found</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border whitespace-nowrap">{r.date}</td>
                  <td className="px-3 py-2.5 border-t border-border font-medium">{r.name}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.venue}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.organizer || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border"><StatusBadge status={r.status || 'Planned'} /></td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <button className="btn btn-secondary btn-sm">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Majlis" size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}><SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save</button></>}
      >
        <div className="space-y-3">
          <div><label className="form-label">Date</label><input type="date" className="form-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
          <div><label className="form-label">Majlis Name</label><input className="form-input" placeholder="e.g. Majlis Qurbani" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className="form-label">Venue</label><select className="form-select" value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))}>{['Masjid Al-Amin','Community Hall','Distribution Point'].map(v => <option key={v}>{v}</option>)}</select></div>
          <div><label className="form-label">Organizer</label><input className="form-input" placeholder="Name" value={form.organizer} onChange={e => setForm(p => ({ ...p, organizer: e.target.value }))} /></div>
          <div><label className="form-label">Notes</label><textarea className="form-input h-16 py-2" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  );
}
