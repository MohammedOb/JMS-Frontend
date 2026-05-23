'use client';
import { Label, inp, AutocompleteInput } from './ui';
import { SearchIcon, RefreshIcon } from '@/components/shared/Icons';

export default function FilterBarDone({
  apiFilters, onApiChange,
  localFilters, onLocalChange,
  sectorOpts, mohallaOpts, razaOpts, statusOpts,
  slotTypeOpts, majlisTimeOpts, majlisTypeOpts, sadarOpts,
  onSearch, loading,
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4 p-3 space-y-2">

      {/* Row 1 */}
      <div className="flex flex-wrap items-end gap-2">

        {/* Majlis date range */}
        <div className="flex items-end gap-1.5">
          <div>
            <Label>Majlis From</Label>
            <input
              type="date"
              className={`${inp} w-[140px]`}
              value={apiFilters.MajlisDateFrom || ''}
              onChange={e => onApiChange('MajlisDateFrom', e.target.value)}
            />
          </div>
          <span className="pb-2 text-gray-400 text-[13px]">—</span>
          <div>
            <Label>To</Label>
            <input
              type="date"
              className={`${inp} w-[140px]`}
              value={apiFilters.MajlisDateTo || ''}
              onChange={e => onApiChange('MajlisDateTo', e.target.value)}
            />
          </div>
        </div>

        {/* Text search — wider */}
        <div className="flex-[2] min-w-[220px]">
          <Label>Search</Label>
          <input
            type="text"
            className={inp}
            placeholder="Name, Acc#, ITS, Mobile…"
            value={localFilters.text || ''}
            onChange={e => onLocalChange('text', e.target.value)}
          />
        </div>

        {/* Sector */}
        <div className="flex-1 min-w-[150px]">
          <Label>Sector</Label>
          <select
            className={inp}
            value={localFilters.Sector || ''}
            onChange={e => onLocalChange('Sector', e.target.value)}
          >
            <option value="">All Sectors</option>
            {(sectorOpts || []).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Subsector / Mohalla */}
        <div className="flex-1 min-w-[190px]">
          <Label>Subsector / Mohalla</Label>
          <select
            className={inp}
            value={localFilters.Subsector || ''}
            onChange={e => onLocalChange('Subsector', e.target.value)}
          >
            <option value="">All Mohallas</option>
            {(mohallaOpts || []).map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Majlis Raza */}
        <div className="flex-1 min-w-[120px]">
          <Label>Majlis Raza</Label>
          <AutocompleteInput
            name="MajlisRaza"
            value={localFilters.MajlisRaza || ''}
            onChange={e => onLocalChange('MajlisRaza', e.target.value)}
            options={razaOpts}
            placeholder="All"
            className={inp}
          />
        </div>

        {/* Status */}
        <div className="min-w-[110px]">
          <Label>Status</Label>
          <select
            className={inp}
            value={apiFilters.MajlisStatus || ''}
            onChange={e => onApiChange('MajlisStatus', e.target.value)}
          >
            <option value="">All</option>
            {(statusOpts || []).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Search button — same style as Mumin Details search bar */}
        <div className="flex items-end pb-0.5">
          <button
            className="btn btn-primary p-2"
            onClick={onSearch}
            disabled={loading}
            title={loading ? 'Loading…' : 'Search'}
          >
            {loading
              ? <RefreshIcon className="w-4 h-4 animate-spin" />
              : <SearchIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Row 2 — extra filters */}
      <div className="flex flex-wrap items-end gap-2 pt-1 border-t border-gray-100">

        {/* Slot Type — narrow */}
        <div className="w-[120px]">
          <Label>Slot Type</Label>
          <AutocompleteInput
            name="SlotType"
            value={localFilters.SlotType || ''}
            onChange={e => onLocalChange('SlotType', e.target.value)}
            options={slotTypeOpts}
            placeholder="All"
            className={inp}
          />
        </div>

        {/* Majlis Time — narrow */}
        <div className="w-[120px]">
          <Label>Majlis Time</Label>
          <AutocompleteInput
            name="MajlisTime"
            value={localFilters.MajlisTime || ''}
            onChange={e => onLocalChange('MajlisTime', e.target.value)}
            options={majlisTimeOpts}
            placeholder="All"
            className={inp}
          />
        </div>

        {/* Majlis Type — narrow */}
        <div className="w-[130px]">
          <Label>Majlis Type</Label>
          <AutocompleteInput
            name="MajlisType"
            value={localFilters.MajlisType || ''}
            onChange={e => onLocalChange('MajlisType', e.target.value)}
            options={majlisTypeOpts}
            placeholder="All"
            className={inp}
          />
        </div>

        {/* Sadar — wider */}
        <div className="flex-[2] min-w-[220px]">
          <Label>Sadar</Label>
          <AutocompleteInput
            name="Sadar"
            value={localFilters.Sadar || ''}
            onChange={e => onLocalChange('Sadar', e.target.value)}
            options={sadarOpts}
            placeholder="All sadars"
            className={inp}
          />
        </div>

      </div>
    </div>
  );
}
