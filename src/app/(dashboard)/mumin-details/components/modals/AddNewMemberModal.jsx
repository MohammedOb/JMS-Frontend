'use client';

import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { ComboBox } from '../../utils';

export default function AddNewMemberModal({
  open, onClose,
  newMemberForm, setNF,
  sectorOptions, cityOptions, subsectorOpts,
  onSave,
}) {
  return (
    <Modal open={open} onClose={onClose} title="Add New Member" size="xl"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save Member
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          <span>Identity</span><div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="form-label">Account No. <span className="text-red-500">*</span></label>
            <input className="form-input" placeholder="e.g. 1001" value={newMemberForm.AccNo}
              onChange={e => setNF('AccNo', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Full Name <span className="text-red-500">*</span></label>
            <textarea className="form-input resize" rows={2} placeholder="Full name" value={newMemberForm.FullName}
              onChange={e => setNF('FullName', e.target.value)} />
          </div>
          <div>
            <label className="form-label">ITS No.</label>
            <input className="form-input" placeholder="ITS number" value={newMemberForm.ITSNo}
              onChange={e => setNF('ITSNo', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="form-label">HOF ITS No.</label>
            <input className="form-input" placeholder="Head of Family ITS" value={newMemberForm.LocalHOFITSNo}
              onChange={e => setNF('LocalHOFITSNo', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Mobile</label>
            <input className="form-input" placeholder="Primary mobile" value={newMemberForm.Mobile}
              onChange={e => setNF('Mobile', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Alt. Mobile</label>
            <input className="form-input" placeholder="Secondary mobile" value={newMemberForm.Mobile1}
              onChange={e => setNF('Mobile1', e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          <span>Location</span><div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="form-label">Sector</label>
            <ComboBox
              value={newMemberForm.Sector}
              options={sectorOptions}
              placeholder="Type or select sector…"
              onChange={(v) => setNF('Sector', v)}
            />
          </div>
          <div>
            <label className="form-label">Subsector</label>
            <ComboBox
              value={newMemberForm.Subsector}
              options={subsectorOpts(newMemberForm.Sector)}
              placeholder="Type or select subsector…"
              onChange={(v, o) => {
                setNF('Subsector', v);
                if (o) {
                  setNF('SubsectorName', o.subsectorName ?? '');
                  setNF('Sector', o.sector ?? newMemberForm.Sector);
                }
              }}
            />
          </div>
          <div>
            <label className="form-label">Subsector Name</label>
            <input className="form-input bg-surface" value={newMemberForm.SubsectorName} readOnly />
          </div>
          <div>
            <label className="form-label">Staying In</label>
            <ComboBox
              value={newMemberForm.StayingIn}
              options={cityOptions}
              placeholder="Type or select city…"
              onChange={(v) => setNF('StayingIn', v)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          <span>Other</span><div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Work Status</label>
            <input className="form-input" placeholder="e.g. Employed, Retired" value={newMemberForm.WorkStatus}
              onChange={e => setNF('WorkStatus', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Sabeel Remark</label>
            <input className="form-input" placeholder="Optional remark" value={newMemberForm.SabeelRemark}
              onChange={e => setNF('SabeelRemark', e.target.value)} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
