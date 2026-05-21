'use client';

import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { ComboBox } from '../../utils';

const THAALI_STATUS_OPTS = ['Regular','Temporary','Only Amount Pay','Not Taken','Temp Closed','Closed','Closed with Due','N/A'];
const THAALI_SIZE_OPTS   = ['Full','Half','Large','Medium','Small','N/A'];

export default function EditFmbModal({ open, onClose, member, fmbForm, setFF, distributorOptions, onSave }) {
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Thaali Status</label>
            <ComboBox
              value={fmbForm.ThaaliStatus}
              options={THAALI_STATUS_OPTS}
              placeholder="Type or select…"
              onChange={(v) => setFF('ThaaliStatus', v)}
            />
          </div>
          <div>
            <label className="form-label">Thaali Size</label>
            <ComboBox
              value={fmbForm.ThaaliSize}
              options={THAALI_SIZE_OPTS}
              placeholder="Type or select…"
              onChange={(v) => setFF('ThaaliSize', v)}
            />
          </div>
          <div>
            <label className="form-label">Distributor Name</label>
            <ComboBox
              value={fmbForm.DistributorName}
              options={distributorOptions || []}
              placeholder="Type or select…"
              onChange={(v) => setFF('DistributorName', v)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
