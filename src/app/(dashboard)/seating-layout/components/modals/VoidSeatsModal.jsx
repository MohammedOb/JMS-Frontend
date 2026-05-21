'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/shared/Modal';
import { PlusIcon, TrashIcon } from '@/components/shared/Icons';
import { getRowLabel } from '../constants';
import { voidService } from '@/services';
import toast from 'react-hot-toast';

const EMPTY_FORM = { RowFrom: 'A', RowTo: 'A', ColFrom: '1', ColTo: '1', Label: '' };

export default function VoidSeatsModal({ open, section, onClose, onSaved }) {
  const [groups,  setGroups]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) { setForm(EMPTY_FORM); return; }
    if (!section?.ID) return;
    setLoading(true);
    voidService.loadVoidGroups({ SectionID: section.ID })
      .then(res => setGroups(res.data?.data || []))
      .catch(() => toast.error('Failed to load void groups'))
      .finally(() => setLoading(false));
  }, [open, section?.ID]);

  if (!section) return null;

  const rowOptions = Array.from({ length: section.RowCount }, (_, i) => getRowLabel(i));
  const colOptions = Array.from({ length: section.ColCount }, (_, i) => String(i + 1));

  const addGroup = () => {
    if (!form.Label.trim()) { toast.error('Label is required'); return; }
    setGroups(prev => [...prev, {
      RowFrom: form.RowFrom, RowTo: form.RowTo,
      ColFrom: parseInt(form.ColFrom), ColTo: parseInt(form.ColTo),
      Label: form.Label.trim(),
    }]);
    setForm(EMPTY_FORM);
  };

  const removeGroup = (idx) => setGroups(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    try {
      await voidService.saveVoidGroups({ SectionID: section.ID, Groups: groups });
      toast.success('Void seats saved');
      onSaved?.();
      onClose();
    } catch { toast.error('Failed to save void groups'); }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Void Seats — ${section.SectionName}`}
      size="lg"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save</button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          Void seats are permanently removed from the booking grid (pillars, Qibla wall, stage, gate, etc.).
          They appear as labeled dark blocks on the map across <strong>all events and years</strong>.
        </p>

        {/* Add group form */}
        <div className="border border-border rounded-lg p-3 bg-surface space-y-3">
          <p className="text-xs font-semibold text-navy-700">Add Void Area</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              ['Row From', 'RowFrom', rowOptions],
              ['Row To',   'RowTo',   rowOptions],
              ['Col From', 'ColFrom', colOptions],
              ['Col To',   'ColTo',   colOptions],
            ].map(([label, field, opts]) => (
              <div key={field}>
                <label className="form-label">{label}</label>
                <select className="form-input" value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}>
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="form-label">Label (e.g. Qibla, Stage, Pillar, Gate) <span className="text-red-500">*</span></label>
              <input
                className="form-input"
                value={form.Label}
                onChange={e => setForm(p => ({ ...p, Label: e.target.value }))}
                placeholder="Enter label…"
                onKeyDown={e => e.key === 'Enter' && addGroup()}
              />
            </div>
            <button onClick={addGroup} className="btn-primary flex items-center gap-1 text-sm shrink-0">
              <PlusIcon className="w-3.5 h-3.5" />Add
            </button>
          </div>
        </div>

        {/* Current void groups */}
        {loading ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : groups.length === 0 ? (
          <p className="text-xs text-gray-400">No void areas defined. Add one above.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 uppercase tracking-wide text-[10px]">
                <th className="text-left py-1 font-medium">Label</th>
                <th className="text-center py-1 font-medium">Row From</th>
                <th className="text-center py-1 font-medium">Row To</th>
                <th className="text-center py-1 font-medium">Col From</th>
                <th className="text-center py-1 font-medium">Col To</th>
                <th className="py-1" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groups.map((g, idx) => (
                <tr key={idx} className="hover:bg-surface transition-colors">
                  <td className="py-1.5">
                    <span className="px-2 py-0.5 bg-slate-700 text-white rounded text-[10px] font-semibold">
                      {g.Label}
                    </span>
                  </td>
                  <td className="py-1.5 text-center font-medium">{g.RowFrom}</td>
                  <td className="py-1.5 text-center font-medium">{g.RowTo}</td>
                  <td className="py-1.5 text-center">{g.ColFrom}</td>
                  <td className="py-1.5 text-center">{g.ColTo}</td>
                  <td className="py-1.5 text-right">
                    <button
                      onClick={() => removeGroup(idx)}
                      className="p-1 rounded hover:bg-red-50 text-red-500"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  );
}
