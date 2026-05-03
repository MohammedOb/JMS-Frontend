'use client';

import { SaveIcon } from '@/components/shared/Icons';
import { fmt } from '../../../utils';

export default function VajebaatQuickEntry({ vajForm, setVajForm, permissions, onSave }) {
  const grandTotal = ['sf', 'vaj', 'house', 'niyaz', 'other']
    .reduce((s, k) => s + (Number(vajForm[k]) || 0), 0);

  return (
    <div className="bg-surface border border-border rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        <span>Vajebaat Quick Entry (Current Year: {permissions.ForYearAll})</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="grid grid-cols-5 gap-2.5 mb-3">
        {[
          ['sf',    'Sila Fitra (SF)'],
          ['vaj',   'Vajebaat'],
          ['house', 'Vajebaat House'],
          ['niyaz', 'S. Niyaz'],
          ['other', 'Other'],
        ].map(([k, label]) => (
          <div key={k} className="bg-white border border-border rounded-lg p-2.5">
            <label className="form-label">{label}</label>
            <input
              type="number"
              placeholder="0"
              className="w-full h-8 border border-border rounded-md text-[14px] font-bold font-display text-navy-900 text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              value={vajForm[k]}
              onChange={e => setVajForm(p => ({ ...p, [k]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="bg-navy-800 rounded-lg px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-white/60 uppercase tracking-wider">Grand Total</div>
          <div className="font-display text-[22px] font-bold text-white">{fmt(grandTotal)}</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-success" onClick={onSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save &amp; Add Receipt
          </button>
          <button className="btn btn-sm bg-white/10 text-white border-white/20 hover:bg-white/20">History</button>
        </div>
      </div>
    </div>
  );
}
