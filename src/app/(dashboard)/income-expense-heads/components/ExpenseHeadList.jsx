'use client';

import clsx from 'clsx';
import { EditIcon, TrashIcon, PlusIcon } from '@/components/shared/Icons';

const EXPENSE_CATEGORIES = ['General', 'Administration', 'Operations', 'Maintenance', 'Capital', 'Other'];

function StatusBadge({ status }) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
      status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
    )}>
      {status}
    </span>
  );
}

export default function ExpenseHeadList({ rows, loading, filters, onFilterChange, onAdd, onEdit, onDelete }) {
  return (
    <>
      {/* Filters + Add button */}
      <div className="bg-white border border-border rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="form-label">Search</label>
            <input
              className="form-input w-56"
              placeholder="Search by head name…"
              value={filters.search}
              onChange={e => onFilterChange('search', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={filters.category}
              onChange={e => onFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={e => onFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
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
                {['#', 'Head Name', 'Category', 'Description', 'Status', 'Action'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No expense heads found</td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.id ?? i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border w-10 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2.5 border-t border-border font-medium">{r.headName}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.category}</td>
                  <td className="px-3 py-2.5 border-t border-border text-gray-500">{r.description || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <button className="btn btn-secondary btn-sm" onClick={() => onEdit(r)}>
                        <EditIcon className="w-3.5 h-3.5 mr-1" />Edit
                      </button>
                      <button
                        className="btn btn-sm border border-red-200 text-red-500 hover:bg-red-50"
                        onClick={() => onDelete(r)}
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
