import { EditIcon, TrashIcon } from '@/components/shared/Icons';

export default function RulesTable({ title, rows, toggling, onEdit, onDelete, onToggleActive }) {
  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <span>{title} Rules</span>
        <span className="text-[11px] text-gray-400">{rows.length} rule{rows.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              {['Sort', 'Label', 'Main Head', 'Sub Head', 'Button', 'Check By', 'Year Key', 'Year Override', 'Active', ''].map(h => (
                <th key={h} className="th-navy text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">No rules</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className={`hover:bg-blue-500/[0.025] transition-opacity ${!r.is_active ? 'opacity-40' : ''}`}>
                <td className="px-3 py-2.5 border-t border-border text-gray-400 tabular-nums">{r.sort_order}</td>
                <td className="px-3 py-2.5 border-t border-border font-medium text-navy-900">{r.label}</td>
                <td className="px-3 py-2.5 border-t border-border text-gray-600">{r.main_head}</td>
                <td className="px-3 py-2.5 border-t border-border text-gray-600">{r.sub_head}</td>
                <td className="px-3 py-2.5 border-t border-border text-gray-600">{r.btn_label}</td>
                <td className="px-3 py-2.5 border-t border-border">
                  <span className={`badge ${r.check_by === 'mainHead' ? 'badge-blue' : 'badge-gray'}`}>{r.check_by}</span>
                </td>
                <td className="px-3 py-2.5 border-t border-border font-mono text-[11px] text-gray-500">{r.year_key || '—'}</td>
                <td className="px-3 py-2.5 border-t border-border font-mono text-[11px] text-gray-500">{r.year_override || '—'}</td>
                <td className="px-3 py-2.5 border-t border-border">
                  <button
                    onClick={() => onToggleActive(r)}
                    disabled={!!toggling[r.id]}
                    title={r.is_active ? 'Click to deactivate' : 'Click to activate'}
                    className="flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${r.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${r.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </button>
                </td>
                <td className="px-2 py-2 border-t border-border">
                  <div className="flex gap-1">
                    <button className="btn btn-secondary btn-sm p-1.5" title="Edit" onClick={() => onEdit(r)}>
                      <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    <button className="btn btn-sm p-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" title="Delete" onClick={() => onDelete(r)}>
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
