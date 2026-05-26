'use client';
import { ELIGIBILITY_CONFIG } from '@/utils/eligibilityConfig';
import MultiComboBox from './MultiComboBox';

export default function EligibilitySection({ er, setEr, form, sfn, sectorOptions, mohallaOptions }) {
  return (
    <div className="bg-surface rounded-lg p-4 mb-4">
      <p className="text-[11px] font-bold text-navy-700 uppercase tracking-wider mb-1">Eligibility Restrictions</p>
      <p className="text-[10px] text-gray-400 mb-3">
        Members who don&apos;t meet these requirements will be blocked when they look up their account. Leave blank for no restriction.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ELIGIBILITY_CONFIG.map(field => {
          if (field.type === 'select') return (
            <div key={field.key}>
              <label className="form-label">{field.label}</label>
              <select
                value={er[field.key] || ''}
                onChange={e => setEr(field.key, e.target.value || null)}
                className="form-select"
              >
                <option value="">Any (no restriction)</option>
                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          );

          if (field.type === 'age-range') return (
            <div key={field.key} className="sm:col-span-2 grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Min Age <span className="text-gray-400 font-normal">(0 = no limit)</span></label>
                <input type="number" min="0" name="AgeMin" value={form.AgeMin} onChange={sfn} className="form-input" />
              </div>
              <div>
                <label className="form-label">Max Age <span className="text-gray-400 font-normal">(0 = no limit)</span></label>
                <input type="number" min="0" name="AgeMax" value={form.AgeMax} onChange={sfn} className="form-input" />
              </div>
            </div>
          );

          if (field.type === 'multiselect-sector') return (
            <div key={field.key}>
              <label className="form-label">{field.label}</label>
              <MultiComboBox
                value={er[field.key] || []}
                options={sectorOptions}
                placeholder="Type to search sectors…"
                onChange={v => setEr(field.key, v)}
              />
            </div>
          );

          if (field.type === 'multiselect-mohalla') return (
            <div key={field.key}>
              <label className="form-label">
                {field.label}
                {field.hint && <span className="text-gray-400 font-normal ml-1">({field.hint})</span>}
              </label>
              <MultiComboBox
                value={er[field.key] || []}
                options={mohallaOptions}
                placeholder="Type to search mohalla…"
                onChange={v => setEr(field.key, v)}
              />
            </div>
          );

          return null;
        })}
      </div>
    </div>
  );
}
