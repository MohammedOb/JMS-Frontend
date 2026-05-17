'use client';

import { PlusIcon, EditIcon, TrashIcon } from '@/components/shared/Icons';

export default function SectionsTable({ sections, hallId, onAddSection, onEditSection, onDeleteSection }) {
  return (
    <div className="bg-surface border-t border-border px-8 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sections</span>
        <button onClick={() => onAddSection(hallId)} className="btn-secondary text-xs flex items-center gap-1">
          <PlusIcon className="w-3 h-3" />Add Section
        </button>
      </div>

      {!sections?.length ? (
        <p className="text-xs text-gray-400">No sections. Add one above.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 uppercase tracking-wide">
              <th className="text-left py-1 font-medium">Name</th>
              <th className="text-left py-1 font-medium">Type</th>
              <th className="text-left py-1 font-medium">Position</th>
              <th className="text-center py-1 font-medium">Rows</th>
              <th className="text-center py-1 font-medium">Cols</th>
              <th className="text-center py-1 font-medium">Total Seats</th>
              <th className="py-1" />

            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sections.map(sec => (
              <tr key={sec.ID} className="hover:bg-white transition-colors">
                <td className="py-1.5 font-medium text-navy-800">{sec.SectionName}</td>
                <td className="py-1.5 text-gray-600">{sec.SectionType}</td>
                <td className="py-1.5 text-gray-600">{sec.Position}</td>
                <td className="py-1.5 text-center">{sec.RowCount}</td>
                <td className="py-1.5 text-center">{sec.ColCount}</td>
                <td className="py-1.5 text-center font-semibold text-navy-700">{sec.RowCount * sec.ColCount}</td>
                <td className="py-1.5 flex gap-1 justify-end">
                  <button onClick={() => onEditSection(sec, hallId)} className="p-1 rounded hover:bg-blue-50 text-blue-500">
                    <EditIcon className="w-3 h-3" />
                  </button>
                  <button onClick={() => onDeleteSection(sec.ID, hallId)} className="p-1 rounded hover:bg-red-50 text-red-500">
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
