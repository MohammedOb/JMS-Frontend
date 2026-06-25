'use client';

import { useState } from 'react';
import toast        from 'react-hot-toast';
import { useAuth }  from '@/context/AuthContext';
import { followupService } from '@/services';
import Modal        from '@/components/shared/Modal';
import { EditIcon, SaveIcon, CheckIcon, RefreshIcon } from '@/components/shared/Icons';

const today   = () => new Date().toISOString().split('T')[0];
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString('en-GB').replace(/\//g, '-');
};

const ACTION_OPTIONS = ['Call Again', 'Visit', 'Send SMS', 'Mark as Done'];

function StatusBadge({ status }) {
  return status === 'closed'
    ? <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">Closed</span>
    : <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">Open</span>;
}

export default function FollowupTab({ followups, loading, onAdd, onReload }) {
  const { can }    = useAuth();
  const [modal,    setModal]   = useState(false);
  const [editing,  setEditing] = useState(null);
  const [form,     setForm]    = useState({ date: today(), note: '', response: '', action: 'Call Again' });
  const [saving,   setSaving]  = useState(false);

  const openEdit = (r) => {
    setEditing(r);
    setForm({ date: r.followup_date?.slice(0, 10) || today(), note: r.note || '', response: r.response || '', action: r.next_action || 'Call Again' });
    setModal(true);
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await followupService.update(editing.id, form);
      toast.success('Updated');
      setModal(false);
      onReload();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleClose = async (r) => {
    try {
      await followupService.close(r.id);
      toast.success('Follow-up closed');
      onReload();
    } catch { toast.error('Failed to close'); }
  };

  const handleReopen = async (r) => {
    try {
      await followupService.reopen(r.id);
      toast.success('Follow-up reopened');
      onReload();
    } catch { toast.error('Failed to reopen'); }
  };

  const openCount = followups.filter(r => r.status === 'open').length;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[12px] text-gray-500">
          {openCount > 0
            ? <span className="text-orange-600 font-semibold">{openCount} open follow-up{openCount !== 1 ? 's' : ''}</span>
            : <span className="text-green-600 font-semibold">All follow-ups closed</span>
          }
        </div>
        <button className="btn btn-primary btn-sm" onClick={onAdd}>+ Add Follow-up</button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
      ) : followups.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No follow-up records for this member</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {['Date','Note','Response','Next Action','Status','Closed By','Created','Action'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {followups.map((r, i) => (
                <tr key={r.id ?? i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2 border-t border-border whitespace-nowrap">{fmtDate(r.followup_date)}</td>
                  <td className="px-3 py-2 border-t border-border max-w-[180px] truncate">{r.note || '—'}</td>
                  <td className="px-3 py-2 border-t border-border max-w-[200px] truncate text-green-700">{r.response || '—'}</td>
                  <td className="px-3 py-2 border-t border-border whitespace-nowrap">{r.next_action || '—'}</td>
                  <td className="px-3 py-2 border-t border-border"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-2 border-t border-border text-gray-500">{r.closed_by || '—'}</td>
                  <td className="px-3 py-2 border-t border-border whitespace-nowrap text-gray-400">{fmtDate(r.created_at)}</td>
                  <td className="px-3 py-2 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      {can('followup.edit') && (
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>
                          <EditIcon className="w-3 h-3 mr-1" />Edit
                        </button>
                      )}
                      {r.status === 'open' && can('followup.close') && (
                        <button className="btn btn-sm bg-green-50 text-green-700 border border-green-200 hover:bg-green-100" onClick={() => handleClose(r)}>
                          <CheckIcon className="w-3 h-3 mr-1" />Close
                        </button>
                      )}
                      {r.status === 'closed' && can('followup.edit') && (
                        <button className="btn btn-sm bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100" onClick={() => handleReopen(r)}>
                          <RefreshIcon className="w-3 h-3 mr-1" />Reopen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Edit Follow-up"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              <SaveIcon className="w-3.5 h-3.5 mr-1.5" />Save
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="form-label">Follow-up Date</label>
            <input type="date" className="form-input" value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Reason / Note</label>
            <input className="form-input" placeholder="e.g. Called — no response" value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Response / Callback Note</label>
            <textarea
              className="form-input min-h-[80px] resize-y"
              placeholder="e.g. Member said will pay by Friday…"
              value={form.response}
              onChange={e => setForm(p => ({ ...p, response: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Next Action</label>
            <select className="form-select" value={form.action}
              onChange={e => setForm(p => ({ ...p, action: e.target.value }))}>
              {ACTION_OPTIONS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
