'use client';

import { useRef, useState, useEffect } from 'react';
import toast       from 'react-hot-toast';
import Modal        from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';

const ADD_PAY_MODES = ['Cash', 'Chq', 'Online', 'Bank'];

const ALLOW_BACKDATE   = true;
const ALLOW_FUTUREDATE = false;

export const CASH_LIMIT = 10000;

export const EMPTY_EXPENSE_FORM = {
  VoucherNo: '', VoucherDate: '',
  ExpenseGroupwithCode: '', ExpenseHeadwithCode: '', VoucherSeries: '',
  EventPlaceName: '', ExpenseSubHead: '', IsCashMemo: 'FALSE',
  Given: '', PayMode: '', DocNo: '', Amount: '', FundSource: '', ExpenseDescription: '',
};

// ── Formatted amount input ─────────────────────────────────────────────────
function AmountInput({ value, onChange, inputRef }) {
  const [focused, setFocused] = useState(false);
  const raw = String(value || '');
  const formatted = raw ? Number(raw).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '';
  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      className="form-input"
      value={focused ? raw : formatted}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={e => onChange(e.target.value.replace(/[^\d]/g, ''))}
      placeholder="0"
    />
  );
}

// ── Toggle switch ──────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <div className="flex items-center gap-2 h-9">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
      <span className="text-[12.5px] text-gray-600">{checked ? 'Yes' : 'No'}</span>
    </div>
  );
}

