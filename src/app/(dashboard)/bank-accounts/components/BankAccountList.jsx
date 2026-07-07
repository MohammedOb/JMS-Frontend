'use client';

import { useState } from 'react';
import clsx  from 'clsx';
import toast from 'react-hot-toast';
import { bankAccountService } from '@/services';
import { EditIcon, TrashIcon, PlusIcon } from '@/components/shared/Icons';

export default function BankAccountList({ rows, loading, onAdd, onEdit, onChanged }) {
  const [filter,     setFilter]     = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Client-side filter + sort: default first, then active first, then by alias
  const filtered = rows.filter(r => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return r.Alias?.toLowerCase().includes(q)
        || r.BankName?.toLowerCase().includes(q)
        || r.AccountNumber?.toLowerCase().includes(q)
        || r.UpiVpa?.toLowerCase().includes(q);
  }).slice().sort((a, b) => {
    if ((b.IsDefault ?? 0) !== (a.IsDefault ?? 0)) return (b.IsDefault ?? 0) - (a.IsDefault ?? 0);
    if ((b.IsActive  ?? 1) !== (a.IsActive  ?? 1)) return (b.IsActive  ?? 1) - (a.IsActive  ?? 1);
    return (a.Alias ?? '').localeCompare(b.Alias ?? '');
  });

  const handleToggle = async (item) => {
    const newVal = item.IsActive ? 0 : 1;
    const action = newVal ? 'Activate' : 'Deactivate';
    if (!window.confirm(`${action} bank account "${item.Alias}"?${!newVal && item.IsDefault ? '\n\nThis is the default account — online UPI payments will fall back to server settings.' : ''}`)) return;
    setTogglingId(item.ID);
    try {
      await bankAccountService.update({ ID: item.ID, IsActive: newVal });
      toast.success(newVal ? 'Activated' : 'Deactivated');
      onChanged();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete bank account "${item.Alias}"?\n\nHub heads using it will fall back to the default account.`)) return;
    setDeletingId(item.ID);
    try {
      await bankAccountService.delete({ ID: item.ID });
      toast.success('Bank account deleted');
      onChanged();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Filter bar */}
      <div className="bg-white border border-border rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end justify-between">
        <div>
          <label className="form-label">Search</label>
          <input
            className="form-input w-64"
            placeholder="Alias, bank, account no, VPA…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
        <button className="btn btn-primary btn-sm" onClick={onAdd}>
          <PlusIcon className="w-3.5 h-3.5 mr-1.5" />Add Bank Account
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">Bank Accounts</div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {['#', 'Action', 'Active', 'Alias', 'Bank', 'Account Holder', 'Account No', 'IFSC', 'Branch', 'UPI VPA'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-gray-400">No bank accounts found</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.ID ?? i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border text-gray-400 text-center">{i + 1}</td>
                  {/* Action */}
                  <td className="px-3 py-2.5 border-t border-border whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onEdit(r)}
                      >
                        <EditIcon className="w-3.5 h-3.5 mr-1" />
                      </button>
                      <button
                        className="btn btn-sm border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50"
                        disabled={deletingId === r.ID}
                        onClick={() => handleDelete(r)}
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  {/* Active toggle */}
                  <td className="px-3 py-2.5 border-t border-border">
                    <button
                      type="button"
                      disabled={togglingId === r.ID}
                      onClick={() => handleToggle(r)}
                      className={clsx(
                        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
                        r.IsActive ? 'bg-blue-500' : 'bg-gray-300'
                      )}
                    >
                      <span className={clsx(
                        'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                        r.IsActive ? 'translate-x-4' : 'translate-x-1'
                      )} />
                    </button>
                  </td>
                  <td className="px-3 py-2.5 border-t border-border font-medium whitespace-nowrap">
                    {r.Alias}
                    {!!r.IsDefault && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded">Default</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 border-t border-border">{r.BankName}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.AccountHolder || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border font-mono">{r.AccountNumber || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border font-mono">{r.IFSC || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.Branch || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border font-mono">{r.UpiVpa || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
