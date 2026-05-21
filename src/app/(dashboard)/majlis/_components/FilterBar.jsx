'use client';
import { Label, inp, sel } from './ui';
import { SearchIcon, RefreshIcon } from '@/components/shared/Icons';
import { SLOTS, TYPES, STATUSES, YEARS } from './constants';

export default function FilterBar({ filters, onChange, onSearch, loading }) {
  const f = (k, v) => onChange(p => ({ ...p, [k]: v }));
  return (
    <div className="card mb-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div>
          <Label>Year</Label>
          <select className={sel} value={filters.ForYear || ''} onChange={e => f('ForYear', e.target.value)}>
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <Label>From Date</Label>
          <input type="date" className={inp} value={filters.MajlisDateFrom || ''} onChange={e => f('MajlisDateFrom', e.target.value)} />
        </div>
        <div>
          <Label>To Date</Label>
          <input type="date" className={inp} value={filters.MajlisDateTo || ''} onChange={e => f('MajlisDateTo', e.target.value)} />
        </div>
        <div>
          <Label>Slot</Label>
          <select className={sel} value={filters.SlotType || ''} onChange={e => f('SlotType', e.target.value)}>
            <option value="">All Slots</option>
            {SLOTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <Label>Type</Label>
          <select className={sel} value={filters.MajlisType || ''} onChange={e => f('MajlisType', e.target.value)}>
            <option value="">All Types</option>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label>Status</Label>
          <select className={sel} value={filters.MajlisStatus || ''} onChange={e => f('MajlisStatus', e.target.value)}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <Label>Sadar</Label>
          <input className={inp} placeholder="Filter by sadar…" value={filters.Sadar || ''} onChange={e => f('Sadar', e.target.value)} />
        </div>
        <div className="flex items-end">
          <button className="btn btn-primary w-full" onClick={onSearch} disabled={loading}>
            {loading
              ? <RefreshIcon className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              : <SearchIcon className="w-3.5 h-3.5 mr-1.5" />}
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
