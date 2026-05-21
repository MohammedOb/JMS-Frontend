'use client';
import { useState, useEffect } from 'react';
import { SaveIcon, RefreshIcon, XIcon } from '@/components/shared/Icons';
import { Label, AutocompleteInput, inp, sel } from './ui';
import { SLOTS, TIMES, STATUSES, RAZA, CLEARANCE_STATUSES } from './constants';
import { cleanDate } from './RegistrationModal';
import { majlisService } from '@/services';

export default function EditModal({ row, onClose, onSave }) {
  const [form, setForm]         = useState({ ...row, MajlisDate: cleanDate(row.MajlisDate), RegistrationDate: cleanDate(row.RegistrationDate), MajlisRaza: row.MajlisRaza || 'Raza Pending' });
  const [saving, setSaving]     = useState(false);
  const [suggestions, setSuggestions] = useState({});
  const sfn = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  useEffect(() => {
    majlisService.loadSuggestions()
      .then(res => setSuggestions(res?.data?.data || {}))
      .catch(() => {});
  }, []);

  const submit = async () => {
    setSaving(true);
    try {
      await onSave({
        ...form,
        MajlisDate:       cleanDate(form.MajlisDate),
        RegistrationDate: cleanDate(form.RegistrationDate),
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-t-xl px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white text-[15px]">Edit Registration</h2>
            <p className="text-slate-300 text-[12px] mt-0.5">
              {row.FullName} · Acc {row.AccNo}
              {row.RegistrationNo && <span className="ml-2 font-mono text-slate-400">#{row.RegistrationNo}</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-1">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Date / Slot / Time */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Schedule</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Majlis Date</Label>
                <input name="MajlisDate" type="date" className={inp} value={form.MajlisDate || ''} onChange={sfn} />
              </div>
              <div>
                <Label>Slot Type</Label>
                <AutocompleteInput
                  name="SlotType"
                  value={form.SlotType || ''}
                  onChange={sfn}
                  options={SLOTS}
                  placeholder="Night / Day"
                  className={inp}
                />
              </div>
              <div>
                <Label>Majlis Time</Label>
                <AutocompleteInput
                  name="MajlisTime"
                  value={form.MajlisTime || ''}
                  onChange={sfn}
                  options={TIMES}
                  placeholder="e.g. 8:00 PM"
                  className={inp}
                />
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Assignment</p>
            <div className="grid grid-cols-2 gap-3">
              {[['Sadar','Sadar'],['Zakereen','Zakereen'],['Tazeen','Tazeen'],['BGI','BGI'],['Care Taker','CareTaker']].map(([label, name]) => (
                <div key={name}>
                  <Label>{label}</Label>
                  <AutocompleteInput
                    name={name}
                    value={form[name] || ''}
                    onChange={sfn}
                    options={suggestions[name] || []}
                    className={inp}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Status</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Majlis Status</Label>
                <select name="MajlisStatus" className={sel} value={form.MajlisStatus || 'Pending'} onChange={sfn}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label>Majlis Raza</Label>
                <AutocompleteInput
                  name="MajlisRaza"
                  value={form.MajlisRaza || ''}
                  onChange={sfn}
                  options={RAZA}
                  placeholder="Raza status"
                  className={inp}
                />
              </div>
              <div>
                <Label>Clearance Status</Label>
                <select name="ClearanceStatus" className={sel} value={form.ClearanceStatus || ''} onChange={sfn}>
                  {CLEARANCE_STATUSES.map(s => <option key={s} value={s}>{s || '— Select —'}</option>)}
                </select>
              </div>
              <div className="col-span-3">
                <Label>Remark</Label>
                <input name="Remark" className={inp} value={form.Remark || ''} onChange={sfn} placeholder="Optional note…" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary px-6" onClick={submit} disabled={saving}>
            {saving
              ? <RefreshIcon className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              : <SaveIcon className="w-3.5 h-3.5 mr-1.5" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
