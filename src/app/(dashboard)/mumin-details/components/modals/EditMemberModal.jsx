'use client';

import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { ComboBox } from '../../utils';

export default function EditMemberModal({
  open, onClose, member,
  memberForm, setMemberForm,
  sectorOptions, cityOptions, subsectorOpts,
  onSave,
}) {
  const set = (k, v) => setMemberForm(p => ({ ...p, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title={`Edit Member Profile — Acc# ${member?.accno}`} size="xl"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Update Member Profile
          </button>
        </>
      }
    >
      {memberForm && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            <span>Basic Information</span><div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="form-label">Account No.</label>
              <input className="form-input bg-surface" value={memberForm.accno || ''} readOnly />
            </div>
            <div>
              <label className="form-label">Full Name</label>
              <textarea className="form-input resize" rows={2} value={memberForm.name || ''}
                onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Sector</label>
              <ComboBox
                value={memberForm.sector || ''}
                options={sectorOptions}
                placeholder="Type or select sector…"
                onChange={(v) => set('sector', v)}
              />
            </div>
            <div>
              <label className="form-label">Account Status</label>
              <select className="form-select" value={memberForm.status || ''}
                onChange={e => set('status', e.target.value)}>
                {['Active','Closed','BlackList'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="form-label">Mobile</label>
              <input className="form-input" value={memberForm.mobile || ''}
                onChange={e => set('mobile', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Alt. Mobile</label>
              <input className="form-input" value={memberForm.mobile2 || ''}
                onChange={e => set('mobile2', e.target.value)} />
            </div>
            <div>
              <label className="form-label">ITS No.</label>
              <input className="form-input" value={memberForm.itsNo || ''}
                onChange={e => set('itsNo', e.target.value)} />
            </div>
            <div>
              <label className="form-label">HOF ITS No.</label>
              <input className="form-input" value={memberForm.hofIts || ''}
                onChange={e => set('hofIts', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="form-label">Staying In</label>
              <ComboBox
                value={memberForm.stayingIn || ''}
                options={cityOptions}
                placeholder="Type or select city…"
                onChange={(v) => set('stayingIn', v)}
              />
            </div>
            <div>
              <label className="form-label">SMS Eligibility</label>
              <select className="form-select" value={memberForm.smsEligibility || ''}
                onChange={e => set('smsEligibility', e.target.value)}>
                <option>Yes</option><option>No</option>
              </select>
            </div>
            <div>
              <label className="form-label">Login Access</label>
              <select className="form-select" value={memberForm.loginAccess || ''}
                onChange={e => set('loginAccess', e.target.value)}>
                <option>Enable</option><option>Disable</option>
              </select>
            </div>
            <div>
              <label className="form-label">Work Status</label>
              <input className="form-input" value={memberForm.workStatus || ''}
                onChange={e => set('workStatus', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="form-label">Subsector</label>
              <ComboBox
                value={memberForm.subsector || ''}
                options={subsectorOpts(memberForm.sector)}
                placeholder="Type or select subsector…"
                onChange={(v, o) => setMemberForm(p => ({
                  ...p,
                  subsector:     v,
                  subsectorName: o?.subsectorName ?? p.subsectorName,
                  sector:        o?.sector        ?? p.sector,
                }))}
              />
            </div>
            <div>
              <label className="form-label">Subsector Name</label>
              <input className="form-input bg-surface" value={memberForm.subsectorName || ''} readOnly />
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            <span>FMB / Thaali Details</span><div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="form-label">Thaali Status</label>
              <select className="form-select" value={memberForm.thaaliStatus || ''}
                onChange={e => set('thaaliStatus', e.target.value)}>
                {['Regular','Temporary','Only Amount Pay','Not Taken','Temporary Closed','Closed','Closed with Due','N/A'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Thaali Size</label>
              <select className="form-select" value={memberForm.thaaliSize || ''}
                onChange={e => set('thaaliSize', e.target.value)}>
                <option value="">—</option>
                {['Full','Half','N/A'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Close Date</label>
              <input type="date" className="form-input" value={memberForm.closeDate || ''}
                onChange={e => set('closeDate', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Distributor</label>
              <input className="form-input" value={memberForm.distributor || ''}
                onChange={e => set('distributor', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="form-label">Temp From</label>
              <input type="date" className="form-input" value={memberForm.tempFrom || ''}
                onChange={e => set('tempFrom', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Temp To</label>
              <input type="date" className="form-input" value={memberForm.tempTo || ''}
                onChange={e => set('tempTo', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Reason</label>
              <input className="form-input" value={memberForm.thaaliReason || ''}
                onChange={e => set('thaaliReason', e.target.value)} />
            </div>
            <div>
              <label className="form-label">FMB Remark</label>
              <input className="form-input" value={memberForm.fmbRemark || ''}
                onChange={e => set('fmbRemark', e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
