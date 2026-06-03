import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { FIELDS, defaultItems, buildLine } from './constants';

export default function MenuFormModal({
  open, editing, form, suggestions, mealTypeSuggestions, eventSuggestions,
  onChange, onSave, onClose,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Menu Entry' : 'Add Menu Entry'}
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save
          </button>
        </>
      }
    >
      {/* Datalists */}
      <datalist id="dl-meal-type">
        {mealTypeSuggestions.map(v => <option key={v} value={v} />)}
      </datalist>
      <datalist id="dl-event">
        {eventSuggestions.map(v => <option key={v} value={v} />)}
      </datalist>
      {FIELDS.map(f => (
        <datalist key={f.key} id={`dl-${f.key}`}>
          {(suggestions[f.key] ?? []).map(v => <option key={v} value={v} />)}
        </datalist>
      ))}

      <div className="space-y-4">
        {/* Date / Type / Event */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.menu_date} onChange={onChange('menu_date')} />
          </div>
          <div>
            <label className="form-label">Type</label>
            <input
              list="dl-meal-type"
              className="form-input"
              placeholder="e.g. Thali, Lunch, Dinner"
              value={form.meal_type}
              onChange={onChange('meal_type')}
            />
          </div>
          <div>
            <label className="form-label">Event</label>
            <input
              list="dl-event"
              className="form-input"
              placeholder="e.g. Ashara, Milad"
              value={form.event}
              onChange={onChange('event')}
            />
          </div>
        </div>

        {/* Feedback close date */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="form-label">
              Feedback Close Date
              <span className="ml-1 text-[10px] text-gray-400 font-normal">(default: menu date + 4 days)</span>
            </label>
            <input
              type="date"
              className="form-input border-orange-200 focus:border-orange-400"
              value={form.feedback_close_date}
              onChange={onChange('feedback_close_date')}
            />
          </div>
        </div>

        {/* Food items */}
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map(f => (
            <div key={f.key}>
              <label className="form-label">{f.label}</label>
              <input
                list={`dl-${f.key}`}
                className="form-input"
                placeholder={`Enter ${f.label}`}
                value={form[f.key]}
                onChange={onChange(f.key)}
              />
            </div>
          ))}
        </div>

        {/* Live preview */}
        <div className="bg-gray-50 rounded-lg p-3 border border-border">
          <p className="text-[11px] text-gray-400 mb-1 font-medium uppercase tracking-wide">Public menu preview</p>
          <p className="text-[13px] text-gray-700">{buildLine(form.menu_date, defaultItems(form))}</p>
        </div>
      </div>
    </Modal>
  );
}
