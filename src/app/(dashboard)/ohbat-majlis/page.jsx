'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter }   from 'next/navigation';
import toast           from 'react-hot-toast';
import PageHeader      from '@/components/shared/PageHeader';
import Modal           from '@/components/shared/Modal';
import { StatusBadge } from '@/components/shared/Badge';
import { PrintIcon, PlusIcon, EditIcon, SaveIcon } from '@/components/shared/Icons';
import { ohbatService } from '@/services';

const today = () => new Date().toISOString().split('T')[0];

export default function OhbatMajlisPage() {
  const router = useRouter();
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [membModal, setMembModal] = useState(null); // majlis id
  const [search,    setSearch]    = useState('');

  const [form, setForm] = useState({
    name: '', date: today(), venue: '', organizer: '',
    ohbatType: 'Monthly', expectedCount: '', notes: '', status: 'Planned',
  });

  const [membForm, setMembForm] = useState({ accno: '', role: 'Attendee', notes: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await ohbatService.getAll(); setRows(res.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm({ name: '', date: today(), venue: '', organizer: '', ohbatType: 'Monthly', expectedCount: '', notes: '', status: 'Planned' }); setModal(true); };
  const openEdit = (r) => { setEditing(r); setForm({ ...r }); setModal(true); };

  const save = async () => {
    if (!form.name) { toast.error('Enter Majlis name'); return; }
    try {
      if (editing) { await ohbatService.update(editing.id, form); toast.success('Updated'); }
      else         { await ohbatService.create(form); toast.success('Ohbat Majlis added'); }
      setModal(false); load();
    } catch { toast.error('Failed to save'); }
  };

  const addMember = async () => {
    if (!membForm.accno) { toast.error('Enter Acc No.'); return; }
    try {
      await ohbatService.addMember(membModal, membForm);
      toast.success('Member added');
      setMembModal(null);
      setMembForm({ accno: '', role: 'Attendee', notes: '' });
      load();
    } catch { toast.error('Failed'); }
  };

  const filtered = search
    ? rows.filter(r => r.name?.toLowerCase().includes(search.toLowerCase()) || r.organizer?.toLowerCase().includes(search.toLowerCase()))
    : rows;

  return (
    <div>
      <PageHeader title="Ohbat Majlis" subtitle="Brotherhood gatherings and community events">
        <button className="btn btn-secondary btn-sm"><PrintIcon className="w-3.5 h-3.5 mr-1.5" />Print List</button>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Ohbat Majlis</button>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Majlis',  val: rows.length,                                 color: 'text-navy-800' },
          { label: 'Planned',       val: rows.filter(r => r.status === 'Planned').length,   color: 'text-blue-500' },
          { label: 'Completed',     val: rows.filter(r => r.status === 'Completed').length, color: 'text-green-600' },
          { label: 'Cancelled',     val: rows.filter(r => r.status === 'Cancelled').length, color: 'text-red-500'  },
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span>All Ohbat Majlis Events</span>
          <input className="form-input w-52" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {['Date','Majlis Name','Type','Venue','Organizer','Expected','Attended','Status','Actions'].map(h =>
                  <th key={h} className="th-navy">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">No majlis found</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border whitespace-nowrap">{r.date}</td>
                  <td className="px-3 py-2.5 border-t border-border font-medium text-blue-500 cursor-pointer"
                    onClick={() => openEdit(r)}>{r.name}</td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <span className="badge badge-blue">{r.ohbatType}</span>
                  </td>
                  <td className="px-3 py-2.5 border-t border-border">{r.venue || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.organizer || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border text-center">{r.expectedCount || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border text-center font-semibold">{r.attendedCount || 0}</td>
                  <td className="px-3 py-2.5 border-t border-border"><StatusBadge status={r.status || 'Planned'} /></td>
                  <td className="px-3 py-2.5 border-t border-border whitespace-nowrap">
                    <button className="btn btn-primary btn-sm mr-1" onClick={() => setMembModal(r.id)}><PlusIcon className="w-3.5 h-3.5 mr-1" />Member</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}><EditIcon className="w-3.5 h-3.5 mr-1.5" />Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? `Edit — ${editing.name}` : 'Add Ohbat Majlis'}
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}><SaveIcon className="w-3.5 h-3.5 mr-1.5" />{editing ? 'Update' : 'Save'}</button>
          </>
        }
      >
        <div className="space-y-3">
          <div><label className="form-label">Majlis Name *</label><input className="form-input" placeholder="e.g. Ohbat Monthly Majlis" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Date</label><input type="date" className="form-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
            <div>
              <label className="form-label">Type</label>
              <select className="form-select" value={form.ohbatType} onChange={e => setForm(p => ({ ...p, ohbatType: e.target.value }))}>
                {['Monthly','Quarterly','Annual','Special','Emergency'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Venue</label><input className="form-input" placeholder="Location" value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} /></div>
            <div><label className="form-label">Organizer</label><input className="form-input" placeholder="Name" value={form.organizer} onChange={e => setForm(p => ({ ...p, organizer: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Expected Count</label><input type="number" className="form-input" value={form.expectedCount} onChange={e => setForm(p => ({ ...p, expectedCount: e.target.value }))} /></div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {['Planned','Confirmed','Completed','Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label className="form-label">Notes</label><textarea className="form-input h-16 py-2" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal open={!!membModal} onClose={() => setMembModal(null)} title="Add Member to Majlis" size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setMembModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={addMember}>+ Add</button>
          </>
        }
      >
        <div className="space-y-3">
          <div><label className="form-label">Account No. *</label><input className="form-input" placeholder="Member Acc No." value={membForm.accno} onChange={e => setMembForm(p => ({ ...p, accno: e.target.value }))} /></div>
          <div>
            <label className="form-label">Role</label>
            <select className="form-select" value={membForm.role} onChange={e => setMembForm(p => ({ ...p, role: e.target.value }))}>
              {['Attendee','Speaker','Organizer','Guest'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div><label className="form-label">Notes</label><input className="form-input" value={membForm.notes} onChange={e => setMembForm(p => ({ ...p, notes: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  );
}
