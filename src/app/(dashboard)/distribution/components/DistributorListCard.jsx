'use client';

import { EditIcon, TrashIcon, PlusIcon } from '@/components/shared/Icons';

function ActiveToggle({ active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={active ? 'Click to deactivate' : 'Click to activate'}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
        active ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          active ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function DistributorListCard({ distributors, loading, onAdd, onEdit, onDelete, onToggleActive, onExport }) {
  return (
    <div className="card mb-4">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <span>Distributors</span>
          {distributors.length > 0 && (
            <span className="text-[11px] text-gray-500 font-normal bg-gray-100 px-2 py-0.5 rounded-full">
              {distributors.length} total
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {distributors.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={onExport}>Export CSV</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={onAdd}>
            <PlusIcon className="w-3.5 h-3.5 mr-1" />Add
          </button>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              {['#', 'Distributor Name', 'Mobile', 'Active', 'Actions'].map(h => (
                <th key={h} className="th-navy">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-6 text-gray-400">Loading…</td></tr>
            ) : distributors.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-6 text-gray-400">No distributors yet. Add one above.</td></tr>
            ) : distributors.map((d, i) => (
              <tr key={d.ID} className={`hover:bg-blue-500/[0.025] ${d.IsActive ? '' : 'opacity-50'}`}>
                <td className="px-3 py-2 border-t border-border text-gray-400 w-8">{i + 1}</td>
                <td className="px-3 py-2 border-t border-border font-medium">{d.DistributorName}</td>
                <td className="px-3 py-2 border-t border-border">{d.Mobile || '—'}</td>
                <td className="px-3 py-2 border-t border-border">
                  <ActiveToggle active={!!d.IsActive} onToggle={() => onToggleActive(d)} />
                </td>
                <td className="px-3 py-2 border-t border-border">
                  <div className="flex items-center gap-1">
                    <button className="btn btn-secondary btn-sm" onClick={() => onEdit(d)} title="Edit">
                      <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => onDelete(d)} title="Delete">
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
  );
}
