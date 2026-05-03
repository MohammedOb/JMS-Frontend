'use client';

import { useState, useEffect } from 'react';
import { mohallahService }    from '@/services';
import toast                  from 'react-hot-toast';
import PageHeader             from '@/components/shared/PageHeader';
import Modal                  from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';

export default function MohallahPage() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState({ code: '', name: '', area: '' });

  const load = () => {
    mohallahService.getAll()
      .then(r => setRows(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      await mohallahService.create(form);
      toast.success('Mohallah added');
      setModal(false);
      load();
    } catch { toast.error('Failed to save'); }
  };

  return (
    <div>
      <PageHeader title="Mohallah Details" subtitle="Neighbourhood areas and member groupings">
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Mohallah</button>
      </PageHeader>

      <div className="card">
        <div className="card-header">Mohallah List</div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>{['Code','Mohallah Name','Masjid Area','Member Count','HOF Count','Action'].map(h => <th key={h} className="th-navy">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No mohallah found</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border font-semibold">{r.code}</td>
                  <td className="px-3 py-2.5 border-t border-border font-medium">{r.name}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.area}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.memberCount}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.hofCount}</td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <button className="btn btn-secondary btn-sm">View &amp; Print</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Mohallah" size="sm"
        footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}><SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save</button></>}
      >
        <div className="space-y-3">
          <div><label className="form-label">Code</label><input className="form-input" placeholder="e.g. MA" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} /></div>
          <div><label className="form-label">Mohallah Name</label><input className="form-input" placeholder="Full name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className="form-label">Masjid Area</label><input className="form-input" placeholder="e.g. Area 1" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  );
}
