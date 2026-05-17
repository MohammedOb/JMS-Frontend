'use client';

import { SearchIcon } from '@/components/shared/Icons';
import ComboBox from '../ComboBox';

export default function FilterBar({
  filterEventType, setFilterEventType,
  filterYear, setFilterYear,
  filterHallId, filterSectionId,
  halls, bookingSections,
  loadingGrid,
  eventTypeOptions,
  yearOptions,
  onSearch, onHallChange, onSectionChange,
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Event Type</label>
          <div className="w-44">
            <ComboBox
              value={filterEventType}
              onChange={setFilterEventType}
              options={eventTypeOptions}
              placeholder="Type or select…"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Year</label>
          <div className="w-28">
            <ComboBox
              value={filterYear}
              onChange={setFilterYear}
              options={yearOptions}
              placeholder="e.g. 1447"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Venue</label>
          <select className="form-select text-sm w-44" value={filterHallId} onChange={e => onHallChange(e.target.value)}>
            <option value="">Select Venue</option>
            {halls.map(h => <option key={h.ID} value={h.ID}>{h.HallName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-gray-500 mb-1">Section</label>
          <select className="form-select text-sm w-44" value={filterSectionId} onChange={e => onSectionChange(e.target.value)}>
            <option value="">Select Section</option>
            {bookingSections.map(s => <option key={s.ID} value={s.ID}>{s.SectionName} ({s.SectionType})</option>)}
          </select>
        </div>
        <button
          onClick={onSearch}
          disabled={!filterSectionId || loadingGrid}
          className="btn-primary flex items-center gap-1.5 h-9"
        >
          <SearchIcon className="w-3.5 h-3.5" />
          {loadingGrid ? 'Loading…' : 'Search'}
        </button>
      </div>
    </div>
  );
}
