'use client';

import { useState } from 'react';
import clsx  from 'clsx';
import toast from 'react-hot-toast';
import { incomeHeadService } from '@/services';
import { EditIcon, TrashIcon, PlusIcon } from '@/components/shared/Icons';
import SuggestionInput from './SuggestionInput';

export default function IncomeHeadList({ rows, loading, onAdd, onEdit, onDeleted }) {
  const [hubGroupFilter, setHubGroupFilter] = useState('');
  const [hubFilter,      setHubFilter]      = useState('');
  const [deletingId,     setDeletingId]     = useState(null);
  const [togglingId,     setTogglingId]     = useState(null);

  const hubGroupCodeOptions = [...new Set(rows.map(r => r.HubHeadCode).filter(Boolean))];
  const hubMainHeadOptions  = [...new Set(rows.map(r => r.HubMainHead).filter(Boolean))];

  // Client-side filter + sort: active first, then by HubHeadCode → HubMainHead → HubSubHead
  const filtered = rows.filter(r =>
    (!hubGroupFilter || r.HubHeadCode?.toLowerCase().includes(hubGroupFilter.toLowerCase())) &&
    (!hubFilter      || r.HubMainHead?.toLowerCase().includes(hubFilter.toLowerCase()))
  ).slice().sort((a, b) => {
    if ((b.IsActive ?? 1) !== (a.IsActive ?? 1)) return (b.IsActive ?? 1) - (a.IsActive ?? 1);
    const main = (a.HubMainHead ?? '').localeCompare(b.HubMainHead ?? '');
    if (main !== 0) return main;
    return (a.HubSubHead ?? '').localeCompare(b.HubSubHead ?? '');
  });

  const handleToggle = async (item) => {
    const newVal = item.IsActive ? 0 : 1;
    const action = newVal ? 'Activate' : 'Deactivate';
    if (!window.confirm(`${action} "${item.HubMainHead} – ${item.HubSubHead}"?`)) return;
    setTogglingId(item.ID);
    try {
      await incomeHeadService.update({
        ID:               item.ID,
        HubHeadCode:     item.HubHeadCode     ?? '',
        HubMainHead:      item.HubMainHead,
        HubSubHead:       item.HubSubHead,
        ContributionType: item.ContributionType ?? '',
        CashLimit:        item.CashLimit        ?? 0,
        DefaultLaagat:    item.DefaultLaagat    ?? 0,
        IsActive:         newVal,
      });
      toast.success(newVal ? 'Activated' : 'Deactivated');
      onDeleted();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.HubMainHead} – ${item.HubSubHead}"?`)) return;
    setDeletingId(item.ID);
    try {
      await incomeHeadService.delete({ ID: item.ID });
      toast.success('Income Head deleted');
      onDeleted();
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
            <label className="form-label">Hub Head Code</label>
            <SuggestionInput
              className="w-44"
              placeholder="Type to filter…"
              value={hubGroupFilter}
              onChange={setHubGroupFilter}
              suggestions={hubGroupCodeOptions}
            />
          </div>
          <div>
            <label className="form-label">Hub Main Head</label>
            <SuggestionInput
              className="w-52"
              placeholder="Type to filter…"
              value={hubFilter}
              onChange={setHubFilter}
              suggestions={hubMainHeadOptions}
            />
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onAdd}>
          <PlusIcon className="w-3.5 h-3.5 mr-1.5" />Add Income Head
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">Income Heads</div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {['#', 'Action', 'Active', 'Hub Head Code', 'Hub Main Head', 'Hub Sub Head', 'Contribution Type', 'Cash Limit', 'Default Laagat'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">No income heads found</td></tr>
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
                  <td className="px-3 py-2.5 border-t border-border font-medium">{r.HubHeadCode || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border font-medium">{r.HubMainHead}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.HubSubHead}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.ContributionType || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">
                    {r.CashLimit != null ? `₹${Number(r.CashLimit).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-3 py-2.5 border-t border-border">
                    {r.DefaultLaagat != null ? `₹${Number(r.DefaultLaagat).toLocaleString('en-IN')}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
