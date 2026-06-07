'use client';

export default function FormDetailsSection({ form, sf, sfn }) {
  return (
    <div className="bg-surface rounded-lg p-4 mb-4">
      <p className="text-[11px] font-bold text-navy-700 uppercase tracking-wider mb-3">Form Details</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        <div className="sm:col-span-2">
          <label className="form-label">Title *</label>
          <input name="Title" value={form.Title} onChange={sfn} className="form-input" placeholder="Ashara 1446 Registration" />
        </div>

        <div>
          <label className="form-label">Event Name</label>
          <input name="EventName" value={form.EventName} onChange={sfn} className="form-input" />
        </div>

        <div>
          <label className="form-label">Event Date</label>
          <input name="EventDate" type="date" value={form.EventDate} onChange={sfn} className="form-input" />
        </div>

        <div className="sm:col-span-2">
          <label className="form-label">Announcement / Description <span className="text-gray-400 font-normal">(shown before questions)</span></label>
          <textarea
            name="Description"
            value={form.Description ?? ''}
            onChange={sfn}
            rows={3}
            className="form-input h-auto py-2 resize-none"
            placeholder="Instructions, details, or announcements shown on the first screen."
          />
        </div>

        <div className="col-span-2">
          <label className="form-label">After Submit Message <span className="text-gray-400 font-normal">(shown on success screen)</span></label>
          <textarea
            name="AfterSubmitMessage"
            value={form.AfterSubmitMessage ?? ''}
            onChange={sfn}
            rows={2}
            className="form-input h-auto py-2 resize-none"
            placeholder="e.g. Jazakallah! Your registration has been recorded."
          />
        </div>

        <div className="col-span-2">
          <label className="form-label">Form Closed Message <span className="text-gray-400 font-normal">(shown when form is not accepting responses)</span></label>
          <textarea
            name="ClosedMessage"
            value={form.ClosedMessage ?? ''}
            onChange={sfn}
            rows={2}
            className="form-input h-auto py-2 resize-none"
            placeholder="e.g. Registrations are now closed. Please contact the admin for assistance."
          />
        </div>

        <div>
          <label className="form-label">Outside / Unregistered Members</label>
          <select
            value={Number(form.AllowOutsideRegistration ?? 1)}
            onChange={e => sf('AllowOutsideRegistration', Number(e.target.value))}
            className="form-select"
          >
            <option value={1}>Allowed — anyone can register</option>
            <option value={0}>Restricted — registered members only</option>
          </select>
        </div>

        <div>
          <label className="form-label">Family Registration</label>
          <select
            value={Number(form.AllowFamilyRegistration ?? 0)}
            onChange={e => sf('AllowFamilyRegistration', Number(e.target.value))}
            className="form-select"
          >
            <option value={0}>Individual — one person per submission</option>
            <option value={1}>Family — HOF registers multiple members</option>
          </select>
          {Number(form.AllowFamilyRegistration) === 1 && (
            <p className="text-[10px] text-blue-600 mt-1">
              HOF selects family members. Mark questions as &quot;Per Member&quot; to show them as columns in the family table.
            </p>
          )}
        </div>

        <div>
          <label className="form-label">Identity Verification</label>
          <select
            value={Number(form.RequireVerification ?? 1)}
            onChange={e => sf('RequireVerification', Number(e.target.value))}
            className="form-select"
          >
            <option value={1}>Required — member must verify before filling form</option>
            <option value={0}>Not required — form opens directly, ITS autofill optional</option>
          </select>
          {Number(form.RequireVerification ?? 1) === 0 && (
            <p className="text-[10px] text-amber-600 mt-1">
              Respondents can optionally enter their ITS No to autofill details. No identity check is performed.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
