export default function FilterBar({
  fromDate, toDate, filterType, filterEvent,
  mealTypeSuggestions, eventSuggestions,
  onFromDate, onToDate, onTypeChange, onEventChange, onClear,
}) {
  const hasFilter = fromDate || toDate || filterType || filterEvent;

  return (
    <div className="card mb-4">
      <div className="p-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="form-label">From Date</label>
          <input
            type="date"
            className="form-input w-44"
            value={fromDate}
            onChange={e => onFromDate(e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">To Date</label>
          <input
            type="date"
            className="form-input w-44"
            value={toDate}
            min={fromDate || undefined}
            onChange={e => onToDate(e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Type</label>
          <input
            list="fl-meal-type"
            className="form-input w-36"
            placeholder="All types"
            value={filterType}
            onChange={e => onTypeChange(e.target.value)}
          />
          <datalist id="fl-meal-type">
            {mealTypeSuggestions.map(v => <option key={v} value={v} />)}
          </datalist>
        </div>
        <div>
          <label className="form-label">Event</label>
          <input
            list="fl-event"
            className="form-input w-36"
            placeholder="All events"
            value={filterEvent}
            onChange={e => onEventChange(e.target.value)}
          />
          <datalist id="fl-event">
            {eventSuggestions.map(v => <option key={v} value={v} />)}
          </datalist>
        </div>
        {hasFilter && (
          <button className="btn btn-secondary btn-sm mb-0.5" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
