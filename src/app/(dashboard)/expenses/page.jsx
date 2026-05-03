'use client';

import { useState, useEffect, useCallback } from 'react';
import { expenseService }  from '@/services';
import toast               from 'react-hot-toast';
import PageHeader          from '@/components/shared/PageHeader';
import Modal               from '@/components/shared/Modal';
import { SaveIcon, EditIcon } from '@/components/shared/Icons';

const today = () => new Date().toISOString().split('T')[0];

export default function ExpensesPage() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ date: today(), mainCat: 'Administration', subCat: 'General', description: '', amount: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await expenseService.getAll(); setRows(res.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm({ date: today(), mainCat: 'Administration', subCat: 'General', description: '', amount: '' }); setModal(true); };
  const openEdit = (r) => { setEditing(r); setForm({ ...r }); setModal(true); };

  const save = async () => {
    if (!form.description || !form.amount) { toast.error('Fill all required fields'); return; }
    try {
      if (editing) { await expenseService.update(editing.id, form); toast.success('Updated'); }
      else         { await expenseService.create(form); toast.success('Expense saved'); }
      setModal(false); load();
    } catch { toast.error('Failed to save'); }
  };

  const CATS = { Administration: ['General','Repair','Purchase'], Maintenance: ['Repair','Purchase','Civil'], FMB: ['Purchase','Wages','Utilities'], Event: ['Venue','Logistics','Other'] };

  return (
    <div>
      <PageHeader title="Expenses" subtitle="Record and manage all expense entries">
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Expense</button>
      </PageHeader>

      {/* Quick entry form */}
      <div className="card mb-4">
        <div className="card-header">New Expense Entry</div>
        <div className="card-body">
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div><label className="form-label">Date</label><input type="date" className="form-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
            <div><label className="form-label">Main Category</label>
              <select className="form-select" value={form.mainCat} onChange={e => setForm(p => ({ ...p, mainCat: e.target.value, subCat: '' }))}>
                {Object.keys(CATS).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="form-label">Sub Category</label>
              <select className="form-select" value={form.subCat} onChange={e => setForm(p => ({ ...p, subCat: e.target.value }))}>
                {(CATS[form.mainCat] || []).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="form-label">Amount (₹)</label><input type="number" className="form-input" placeholder="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div><label className="form-label">Description</label><input className="form-input" placeholder="Expense description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="flex items-end"><button className="btn btn-primary" onClick={save}><SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save Expense</button></div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">All Expenses</div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>{['Date','Main Category','Sub Category','Description','Amount','Added By','Action'].map(h => <th key={h} className="th-navy">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No expenses recorded</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border whitespace-nowrap">{r.date}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.mainCat}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.subCat}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.description}</td>
                  <td className="px-3 py-2.5 border-t border-border font-semibold">₹{Number(r.amount).toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.addedBy || 'Admin'}</td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}><EditIcon className="w-3.5 h-3.5 mr-1.5" />Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Expense' : 'Add Expense'} size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}><SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save</button></>}
      >
        <div className="space-y-3">
          <div><label className="form-label">Date</label><input type="date" className="form-input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Main Category</label>
              <select className="form-select" value={form.mainCat} onChange={e => setForm(p => ({ ...p, mainCat: e.target.value }))}>
                {Object.keys(CATS).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="form-label">Sub Category</label>
              <select className="form-select" value={form.subCat} onChange={e => setForm(p => ({ ...p, subCat: e.target.value }))}>
                {(CATS[form.mainCat] || []).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label className="form-label">Amount (₹)</label><input type="number" className="form-input" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
          <div><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  );
}
