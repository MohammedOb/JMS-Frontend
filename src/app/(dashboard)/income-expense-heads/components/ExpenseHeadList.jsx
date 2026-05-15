'use client';

import { useState } from 'react';
import clsx  from 'clsx';
import toast from 'react-hot-toast';
import { expenseHeadService } from '@/services';
import { EditIcon, TrashIcon, PlusIcon } from '@/components/shared/Icons';
import SuggestionInput from './SuggestionInput';

function SortTh({ label, col, sortConfig, onSort }) {
  const active = sortConfig.key === col;
  return (
    <th className="th-navy cursor-pointer select-none" onClick={() => onSort(col)}>
      <div className="flex items-center justify-start gap-1">
        {label}
        <span className={clsx('text-[10px]', active ? 'opacity-100' : 'opacity-40')}>
          {active ? (sortConfig.dir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
      </div>
    </th>
  );
}

export default function ExpenseHeadList({ rows, loading, onAdd, onEdit, onReload }) {
  const [filters,    setFilters]    = useState({ ExpenseHeadwithCode: '', ExpenseSubHead: '', VoucherSeries: '', ExpenseGroupwithCode: '' });
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, dir: 'asc' });

  const setFilter  = (k, v) => setFilters(p => ({ ...p, [k]: v }));
  const toggleSort = (key)  => setSortConfig(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));

  // Suggestion options from loaded rows
  const codeOptions    = [...new Set(rows.map(r => r.ExpenseHeadwithCode).filter(Boolean))];
  const subHeadOptions = [...new Set(
    rows
      .filter(r => !filters.ExpenseHeadwithCode || r.ExpenseHeadwithCode?.toLowerCase().includes(filters.ExpenseHeadwithCode.toLowerCase()))
      .map(r => r.ExpenseSubHead).filter(Boolean)
  )];
  const voucherOptions = [...new Set(rows.map(r => r.VoucherSeries).filter(Boolean))];
  const groupOptions   = [...new Set(rows.map(r => r.ExpenseGroupwithCode).filter(Boolean))];

  // Client-side filter
  const filtered = rows.filter(r => {
    const matchCode    = !filters.ExpenseHeadwithCode  || r.ExpenseHeadwithCode?.toLowerCase().includes(filters.ExpenseHeadwithCode.toLowerCase());
    const matchSub     = !filters.ExpenseSubHead       || r.ExpenseSubHead?.toLowerCase().includes(filters.ExpenseSubHead.toLowerCase());
    const matchVoucher = !filters.VoucherSeries        || r.VoucherSeries?.toLowerCase().includes(filters.VoucherSeries.toLowerCase());
    const matchGroup   = !filters.ExpenseGroupwithCode || r.ExpenseGroupwithCode?.toLowerCase().includes(filters.ExpenseGroupwithCode.toLowerCase());
    return matchCode && matchSub && matchVoucher && matchGroup;
  });

  // Sort: active rows first, then by selected column
  const sorted = filtered.slice().sort((a, b) => {
    const activeSort = (b.IsActive ?? 1) - (a.IsActive ?? 1);
    if (activeSort !== 0) return activeSort;
    if (!sortConfig.key) return 0;
    const av = (a[sortConfig.key] ?? '').toString().toLowerCase();
    const bv = (b[sortConfig.key] ?? '').toString().toLowerCase();
    const cmp = av.localeCompare(bv);
    return sortConfig.dir === 'asc' ? cmp : -cmp;
  });

  const handleToggle = async (item) => {
    const newVal = item.IsActive ? 0 : 1;
    const action = newVal ? 'Activate' : 'Deactivate';
    if (!window.confirm(`${action} "${item.ExpenseHeadwithCode}"?`)) return;
    setTogglingId(item.ID);
    try {
      await expenseHeadService.update({ ID: item.ID, IsActive: newVal });
      toast.success(newVal ? 'Activated' : 'Deactivated');
      onReload();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.ExpenseHeadwithCode}"?`)) return;
    setDeletingId(item.ID);
    try {
      await expenseHeadService.delete({ ID: item.ID });
      toast.success('Expense Head deleted');
      onReload();
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
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="form-label">Expense Group Code</label>
            <SuggestionInput
              className="w-48"
              placeholder="Filter by group…"
              value={filters.ExpenseGroupwithCode}
              onChange={v => setFilter('ExpenseGroupwithCode', v)}
              suggestions={groupOptions}
            />
          </div>
          <div>
            <label className="form-label">Expense Head Code</label>
            <SuggestionInput
              className="w-52"
              placeholder="Filter by code…"
              value={filters.ExpenseHeadwithCode}
              onChange={v => setFilter('ExpenseHeadwithCode', v)}
              suggestions={codeOptions}
            />
          </div>
          <div>
            <label className="form-label">Sub Head</label>
            <SuggestionInput
              className="w-48"
              placeholder="Filter by sub head…"
              value={filters.ExpenseSubHead}
              onChange={v => setFilter('ExpenseSubHead', v)}
              suggestions={subHeadOptions}
            />
          </div>
          <div>
            <label className="form-label">Voucher Series</label>
            <SuggestionInput
              className="w-44"
              placeholder="Filter by voucher…"
              value={filters.VoucherSeries}
              onChange={v => setFilter('VoucherSeries', v)}
              suggestions={voucherOptions}
            />
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onAdd}>
          <PlusIcon className="w-3.5 h-3.5 mr-1.5" />Add Expense Head
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">Expense Heads</div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th className="th-navy w-10 text-center">#</th>
                <th className="th-navy">Action</th>
                <th className="th-navy text-center">Active</th>
                <SortTh col="ExpenseGroupwithCode" label="Expense Group Code" sortConfig={sortConfig} onSort={toggleSort} />
                <SortTh col="ExpenseHeadwithCode"  label="Expense Head Code"  sortConfig={sortConfig} onSort={toggleSort} />
                <SortTh col="ExpenseSubHead"       label="Sub Head"           sortConfig={sortConfig} onSort={toggleSort} />
                <SortTh col="VoucherSeries"        label="Voucher Series"     sortConfig={sortConfig} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No expense heads found</td></tr>
              ) : sorted.map((r, i) => (
                <tr key={r.ID ?? i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border text-gray-400 text-center w-10">{i + 1}</td>
                  <td className="px-3 py-2.5 border-t border-border whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button className="btn btn-secondary btn-sm" onClick={() => onEdit(r)}>
                        <EditIcon className="w-3.5 h-3.5" />
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
                  <td className="px-3 py-2.5 border-t border-border text-center">
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
                  <td className="px-3 py-2.5 border-t border-border">{r.ExpenseGroupwithCode || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border font-medium">{r.ExpenseHeadwithCode || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.ExpenseSubHead       || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.VoucherSeries        || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
