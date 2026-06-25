import { useMemo } from 'react';
import AutocompleteInput from '@/components/shared/AutocompleteInput';

export default function RuleForm({ form, setForm, sabeelTypes, headOptions, yearOptions, sysVarKeys }) {
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const setCheck = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value }));

  const mainHeadOptions = useMemo(() => [...new Set(headOptions.map(o => o.mainHead).filter(Boolean))].sort(), [headOptions]);
  const subHeadOptions  = useMemo(() => {
    const filtered = form.main_head
      ? headOptions.filter(o => o.mainHead === form.main_head)
      : headOptions;
    return [...new Set(filtered.map(o => o.subHead).filter(Boolean))].sort();
  }, [headOptions, form.main_head]);

  const handleMainHeadSelect = (v) => {
    setForm(f => {
      const subStillValid = headOptions.some(o => o.mainHead === v && o.subHead === f.sub_head);
      return { ...f, main_head: v, sub_head: subStillValid ? f.sub_head : '' };
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Sabeel Type <span className="text-red-500">*</span></label>
          <AutocompleteInput
            value={form.sabeel_type}
            onChange={set('sabeel_type')}
            suggestions={sabeelTypes}
            placeholder="e.g. Sabeel Regular"
          />
          <p className="text-[10.5px] text-gray-400 mt-0.5">Matched using includes() against member's SabeelType</p>
        </div>

        <div>
          <label className="form-label">Check By <span className="text-red-500">*</span></label>
          <select className="form-input" value={form.check_by} onChange={setCheck('check_by')}>
            <option value="subHead">subHead</option>
            <option value="mainHead">mainHead</option>
          </select>
        </div>
      </div>

      <div>
        <label className="form-label">Alert Label <span className="text-red-500">*</span></label>
        <input className="form-input" placeholder="e.g. HIM Takhmeen not entered" value={form.label} onChange={e => set('label')(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Main Head <span className="text-red-500">*</span></label>
          <AutocompleteInput
            value={form.main_head}
            onChange={handleMainHeadSelect}
            suggestions={mainHeadOptions}
            placeholder="e.g. Vajebaat"
          />
        </div>

        <div>
          <label className="form-label">Sub Head <span className="text-red-500">*</span></label>
          <AutocompleteInput
            value={form.sub_head}
            onChange={set('sub_head')}
            suggestions={subHeadOptions}
            placeholder="e.g. HIM"
          />
        </div>
      </div>

      <div>
        <label className="form-label">Button Label <span className="text-red-500">*</span></label>
        <input className="form-input" placeholder="e.g. Enter HIM" value={form.btn_label} onChange={e => set('btn_label')(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Year Key</label>
          <AutocompleteInput
            value={form.year_key}
            onChange={set('year_key')}
            suggestions={sysVarKeys}
            placeholder="e.g. ForYearFMB"
            className="form-input font-mono"
          />
          <p className="text-[10.5px] text-gray-400 mt-0.5">Blank = use ForYearAll</p>
        </div>

        <div>
          <label className="form-label">Year Override</label>
          <AutocompleteInput
            value={form.year_override}
            onChange={set('year_override')}
            suggestions={yearOptions}
            placeholder="e.g. 1445 (hardcoded)"
            className="form-input font-mono"
          />
          <p className="text-[10.5px] text-gray-400 mt-0.5">Hardcodes a fixed year, ignores Year Key</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Sort Order</label>
          <input type="number" className="form-input" value={form.sort_order} onChange={e => set('sort_order')(e.target.value)} />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="checkbox" checked={!!form.is_active} onChange={setCheck('is_active')} />
            <span className="text-[12px] text-gray-700">Active</span>
          </label>
        </div>
      </div>
    </div>
  );
}
