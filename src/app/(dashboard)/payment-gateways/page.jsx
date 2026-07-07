'use client';
import PermissionGuard from '@/components/shared/PermissionGuard';

import { useState, useEffect, useCallback } from 'react';
import clsx  from 'clsx';
import toast from 'react-hot-toast';
import PageHeader from '@/components/shared/PageHeader';
import { SaveIcon, CheckIcon } from '@/components/shared/Icons';
import { paymentGatewayService, bankAccountService } from '@/services';

// Config form fields per gateway code. type: text | password | select | bankAccount
const GATEWAY_FIELDS = {
  inhouse_upi: [
    { key: 'bankAccountId', label: 'Collection Bank Account', type: 'bankAccount',
      hint: 'VPA that receives payments when the hub head has no bank account of its own. Leave unset to use the org default account (or server .env settings).' },
  ],
  razorpay: [
    { key: 'keyId',     label: 'Key ID',     type: 'text' },
    { key: 'keySecret', label: 'Key Secret', type: 'password' },
  ],
  cashfree: [
    { key: 'appId',       label: 'App ID',      type: 'text' },
    { key: 'secretKey',   label: 'Secret Key',  type: 'password' },
    { key: 'environment', label: 'Environment', type: 'select', options: ['sandbox', 'production'] },
  ],
  payu: [
    { key: 'merchantKey',  label: 'Merchant Key',  type: 'text' },
    { key: 'merchantSalt', label: 'Merchant Salt', type: 'password' },
    { key: 'baseUrl',      label: 'Base URL',      type: 'text' },
  ],
};

function GatewayCard({ gw, implemented, bankAccounts, onActivate, onSaveConfig }) {
  const [config, setConfig] = useState(gw.Config || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => { setConfig(gw.Config || {}); }, [gw]);

  const fields = GATEWAY_FIELDS[gw.Code] || [];
  const isImplemented = implemented.includes(gw.Code);
  const set = (k, v) => setConfig(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveConfig(gw.Code, config);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={clsx(
      'card',
      gw.IsActive ? 'ring-2 ring-blue-500/60' : ''
    )}>
      <div className="card-header flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>{gw.DisplayName}</span>
          {!!gw.IsActive && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded inline-flex items-center gap-1">
              <CheckIcon className="w-3 h-3" />Active
            </span>
          )}
          {!isImplemented && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">
              Integration pending
            </span>
          )}
        </div>
        {!gw.IsActive && (
          <button className="btn btn-secondary btn-sm" onClick={() => onActivate(gw, isImplemented)}>
            Activate
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {gw.Description && (
          <p className="text-[12px] text-gray-500">{gw.Description}</p>
        )}

        {fields.map(f => (
          <div key={f.key}>
            <label className="form-label">{f.label}</label>

            {f.type === 'bankAccount' ? (
              <select
                className="form-select"
                value={config[f.key] ?? ''}
                onChange={e => set(f.key, e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— Org default account / server settings —</option>
                {bankAccounts.map(ba => (
                  <option key={ba.ID} value={ba.ID}>
                    {ba.Alias}{ba.UpiVpa ? ` (${ba.UpiVpa})` : ' (no VPA!)'}
                  </option>
                ))}
              </select>
            ) : f.type === 'select' ? (
              <select
                className="form-select"
                value={config[f.key] ?? f.options[0]}
                onChange={e => set(f.key, e.target.value)}
              >
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={f.type}
                className="form-input"
                autoComplete="off"
                value={config[f.key] ?? ''}
                onChange={e => set(f.key, e.target.value)}
              />
            )}

            {f.hint && <p className="text-[11px] text-gray-400 mt-1">{f.hint}</p>}
          </div>
        ))}

        <div className="flex justify-end pt-1">
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving…' : 'Save Config'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentGatewaysPage() {
  const [gateways,     setGateways]     = useState([]);
  const [implemented,  setImplemented]  = useState(['inhouse_upi']);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading,      setLoading]      = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentGatewayService.load();
      setGateways(res.data?.data ?? []);
      if (Array.isArray(res.data?.implemented)) setImplemented(res.data.implemented);
    } catch {
      toast.error('Failed to load payment gateways');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    bankAccountService.load({ IsActive: 1 })
      .then(res => {
        const data = res.data?.data ?? res.data;
        setBankAccounts(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, [load]);

  const handleActivate = async (gw, isImplemented) => {
    const warning = isImplemented
      ? `Make "${gw.DisplayName}" the active payment gateway?\n\nAll new online payments will go through it.`
      : `"${gw.DisplayName}" checkout is NOT implemented yet — activating it will DISABLE online payments until the integration is built.\n\nActivate anyway?`;
    if (!window.confirm(warning)) return;

    try {
      await paymentGatewayService.setActive({ Code: gw.Code });
      toast.success(`${gw.DisplayName} is now the active gateway`);
      load();
    } catch {
      toast.error('Failed to switch gateway');
    }
  };

  const handleSaveConfig = async (Code, Config) => {
    try {
      await paymentGatewayService.updateConfig({ Code, Config });
      toast.success('Gateway config saved');
      load();
    } catch {
      toast.error('Failed to save config');
    }
  };

  return (
    <PermissionGuard permission="utility.view">
    <div>
      <PageHeader
        title="Payment Gateways"
        subtitle="Choose which gateway collects online payments and manage its settings"
      />

      {loading && gateways.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 max-w-5xl">
          {gateways.map(gw => (
            <GatewayCard
              key={gw.Code}
              gw={gw}
              implemented={implemented}
              bankAccounts={bankAccounts}
              onActivate={handleActivate}
              onSaveConfig={handleSaveConfig}
            />
          ))}
        </div>
      )}

      <p className="text-[12px] text-gray-400 mt-4 max-w-3xl">
        Only one gateway is active at a time. UPI (In-House) is fully integrated;
        Razorpay / Cashfree / PayU credentials are stored here so their checkout
        integrations can be switched on without another database change.
      </p>
    </div>
    </PermissionGuard>
  );
}
