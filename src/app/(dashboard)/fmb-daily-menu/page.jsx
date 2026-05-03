'use client';

import { useState, useEffect, useCallback } from 'react';
import { fmbMenuService }  from '@/services';
import toast               from 'react-hot-toast';
import PageHeader          from '@/components/shared/PageHeader';
import Modal               from '@/components/shared/Modal';
import { StatusBadge }     from '@/components/shared/Badge';
import { SaveIcon, EditIcon } from '@/components/shared/Icons';

const today = () => new Date().toISOString().split('T')[0];

export default function FMBDailyMenuPage() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ date: today(), meal: 'Lunch & Dinner', menuItems: '', thaaliCount: '', status: 'Planned' });

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await fmbMenuService.getAll(); setRows(res.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm({ date: today(), meal: 'Lunch & Dinner', menuItems: '', thaaliCount: '', status: 'Planned' }); setModal(true); };
  const openEdit = (r) => { setEditing(r); setForm({ ...r }); setModal(true); };

  const save = async () => {
    if (!form.menuItems) { toast.error('Enter menu items'); return; }
    try {
      if (editing) { await fmbMenuService.update(editing.id, form); toast.success('Updated'); }
      else         { await fmbMenuService.create(form); toast.success('Menu added'); }
      setModal(false); load();
    } catch { toast.error('Failed to save'); }
  };

  return (
    <div>
      <PageHeader title="FMB Daily Menu" subtitle="Weekly meal plan and distribution management">
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Menu</button>
      </PageHeader>

      <div className="card">
        <div className="card-header">Menu Schedule</div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>{['Date','Meal','Menu Items','Thaali Count','Status','Action'].map(h => <th key={h} className="th-navy">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No menu entries</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border whitespace-nowrap">{r.date}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.meal}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.menuItems}</td>
                  <td className="px-3 py-2.5 border-t border-border font-semibold">{r.thaaliCount}</td>
                  <td className="px-3 py-2.5 border-t border-border"><StatusBadge status={r.status || 'Planned'} /></td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}><EditIcon className="w-3.5 h-3.5 mr-1.5" />Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Menu Entry' : 'Add Menu Entry'} size="md"
        footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}><SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save</button></>}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Date</label><input type="date" className="form-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
            <div><label className="form-label">Meal Type</label>
              <select className="form-select" value={form.meal} onChange={e => setForm(p => ({ ...p, meal: e.target.value }))}>
                {['Lunch & Dinner','Lunch Only','Dinner Only'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div><label className="form-label">Menu Items</label><input className="form-input" placeholder="e.g. Dal, Rice, Roti, Sabzi" value={form.menuItems} onChange={e => setForm(p => ({ ...p, menuItems: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Thaali Count</label><input type="number" className="form-input" value={form.thaaliCount} onChange={e => setForm(p => ({ ...p, thaaliCount: e.target.value }))} /></div>
            <div><label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {['Planned','Confirmed','Done','Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
