'use client';

import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';

export default function EditFmbModal({ open, onClose, member, fmbForm, setFF, onSave }) {
  return (
    <Modal open={open} onClose={onClose} title={`Edit FMB Details — ${member?.name}`} size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save FMB Details
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="form-label">Thaali Status</label>
            <select className="form-select" value={fmbForm.ThaaliStatus}
              onChange={e => setFF('ThaaliStatus', e.target.value)}>
              <option value="">— Select —</option>
              {['Regular','Temporary','Only Amount Pay','Not Taken','Temp Closed','Closed','Closed with Due','N/A'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Thaali Size</label>
            <select className="form-select" value={fmbForm.ThaaliSize}
              onChange={e => setFF('ThaaliSize', e.target.value)}>
              <option value="">— Select —</option>
              {['Full','Half','N/A'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Distributor Name</label>
            <input className="form-input" placeholder="Distributor" value={fmbForm.DistributorName}
              onChange={e => setFF('DistributorName', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="form-label">Close Year</label>
            <input className="form-input" placeholder="e.g. 1446" value={fmbForm.ThaliCloseYear}
              onChange={e => setFF('ThaliCloseYear', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Close Date</label>
            <input type="date" className="form-input" value={fmbForm.ThaliCloseDate}
              onChange={e => setFF('ThaliCloseDate', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Reason</label>
            <input className="form-input" placeholder="Reason for closing" value={fmbForm.Reason}
              onChange={e => setFF('Reason', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Temp From</label>
            <input type="date" className="form-input" value={fmbForm.TempFromDate}
              onChange={e => setFF('TempFromDate', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Temp To</label>
            <input type="date" className="form-input" value={fmbForm.TempToDate}
              onChange={e => setFF('TempToDate', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="form-label">FMB Remark</label>
          <input className="form-input" placeholder="Optional remark" value={fmbForm.FMBRemark}
            onChange={e => setFF('FMBRemark', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
