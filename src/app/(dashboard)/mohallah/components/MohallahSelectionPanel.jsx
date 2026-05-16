'use client';

import ComboBox from '@/components/shared/ComboBox';

export default function MohallahSelectionPanel({
  sectors,
  selectedSector,
  onSectorChange,
  subsectorOptions,
  selectedSubsector,
  onSubsectorChange,
  selectedSabeelType,
  onSabeelTypeChange,
  selectedStayingIn,
  onStayingInChange,
  stayingInOptions,
  eventName,
  onEventNameChange,
  mohallaCode,
  mohallaName,
  onAddMohallah,
  onEditMohallah,
  canEditMohallah,
}) {
  return (
    <div className="flex gap-4 mb-4 items-stretch relative z-20">
      <div className="card flex-1 overflow-visible">
        <div className="card-body overflow-visible">
          <div className="flex items-center justify-end gap-2 mb-3">
            <button className="btn btn-secondary btn-sm" onClick={onAddMohallah}>
              + Add Mohallah
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={onEditMohallah}
              disabled={!canEditMohallah}
            >
              Edit Mohallah
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 overflow-visible">
            <div>
              <label className="form-label">Sector</label>
              <select
                className="form-select"
                value={selectedSector}
                onChange={(e) => onSectorChange(e.target.value)}
              >
                <option value="">Select Sector</option>
                {sectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Mohallah</label>
              <select
                className="form-select"
                value={selectedSubsector}
                onChange={(e) => onSubsectorChange(e.target.value)}
                disabled={!selectedSector}
              >
                <option value="">Select Mohallah</option>
                {subsectorOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.code} - {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Sabeel Type</label>
              <select
                className="form-select"
                value={selectedSabeelType}
                onChange={(e) => onSabeelTypeChange(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Sabeel Regular">Sabeel Regular</option>
                <option value="Sabeel Mutaveteen">Sabeel Mutaveteen</option>
              </select>
            </div>
            <div>
              <label className="form-label">Staying In</label>
              <ComboBox
                value={selectedStayingIn}
                options={stayingInOptions}
                placeholder="Type to search..."
                onChange={(value) => onStayingInChange(value)}
              />
            </div>
            <div>
              <label className="form-label">Event Name (optional)</label>
              <input
                className="form-input"
                placeholder="Enter event name if needed"
                value={eventName}
                onChange={(e) => onEventNameChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card w-44 flex-shrink-0 flex flex-col items-center justify-center py-5 gap-1">
        <div className="text-[52px] font-black leading-none text-navy-900 tracking-tight">
          {mohallaCode}
        </div>
        <div className="text-[12px] font-semibold text-navy-700 text-center px-3 leading-snug">
          {mohallaName}
        </div>
      </div>
    </div>
  );
}
