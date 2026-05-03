'use client';

import clsx from 'clsx';
import { EditIcon, SaveIcon } from '@/components/shared/Icons';
import { StatusBadge } from '@/components/shared/Badge';
import { fmt } from '../../utils';

export default function VajebaatTab({
  vajebaat, himList, sniyazList, silaFitra,
  vajForm, setVajForm,
  permissions,
  onSaveVajebaat, onAddHim, onAddSniyaz, onAddReceipt,
}) {
  const vajGrandTotal = ['sf','vaj','house','niyaz','najwa'].reduce((s, k) => s + (Number(vajForm[k]) || 0), 0);

  return (
    <div className="p-4">
      {/* Speed entry */}
      {permissions.MDSpeedVajebaatView && (
        <div className="bg-surface border border-border rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            <span>Vajebaat Quick Entry (Current Year: {permissions.ForYearFMB})</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-5 gap-2.5 mb-3">
            {[
              ['sf',    'Sila Fitra (SF)'],
              ['vaj',   'Vajebaat'],
              ['house', 'Vajebaat House'],
              ['niyaz', 'S. Niyaz'],
              ['najwa', 'Taherabad Safar'],
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
              <div className="font-display text-[22px] font-bold text-white">{fmt(vajGrandTotal)}</div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-success" onClick={onSaveVajebaat}>
                <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save &amp; Add Receipt
              </button>
              <button className="btn btn-sm bg-white/10 text-white border-white/20 hover:bg-white/20">History</button>
            </div>
          </div>
        </div>
      )}

      {/* Vajebaat Takhmeen table */}
      {permissions.MDVajebaatDetailsView && (
        <>
          <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            <span>Vajebaat Takhmeen Details</span><div className="flex-1 h-px bg-border" />
          </div>
          <div className="rounded-lg overflow-hidden border border-border mb-4">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>{['ID','For Year','Sub Type','Takhmeen','Received','Remaining','Favor Name','Favor ITS','Mouze','Actions'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {vajebaat.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-6 text-gray-400">No vajebaat records</td></tr>
                ) : vajebaat.map((v, i) => (
                  <tr key={i} className="hover:bg-blue-500/[0.025]">
                    <td className="px-3 py-2 border-t border-border">{v.id}</td>
                    <td className="px-3 py-2 border-t border-border">{v.forYear}</td>
                    <td className="px-3 py-2 border-t border-border">{v.subType}</td>
                    <td className="px-3 py-2 border-t border-border">{fmt(v.takhmeen)}</td>
                    <td className="px-3 py-2 border-t border-border">{fmt(v.received)}</td>
                    <td className={clsx('px-3 py-2 border-t border-border font-bold',
                      v.remaining === 0 ? 'text-green-600' : 'text-red-600'
                    )}>{fmt(v.remaining)}</td>
                    <td className="px-3 py-2 border-t border-border">{v.favorName || '—'}</td>
                    <td className="px-3 py-2 border-t border-border">{v.favorIts || '—'}</td>
                    <td className="px-3 py-2 border-t border-border">{v.mouze || '—'}</td>
                    <td className="px-3 py-2 border-t border-border">
                      <button className="btn btn-primary btn-sm" onClick={onAddReceipt}>Pay</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* HIM Takhmeen */}
      {permissions.MDHIMView && (
        <>
          <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            <span>HIM Takhmeen</span><div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex gap-2 mb-2">
            <button className="btn btn-secondary btn-sm" onClick={onAddHim}>+ Add HIM Entry</button>
          </div>
          <div className="rounded-lg overflow-hidden border border-border mb-4">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>{['ID','For Year','HIM Total','Takhmeen','Received','Remaining','Actions'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {himList.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-6 text-gray-400">No HIM records</td></tr>
                ) : himList.map((h, i) => (
                  <tr key={i} className="hover:bg-blue-500/[0.025]">
                    <td className="px-3 py-2 border-t border-border">{h.id}</td>
                    <td className="px-3 py-2 border-t border-border">{h.forYear}</td>
                    <td className="px-3 py-2 border-t border-border">{fmt(h.himTotal)}</td>
                    <td className="px-3 py-2 border-t border-border">{fmt(h.takhmeen)}</td>
                    <td className="px-3 py-2 border-t border-border">{fmt(h.received)}</td>
                    <td className={clsx('px-3 py-2 border-t border-border font-bold',
                      h.remaining === 0 ? 'text-green-600' : 'text-red-600'
                    )}>{fmt(h.remaining)}</td>
                    <td className="px-3 py-2 border-t border-border whitespace-nowrap">
                      <button className="btn btn-secondary btn-sm mr-1">Edit</button>
                      <button className="btn btn-secondary btn-sm" onClick={onAddHim}>
                        <EditIcon className="w-3.5 h-3.5 mr-1" />Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Shehrullah Niyaz */}
      <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        <span>Shehrullah Niyaz Takhmeen</span><div className="flex-1 h-px bg-border" />
      </div>
      <div className="flex gap-2 mb-2">
        <button className="btn btn-secondary btn-sm" onClick={onAddSniyaz}>+ Add S. Niyaz</button>
      </div>
      <div className="rounded-lg overflow-hidden border border-border mb-4">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>{['ID','For Year','Niyaz Count','Niyaz Tareekh','Niyaz Status','Takhmeen','Received','Remaining'].map(h => (
              <th key={h} className="th-navy">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {sniyazList.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-6 text-gray-400">No S. Niyaz records</td></tr>
            ) : sniyazList.map((s, i) => (
              <tr key={i} className="hover:bg-blue-500/[0.025]">
                <td className="px-3 py-2 border-t border-border">{s.id}</td>
                <td className="px-3 py-2 border-t border-border">{s.forYear}</td>
                <td className="px-3 py-2 border-t border-border">{s.count}</td>
                <td className="px-3 py-2 border-t border-border">{s.tareekh}</td>
                <td className="px-3 py-2 border-t border-border"><StatusBadge status={s.status} /></td>
                <td className="px-3 py-2 border-t border-border">{fmt(s.takhmeen)}</td>
                <td className="px-3 py-2 border-t border-border">{fmt(s.received)}</td>
                <td className={clsx('px-3 py-2 border-t border-border font-bold',
                  s.remaining === 0 ? 'text-green-600' : 'text-red-600'
                )}>{fmt(s.remaining)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sila Fitra */}
      <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        <span>SilaFitra / Other Details</span><div className="flex-1 h-px bg-border" />
      </div>
      <div className="rounded-lg overflow-hidden border border-border">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>{['For Year','SF','Marhumeen (M)','Baal (B)','Galla Baqar (GB)','Haiwanaat (H)','Aqeeq (AM)','Total'].map(h => (
              <th key={h} className="th-navy">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {silaFitra.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-6 text-gray-400">No Sila Fitra records</td></tr>
            ) : silaFitra.map((s, i) => (
              <tr key={i} className="hover:bg-blue-500/[0.025]">
                <td className="px-3 py-2 border-t border-border">{s.forYear}</td>
                <td className="px-3 py-2 border-t border-border">{fmt(s.sf)}</td>
                <td className="px-3 py-2 border-t border-border">{fmt(s.marhumeen)}</td>
                <td className="px-3 py-2 border-t border-border">{fmt(s.baal)}</td>
                <td className="px-3 py-2 border-t border-border">{fmt(s.gallaBaqar)}</td>
                <td className="px-3 py-2 border-t border-border">{fmt(s.haiwanaat)}</td>
                <td className="px-3 py-2 border-t border-border">{fmt(s.aqeeq)}</td>
                <td className="px-3 py-2 border-t border-border font-semibold">{fmt(s.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
