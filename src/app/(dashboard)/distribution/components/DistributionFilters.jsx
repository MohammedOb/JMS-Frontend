'use client';

import { useMemo, useState, useEffect } from 'react';
import AutocompleteInput from '@/components/shared/AutocompleteInput';

export default function DistributionFilters({
  filters,
  onChange,
  onSearch,
  onReset,
  distributorOptions = [],   // [{ID, DistributorName}]
  sectorOptions      = [],   // string[]
  allMohallas        = [],   // [{Sector, Subsector, MohallaDescription}]
  thaliSizeOptions   = [],   // string[]
}) {
  // Local display value for the combined "M Code — Mohalla Name" input
  const [mohallaInput, setMohallaInput] = useState('');

  // Sync local input when parent resets filters
  useEffect(() => {
    if (!filters.Subsector && !filters.MohallaDescription) setMohallaInput('');
  }, [filters.Subsector, filters.MohallaDescription]);

  // Combined options, deduped and filtered by current Sector
  const mohallaOptions = useMemo(() => {
    const base = filters.Sector
      ? allMohallas.filter(m => m.Sector === filters.Sector)
      : allMohallas;
    const seen = new Set();
    return base
      .filter(m => m.Subsector && m.MohallaDescription)
      .filter(m => {
        const k = `${m.Subsector}|${m.MohallaDescription}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => a.Subsector.localeCompare(b.Subsector));
  }, [allMohallas, filters.Sector]);

  // Distributor handlers
  const handleDistributorSelect = (item) => {
    onChange('DistributorName', item.DistributorName);
    onChange('DistributorID',   item.ID);
  };
  const handleDistributorType = (v) => {
    onChange('DistributorName', v);
    onChange('DistributorID',   '');
  };

  // Masjid Area (Sector) — cascade-clear M Code + Mohalla when sector changes
  const handleSectorChange = (v) => {
    onChange('Sector', v);
    if (!v) { onChange('Subsector', ''); onChange('MohallaDescription', ''); setMohallaInput(''); }
  };
  const handleSectorSelect = (v) => {
    onChange('Sector', v);
    onChange('Subsector', '');
    onChange('MohallaDescription', '');
    setMohallaInput('');
  };

  // Combined M Code — Mohalla Name
  const handleMohallaSelect = (item) => {
    setMohallaInput(`${item.Subsector} — ${item.MohallaDescription}`);
    onChange('Subsector',          item.Subsector);
    onChange('MohallaDescription', item.MohallaDescription);
  };
  const handleMohallaChange = (v) => {
    setMohallaInput(v);
    if (!v) { onChange('Subsector', ''); onChange('MohallaDescription', ''); }
  };

  return (
    <div className="card mb-4 !overflow-visible">
      <div className="card-header">Filters</div>
      <div className="p-3 flex flex-wrap gap-2 items-end">

        {/* Acc No / Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-gray-500 font-medium">Acc No / Name</label>
          <input
            className="form-input w-40"
            placeholder="Search…"
            value={filters.search}
            onChange={e => onChange('search', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearch()}
          />
        </div>

        {/* Distributor Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-gray-500 font-medium">Distributor Name</label>
          <AutocompleteInput
            className="form-input w-44"
            placeholder="Type to search…"
            value={filters.DistributorName}
            suggestions={distributorOptions}
            getLabel={d => d.DistributorName}
            onChange={handleDistributorType}
            onSelect={handleDistributorSelect}
          />
        </div>

        {/* Masjid Area = Sector */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-gray-500 font-medium">Masjid Area</label>
          <AutocompleteInput
            className="form-input w-40"
            placeholder="Type to search…"
            value={filters.Sector}
            suggestions={sectorOptions}
            onChange={handleSectorChange}
            onSelect={handleSectorSelect}
          />
        </div>

        {/* M Code — Mohalla Name (combined, cascades from Masjid Area) */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-gray-500 font-medium">M Code — Mohalla Name</label>
          <AutocompleteInput
            className="form-input w-60"
            placeholder="Type to search…"
            value={mohallaInput}
            suggestions={mohallaOptions}
            getLabel={m => `${m.Subsector} — ${m.MohallaDescription}`}
            onChange={handleMohallaChange}
            onSelect={handleMohallaSelect}
          />
        </div>

        {/* Thaali Size */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-gray-500 font-medium">Thaali Size</label>
          <AutocompleteInput
            className="form-input w-32"
            placeholder="Type to search…"
            value={filters.ThaaliSize}
            suggestions={thaliSizeOptions}
            onChange={v => onChange('ThaaliSize', v)}
            onSelect={v => onChange('ThaaliSize', v)}
          />
        </div>

        <div className="flex gap-2 pb-0.5">
          <button className="btn btn-primary btn-sm" onClick={onSearch}>Search</button>
          <button className="btn btn-secondary btn-sm" onClick={onReset}>Reset</button>
        </div>
      </div>
    </div>
  );
}
