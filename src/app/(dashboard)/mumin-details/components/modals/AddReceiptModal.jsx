'use client';

import Modal from '@/components/shared/Modal';
import { SaveIcon, PrintIcon } from '@/components/shared/Icons';
import { fmt, SUB_HEADS } from '../../utils';

export default function AddReceiptModal({
  open, onClose, member, permissions,
  rcForm, setRcForm,
  rcItem, setRcItem,
  rcItems, setRcItems,
  onSave,
}) {
  const rcGrandTotal = rcItems.reduce((s, i) => s + i.amount, 0);

  const addItem = () => {
    if (!rcItem.amount || Number(rcItem.amount) <= 0) return;
    setRcItems(p => [...p, { ...rcItem, id: Date.now(), amount: Number(rcItem.amount) }]);
    setRcItem(p => ({ ...p, amount: '' }));
  };

  return (
    <Modal
      open={open} onClose={onClose}
      title={`Add Receipt — ${member?.name} (Acc# ${member?.accno})`}
      size="xl"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-secondary" onClick={onSave}>
            <PrintIcon className="w-3.5 h-3.5 mr-1.5" />Print Only
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save Receipt
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="form-label">Receipt Date</label>
            <input type="date" className="form-input" value={rcForm.date}
              onChange={e => setRcForm(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Payment Mode</label>
            <select className="form-select" value={rcForm.mode}
              onChange={e => setRcForm(p => ({ ...p, mode: e.target.value }))}>
              {['Cash','Online','Cheque','UPI'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Trans Type</label>
            <select className="form-select" value={rcForm.transType}
              onChange={e => setRcForm(p => ({ ...p, transType: e.target.value }))}>
              <option>VOLUNTARY CONTRIBUTION</option>
              <option>SABEEL</option>
            </select>
          </div>
          <div>
            <label className="form-label">Remark</label>
            <input className="form-input" placeholder="Optional" value={rcForm.remark}
              onChange={e => setRcForm(p => ({ ...p, remark: e.target.value }))} />
          </div>
        </div>
        <div className="h-px bg-border" />
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Add Item</div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="form-label">Hub Type</label>
            <select className="form-select" value={rcItem.hubType}
              onChange={e => setRcItem(p => ({ ...p, hubType: e.target.value }))}>
              {Object.values(SUB_HEADS).flat().map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">For Year</label>
            <input className="form-input" placeholder={permissions?.ForYearAll} value={rcItem.forYear}
              onChange={e => setRcItem(p => ({ ...p, forYear: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Amount (₹)</label>
            <input type="number" className="form-input" placeholder="0" value={rcItem.amount}
              onChange={e => setRcItem(p => ({ ...p, amount: e.target.value }))} />
          </div>
          <div className="flex items-end">
            <button className="btn btn-secondary w-full" onClick={addItem}>+ Add to Receipt</button>
          </div>
        </div>
        <div className="rounded-lg overflow-hidden border border-border">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>{['#','Type','For Year','Grade','Amount',''].map(h => <th key={h} className="th-navy">{h}</th>)}</tr>
            </thead>
            <tbody>
              {rcItems.map((it, i) => (
                <tr key={it.id} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2 border-t border-border">{i + 1}</td>
                  <td className="px-3 py-2 border-t border-border">{it.hubType}</td>
                  <td className="px-3 py-2 border-t border-border">{it.forYear || '—'}</td>
                  <td className="px-3 py-2 border-t border-border">{member?.grade || '—'}</td>
                  <td className="px-3 py-2 border-t border-border font-semibold">{fmt(it.amount)}</td>
                  <td className="px-3 py-2 border-t border-border">
                    <button className="text-gray-400 hover:text-red-500"
                      onClick={() => setRcItems(p => p.filter(x => x.id !== it.id))}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
            {rcItems.length > 0 && (
              <tfoot>
                <tr className="bg-navy-800">
                  <td colSpan={4} className="px-3 py-2.5 text-white font-semibold">Grand Total</td>
                  <td className="px-3 py-2.5 text-white font-bold text-[14px]">{fmt(rcGrandTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <label className="flex items-center gap-2 text-[11.5px] text-gray-700 cursor-pointer p-2.5 bg-surface rounded-md border border-border">
          <input type="checkbox" className="accent-blue-500 w-3.5 h-3.5" checked={rcForm.sendSMS}
            onChange={e => setRcForm(p => ({ ...p, sendSMS: e.target.checked }))} />
          Send SMS confirmation to {member?.mobile}
        </label>
      </div>
    </Modal>
  );
}
