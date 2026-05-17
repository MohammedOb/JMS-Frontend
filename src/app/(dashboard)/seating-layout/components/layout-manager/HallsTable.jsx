'use client';

import { PlusIcon, EditIcon, TrashIcon } from '@/components/shared/Icons';
import SectionsTable from './SectionsTable';

export default function HallsTable({
  halls, loadingHalls, expandedHall, sections,
  onToggleExpand, onAddHall, onEditHall, onDeleteHall,
  onAddSection, onEditSection, onDeleteSection,
}) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <span className="font-semibold text-navy-900 text-sm">Venues</span>
        <button onClick={onAddHall} className="btn-primary text-sm flex items-center gap-1.5">
          <PlusIcon className="w-3.5 h-3.5" />Add Venue
        </button>
      </div>

      {loadingHalls ? (
        <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
      ) : halls.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">No venues yet. Click "Add Venue" to create one.</div>
      ) : (
        <div className="divide-y divide-border">
          {halls.map(hall => (
            <div key={hall.ID}>
              <div className="flex items-center gap-3 px-5 py-3 hover:bg-surface transition-colors">
                <button
                  onClick={() => onToggleExpand(hall.ID)}
                  className="text-navy-700 font-semibold text-sm flex-1 text-left flex items-center gap-2"
                >
                  <span className={`transition-transform ${expandedHall === hall.ID ? 'rotate-90' : ''}`}>▶</span>
                  {hall.HallName}
                  <span className="text-[11px] text-gray-400 font-normal">{hall.HallType}</span>
                  {hall.Description && <span className="text-[11px] text-gray-400 font-normal">— {hall.Description}</span>}
                </button>
                <button onClick={() => onEditHall(hall)} className="p-1.5 rounded hover:bg-blue-50 text-blue-500">
                  <EditIcon className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDeleteHall(hall.ID)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {expandedHall === hall.ID && (
                <SectionsTable
                  sections={sections[hall.ID]}
                  hallId={hall.ID}
                  onAddSection={onAddSection}
                  onEditSection={onEditSection}
                  onDeleteSection={onDeleteSection}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
