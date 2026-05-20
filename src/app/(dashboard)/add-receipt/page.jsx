'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth }        from '@/context/AuthContext';
import { memberService, receiptService } from '@/services';
import toast              from 'react-hot-toast';
import PageHeader         from '@/components/shared/PageHeader';
import { TrashIcon, PrintIcon, SaveIcon, SearchIcon, PlusIcon, XIcon } from '@/components/shared/Icons';

const today = () => new Date().toISOString().split('T')[0];
const fmt   = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const SUB_HEADS = {
  'Sabeel':   ['Sabeel Regular', 'Sabeel Mutaveteen'],
  'FMB':      ['FMB Regular', 'FMB Half Thaali'],
  'Vajebaat': ['Vajebaat', 'Vajebaat House', 'Sila Fitra', 'Shehrullah Niyaz', 'HIM', 'Taherabad Safar'],
  'Other':    ['General', 'Other'],
};

export default function AddReceiptPage() {
  const { user } = useAuth();

  // Member lookup
  const [accno,   setAccno]   = useState('');
  const [member,  setMember]  = useState(null);
  const [looking, setLooking] = useState(false);

  // Receipt header
  const [rcDate,  setRcDate]  = useState(today());
  const [mode,    setMode]    = useState('Cash');
  const [transType, setTransType] = useState('VOLUNTARY CONTRIBUTION');
  const [remark,  setRemark]  = useState('');
  const [sendSMS, setSendSMS] = useState(false);

  // Item form
  const [itemHub,    setItemHub]    = useState('Sabeel Regular');
  const [itemYear,   setItemYear]   = useState(user?.ForYearAll || '');
  const [itemAmount, setItemAmount] = useState('');

  // Receipt items list
  const [items, setItems] = useState([]);

  const [saving, setSaving] = useState(false);

  // ── Look up member ────────────────────────────────────────────────────────
  const lookupMember = useCallback(async () => {
    if (!accno.trim()) return;
    setLooking(true);
    try {
      const res = await memberService.getByAccno(accno.trim());
      setMember(res.data);
    } catch {
      toast.error('Member not found');
      setMember(null);
    } finally {
      setLooking(false);
    }
  }, [accno]);

  // ── Add item to receipt ───────────────────────────────────────────────────
  const addItem = () => {
    if (!itemHub || !itemAmount || Number(itemAmount) <= 0) {
      toast.error('Enter hub type and amount');
      return;
    }
    setItems(prev => [...prev, {
      id: Date.now(),
      hubType:  itemHub,
      forYear:  itemYear,
      grade:    member?.grade || '',
      amount:   Number(itemAmount),
    }]);
    setItemAmount('');
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const grandTotal = items.reduce((s, i) => s + i.amount, 0);

  // ── Save receipt ──────────────────────────────────────────────────────────
  const saveReceipt = async (printAfter = false) => {
    if (!member) { toast.error('Search for a member first'); return; }
    if (items.length === 0) { toast.error('Add at least one item'); return; }
    setSaving(true);
    try {
      const payload = {
        accno: member.accno,
        date:  rcDate,
        mode,
        transType,
        remark,
        sendSMS,
        items: items.map(({ hubType, forYear, grade, amount }) => ({ hubType, forYear, grade, amount })),
      };
      const res = await receiptService.save(payload);
      toast.success(`Receipt #${res.data.receiptNo} saved`);
      setItems([]);
      setMember(null);
      setAccno('');
      if (printAfter) window.open(`/print/receipt/${res.data.receiptNo}`, '_blank');
    } catch {
      toast.error('Failed to save receipt');
    } finally {
      setSaving(false);
    }
  };

  const clearForm = () => {
    setItems([]);
    setMember(null);
    setAccno('');
    setRemark('');
  };

  return (
    <div>
      <PageHeader title="Add Receipt" subtitle="Record a new payment entry">
        <button className="btn btn-secondary btn-sm" onClick={clearForm}><TrashIcon className="w-3.5 h-3.5 mr-1.5" />Clear Form</button>
        <button className="btn btn-secondary btn-sm" onClick={() => saveReceipt(true)} disabled={saving}><PrintIcon className="w-3.5 h-3.5 mr-1.5" />Print Only</button>
        <button className="btn btn-primary btn-sm" onClick={() => saveReceipt(false)} disabled={saving}>
          {saving ? 'Saving…' : <><SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save Receipt</>}
        </button>
      </PageHeader>

      <div className="grid grid-cols-[1fr_280px] gap-3">
        {/* Left column */}
        <div className="space-y-3">

          {/* Member lookup */}
          <div className="card">
            <div className="card-header">Member Information</div>
            <div className="card-body space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="form-label">Account No.</label>
                  <input
                    className="form-input"
                    placeholder="Enter Acc No."
                    value={accno}
                    onChange={e => setAccno(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && lookupMember()}
                  />
                </div>
                <div className="flex items-end">
                  <button className="btn btn-primary" onClick={lookupMember} disabled={looking}>
                    {looking ? 'Searching…' : <><SearchIcon className="w-3.5 h-3.5 mr-1.5" />Search</>}
                  </button>
                </div>
              </div>

              {member && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">Full Name</label>
                    <input className="form-input bg-surface" value={member.name} readOnly />
                  </div>
                  <div>
                    <label className="form-label">Mobile</label>
                    <input className="form-input bg-surface" value={member.mobile || '—'} readOnly />
                  </div>
                  <div>
                    <label className="form-label">ITS No.</label>
                    <input className="form-input bg-surface" value={member.itsNo || '—'} readOnly />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Receipt Date</label>
                  <input type="date" className="form-input" value={rcDate} onChange={e => setRcDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Payment Mode</label>
                  <select className="form-select" value={mode} onChange={e => setMode(e.target.value)}>
                    {['Cash','Online','Cheque','UPI'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Trans Type</label>
                  <select className="form-select" value={transType} onChange={e => setTransType(e.target.value)}>
                    <option>VOLUNTARY CONTRIBUTION</option>
                    <option>SABEEL</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Remark</label>
                <input className="form-input" placeholder="Optional note" value={remark} onChange={e => setRemark(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Add item */}
          <div className="card">
            <div className="card-header">Add Receipt Item</div>
            <div className="card-body space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="form-label">Hub Type</label>
                  <select className="form-select" value={itemHub} onChange={e => setItemHub(e.target.value)}>
                    {Object.values(SUB_HEADS).flat().map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">For Year</label>
                  <input className="form-input" placeholder={user?.ForYearAll} value={itemYear} onChange={e => setItemYear(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Amount (₹)</label>
                  <input type="number" className="form-input" placeholder="0" value={itemAmount} onChange={e => setItemAmount(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} />
                </div>
                <div className="flex items-end">
                  <button className="btn btn-secondary w-full justify-center" onClick={addItem}><PlusIcon className="w-3.5 h-3.5 mr-1.5" />Add Item</button>
                </div>
              </div>
              {member && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Grade (auto)</label>
                    <input className="form-input bg-surface" value={member.grade || '—'} readOnly />
                  </div>
                  <div>
                    <label className="form-label">Remaining Takhmeen</label>
                    <input className="form-input bg-surface" value={member.sabeelRemaining != null ? fmt(member.sabeelRemaining) : '—'} readOnly />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Items table */}
          <div className="card">
            <div className="card-header">Receipt Items</div>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {['#','Type','For Year','Grade','Amount',''].map(h => (
                    <th key={h} className="th-navy">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-gray-400 text-sm border-t border-border">No items added yet</td></tr>
                ) : items.map((it, i) => (
                  <tr key={it.id} className="hover:bg-blue-500/[0.025]">
                    <td className="px-3 py-2 border-t border-border">{i + 1}</td>
                    <td className="px-3 py-2 border-t border-border">{it.hubType}</td>
                    <td className="px-3 py-2 border-t border-border">{it.forYear || '—'}</td>
                    <td className="px-3 py-2 border-t border-border">{it.grade || '—'}</td>
                    <td className="px-3 py-2 border-t border-border font-semibold">{fmt(it.amount)}</td>
                    <td className="px-3 py-2 border-t border-border">
                      <button onClick={() => removeItem(it.id)} className="text-gray-400 hover:text-red-500 transition-colors"><XIcon className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr className="bg-navy-800">
                    <td colSpan={4} className="px-3 py-2.5 text-white font-semibold text-[12px]">Grand Total</td>
                    <td className="px-3 py-2.5 text-white font-bold text-[14px]">{fmt(grandTotal)}</td>
                    <td className="border-t-0" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Right column — summary */}
        <div className="space-y-3">
          <div className="card">
            <div className="card-header">Receipt Summary</div>
            <div className="card-body">
              <div className="mb-3">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Grand Total</div>
                <div className="font-display text-[26px] font-bold text-navy-900">{fmt(grandTotal)}</div>
              </div>
              <div className="h-px bg-border mb-3" />
              {items.map(it => (
                <div key={it.id} className="flex justify-between mb-1.5 text-[12px]">
                  <span className="text-gray-500">{it.hubType}</span>
                  <span className="font-medium">{fmt(it.amount)}</span>
                </div>
              ))}
              {items.length > 0 && <div className="h-px bg-border mt-2 mb-3" />}
              {/* SMS */}
              <label className="flex items-center gap-2 text-[11.5px] text-gray-700 cursor-pointer p-2.5 bg-surface rounded-md border border-border">
                <input
                  type="checkbox"
                  checked={sendSMS}
                  onChange={e => setSendSMS(e.target.checked)}
                  className="accent-blue-500 w-3.5 h-3.5"
                />
                Send SMS to {member?.mobile || 'member'}
              </label>
            </div>
          </div>

          {/* Takhmeen status */}
          {member && (
            <div className="card">
              <div className="card-header text-[12px]">Current Takhmeen Status</div>
              <div className="card-body space-y-3">
                <div>
                  <div className="text-[10px] text-gray-400 mb-1">Sabeel Remaining</div>
                  <div className={`font-display text-[20px] font-bold ${member.sabeelRemaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {fmt(member.sabeelRemaining)}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Grade {member.grade} · {user?.ForYearAll}</div>
                </div>
                <div className="h-px bg-border" />
                <div>
                  <div className="text-[10px] text-gray-400 mb-1">FMB Remaining</div>
                  <div className={`font-display text-[18px] font-bold ${member.fmbRemaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {fmt(member.fmbRemaining)}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{member.fmbRemaining > 0 ? 'Due' : 'Fully Paid'} · {user?.ForYearFMB}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
