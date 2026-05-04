'use client';

import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { ComboBox } from '../../utils';


function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
      <span>{title}</span><div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function EditMemberModal({
  open, onClose, member,
  memberForm, setMemberForm,
  sectorOptions, cityOptions, subsectorOpts,
  workStatusOptions,
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

          {/* ── Basic Information ─────────────────────────────── */}
          <SectionHeader title="Basic Information" />
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
              <label className="form-label">HOF Name</label>
              <input className="form-input bg-surface" value={memberForm.hofName || ''} readOnly />
            </div>
            <div>
              <label className="form-label">Mobile</label>
              <input className="form-input" value={memberForm.mobile || ''}
                onChange={e => set('mobile', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Alt. Mobile</label>
              <input className="form-input" value={memberForm.mobile1 || ''}
                onChange={e => set('mobile1', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Staying In</label>
              <ComboBox
                value={memberForm.stayingIn || ''}
                options={cityOptions}
                placeholder="Type or select city…"
                onChange={(v) => set('stayingIn', v)}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
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
              <label className="form-label">Work Status</label>
              <ComboBox
                value={memberForm.workStatus || ''}
                options={workStatusOptions || []}
                placeholder="Type or select…"
                onChange={(v) => set('workStatus', v)}
              />
            </div>
            <div>
              <label className="form-label">Login Access</label>
              <select className="form-select" value={memberForm.loginAccess || ''}
                onChange={e => set('loginAccess', e.target.value)}>
                <option>Enable</option><option>Disable</option>
              </select>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* ── Sabeel Information ─────────────────────────────── */}
          <SectionHeader title="Sabeel Information" />
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="form-label">Sabeel Type</label>
              <input className="form-input" value={memberForm.sabeelType || ''}
                onChange={e => set('sabeelType', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Current Grade</label>
              <input className="form-input" value={memberForm.grade || ''}
                onChange={e => set('grade', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Sabeel Amount</label>
              <input className="form-input bg-surface" value={memberForm.sabeelAmount || ''} readOnly />
            </div>
            <div>
              <label className="form-label">Sabeel Remark</label>
              <input className="form-input" value={memberForm.sabeelRemark || ''}
                onChange={e => set('sabeelRemark', e.target.value)} />
            </div>
          </div>

        </div>
      )}
    </Modal>
  );
}
