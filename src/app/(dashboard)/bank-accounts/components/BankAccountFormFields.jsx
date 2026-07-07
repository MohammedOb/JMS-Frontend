'use client';

import clsx from 'clsx';

// Shared field layout for the Add/Edit bank account modals.
// form: { Alias, BankName, AccountHolder, AccountNumber, IFSC, Branch, UpiVpa, UpiName, IsDefault }
export default function BankAccountFormFields({ form, set }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Alias <span className="text-red-500">*</span></label>
          <input
            className="form-input"
            placeholder="e.g. HDFC Vyapar Main"
            value={form.Alias}
            onChange={e => set('Alias', e.target.value)}
          />
          <p className="text-[11px] text-gray-400 mt-1">Short name shown in dropdowns across the app.</p>
        </div>
        <div>
          <label className="form-label">Bank Name <span className="text-red-500">*</span></label>
          <input
            className="form-input"
            placeholder="e.g. HDFC Bank"
            value={form.BankName}
            onChange={e => set('BankName', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="form-label">Account Holder</label>
        <input
          className="form-input"
          placeholder="Name on the account"
          value={form.AccountHolder}
          onChange={e => set('AccountHolder', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Account Number</label>
          <input
            className="form-input font-mono"
            placeholder="Account number"
            value={form.AccountNumber}
            onChange={e => set('AccountNumber', e.target.value.replace(/\s/g, ''))}
          />
        </div>
        <div>
          <label className="form-label">IFSC</label>
          <input
            className="form-input font-mono"
            placeholder="e.g. HDFC0001234"
            value={form.IFSC}
            onChange={e => set('IFSC', e.target.value.toUpperCase().replace(/\s/g, ''))}
          />
        </div>
      </div>

      <div>
        <label className="form-label">Branch</label>
        <input
          className="form-input"
          placeholder="Branch name"
          value={form.Branch}
          onChange={e => set('Branch', e.target.value)}
        />
      </div>

      <div className="border-t border-border pt-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">UPI VPA</label>
            <input
              className="form-input font-mono"
              placeholder="e.g. merchant@hdfcbank"
              value={form.UpiVpa}
              onChange={e => set('UpiVpa', e.target.value.trim())}
            />
          </div>
          <div>
            <label className="form-label">UPI Payee Name</label>
            <input
              className="form-input"
              placeholder="Shown in UPI apps"
              value={form.UpiName}
              onChange={e => set('UpiName', e.target.value)}
            />
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">
          Online UPI payments are collected on this VPA when this account is the payment target.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label className="form-label mb-0">Default account</label>
        <button
          type="button"
          onClick={() => set('IsDefault', form.IsDefault ? 0 : 1)}
          className={clsx(
            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
            form.IsDefault ? 'bg-blue-500' : 'bg-gray-300'
          )}
        >
          <span className={clsx(
            'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
            form.IsDefault ? 'translate-x-4' : 'translate-x-1'
          )} />
        </button>
        <span className="text-[12px] text-gray-500">
          {form.IsDefault ? 'Used when a hub head has no account of its own' : 'Not the default'}
        </span>
      </div>
    </div>
  );
}