// ── ComboBox ───────────────────────────────────────────────────────────────
function ComboBox({ value, onChange, options = [], placeholder, disabled, inputRef }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const q = String(value || '').toLowerCase();
  const filtered = q ? options.filter(o => String(o).toLowerCase().includes(q)) : options;

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <input ref={inputRef} type="text" className="form-input" value={value || ''} placeholder={placeholder}
        disabled={disabled} autoComplete="off"
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} />
      {open && !disabled && filtered.length > 0 && (
        <ul className="absolute z-[9999] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-0.5 max-h-52 overflow-y-auto text-[12px]" style={{ top: '100%' }}>
          {filtered.slice(0, 80).map((o, i) => (
            <li key={i} className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              onMouseDown={() => { onChange(o); setOpen(false); }}>{o}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Section card ───────────────────────────────────────────────────────────
function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`border border-border rounded-lg p-3 mb-3 ${className}`}>
      <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</p>
      {children}
    </div>
  );
}

export default function AddExpenseModal({ open, onClose, form, setForm, suggestions, headData = [], onSave, saving }) {
  const today  = new Date().toISOString().split('T')[0];
  const setF   = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const isCash         = form.PayMode === 'Cash';
  const isCashMemoOn   = form.IsCashMemo === 'TRUE';
  const amountNum      = Number(form.Amount) || 0;
  const cashLimitBreached = CASH_LIMIT > 0 && isCash && !isCashMemoOn && amountNum > CASH_LIMIT;

  // ── Refs for required fields ───────────────────────────────────────────────
  const voucherDateRef = useRef(null);
  const headRef        = useRef(null);
  const groupRef       = useRef(null);
  const seriesRef      = useRef(null);
  const subHeadRef     = useRef(null);
  const givenRef       = useRef(null);
  const payModeRef     = useRef(null);
  const amountRef      = useRef(null);
  const fundSourceRef  = useRef(null);

  // ── Required-field validation ─────────────────────────────────────────────
  const handleSubmit = () => {
    const required = [
      { key: 'VoucherDate',         ref: voucherDateRef, label: 'Voucher Date' },
      { key: 'ExpenseHeadwithCode', ref: headRef,        label: 'Expense Head' },
      { key: 'ExpenseGroupwithCode',ref: groupRef,       label: 'Expense Group' },
      { key: 'VoucherSeries',       ref: seriesRef,      label: 'Voucher Series' },
      { key: 'ExpenseSubHead',      ref: subHeadRef,     label: 'Expense Sub Head' },
      { key: 'Given',               ref: givenRef,       label: 'Given' },
      { key: 'PayMode',             ref: payModeRef,     label: 'Pay Mode' },
      { key: 'Amount',              ref: amountRef,      label: 'Amount' },
      { key: 'FundSource',          ref: fundSourceRef,  label: 'Fund Source' },
    ];

    for (const { key, ref, label } of required) {
      if (!String(form[key] ?? '').trim()) {
        toast.error(`${label} is required`);
        ref.current?.focus();
        return;
      }
    }

    if (cashLimitBreached) {
      toast.error(`Cash amount exceeds limit ₹${CASH_LIMIT.toLocaleString('en-IN')}. Enable Cash Memo to waive.`);
      amountRef.current?.focus();
      return;
    }

    onSave();
  };

  // Sub-head options filtered by selected head
  const subHeadOptions = form.ExpenseHeadwithCode
    ? [...new Set(
        headData
          .filter(r => r.ExpenseHeadwithCode === form.ExpenseHeadwithCode)
          .map(r => r.ExpenseSubHead)
          .filter(Boolean)
      )].sort()
    : suggestions.ExpenseSubHead || [];

  const handleHeadSelect = (v) => {
    const match = headData.find(r => r.ExpenseHeadwithCode === v);
    setForm(p => ({
      ...p,
      ExpenseHeadwithCode:  v,
      ExpenseSubHead:       '',
      ...(match ? {
        ExpenseGroupwithCode: match.ExpenseGroupwithCode || p.ExpenseGroupwithCode,
        VoucherSeries:        match.VoucherSeries || match.Series || p.VoucherSeries,
      } : {}),
    }));
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Expense" size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />{saving ? 'Saving…' : 'Save Expense'}
          </button>
        </>
      }
    >
      {/* Voucher Info */}
      <SectionCard title="Voucher Info">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Voucher No</label>
            <input type="text"
              className="form-input bg-gray-50 text-gray-400 cursor-not-allowed select-none"
              value={form.VoucherNo || 'Auto-generated'} readOnly />
          </div>
          <div>
            <label className="form-label">Voucher Date <span className="text-red-500">*</span></label>
            <input ref={voucherDateRef} type="date" className="form-input" value={form.VoucherDate}
              onChange={e => setF('VoucherDate', e.target.value)}
              min={!ALLOW_BACKDATE   ? today : undefined}
              max={!ALLOW_FUTUREDATE ? today : undefined} />
          </div>
        </div>
      </SectionCard>

      {/* Group & Head */}
      <SectionCard title="Group & Head">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="form-label">Expense Head <span className="text-red-500">*</span></label>
            <ComboBox inputRef={headRef} value={form.ExpenseHeadwithCode} options={suggestions.ExpenseHeadwithCode}
              placeholder="Select head..." onChange={handleHeadSelect} />
          </div>
          <div>
            <label className="form-label">Expense Group <span className="text-red-500">*</span></label>
            <ComboBox inputRef={groupRef} value={form.ExpenseGroupwithCode} options={suggestions.ExpenseGroupwithCode}
              placeholder="Select group..." onChange={v => setF('ExpenseGroupwithCode', v)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="form-label">Voucher Series <span className="text-red-500">*</span></label>
            <ComboBox inputRef={seriesRef} value={form.VoucherSeries} options={suggestions.VoucherSeries}
              placeholder="Select series..." onChange={v => setF('VoucherSeries', v)} />
          </div>
          <div>
            <label className="form-label">Event / Place Name</label>
            <ComboBox value={form.EventPlaceName} options={suggestions.EventPlaceName}
              placeholder="Type to search..." onChange={v => setF('EventPlaceName', v)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Expense Sub Head <span className="text-red-500">*</span></label>
            <ComboBox inputRef={subHeadRef} value={form.ExpenseSubHead} options={subHeadOptions}
              placeholder="Type to search..." onChange={v => setF('ExpenseSubHead', v)} />
          </div>
          <div>
            <label className="form-label">Is Cash Memo</label>
            <Toggle
              checked={form.IsCashMemo === 'TRUE'}
              onChange={on => setF('IsCashMemo', on ? 'TRUE' : 'FALSE')}
            />
          </div>
        </div>
      </SectionCard>

      {/* Voucher Details */}
      <SectionCard title="Voucher Details" className="mb-0">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="form-label">Given <span className="text-red-500">*</span></label>
            <ComboBox inputRef={givenRef} value={form.Given} options={suggestions.Given}
              placeholder="Search person..." onChange={v => setF('Given', v)} />
          </div>
          <div>
            <label className="form-label">Pay Mode <span className="text-red-500">*</span></label>
            <select ref={payModeRef} className="form-select" value={form.PayMode} onChange={e => setF('PayMode', e.target.value)}>
              <option value="">Select...</option>
              {ADD_PAY_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="form-label">Doc No</label>
            <ComboBox value={form.DocNo} options={suggestions.DocNo}
              placeholder="Type to search..." onChange={v => setF('DocNo', v)} />
          </div>
          <div>
            <label className="form-label">Amount <span className="text-red-500">*</span></label>
            <AmountInput inputRef={amountRef} value={form.Amount} onChange={v => setF('Amount', v)} />
            {cashLimitBreached && (
              <p className="text-[11px] text-red-500 mt-1">
                Cash limit ₹{CASH_LIMIT.toLocaleString('en-IN')} exceeded. Enable Cash Memo to waive.
              </p>
            )}
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Fund Source <span className="text-red-500">*</span></label>
          <ComboBox inputRef={fundSourceRef} value={form.FundSource} options={suggestions.FundSource}
            placeholder="Type to search..." onChange={v => setF('FundSource', v)} />
        </div>
        <div>
          <label className="form-label">Expense Description</label>
          <textarea className="form-input min-h-[72px] resize-y" value={form.ExpenseDescription}
            onChange={e => setF('ExpenseDescription', e.target.value)}
            placeholder="Enter description..." rows={3} />
        </div>
      </SectionCard>
    </Modal>
  );
}
