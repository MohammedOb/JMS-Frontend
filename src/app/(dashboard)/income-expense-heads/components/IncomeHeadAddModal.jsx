'use client';

import { useState }       from 'react';
import toast              from 'react-hot-toast';
import Modal              from '@/components/shared/Modal';
import { SaveIcon }       from '@/components/shared/Icons';
import { incomeHeadService } from '@/services';
import SuggestionInput    from './SuggestionInput';

const DEFAULTS = { HubHeadCode: '', HubMainHead: '', HubSubHead: '', ContributionType: '', CashLimit: '', DefaultLaagat: '', DefaultBankAccountID: '' };

export default function IncomeHeadAddModal({ open, onClose, onSaved, existingRows = [], contribSuggestions = [], bankAccounts = [] }) {
  const [form,   setForm]   = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    // ── Validation ──────────────────────────────────────────────────────────
    if (!form.HubMainHead.trim()) { toast.error('Hub Main Head is required'); return; }
    if (!form.HubSubHead.trim())  { toast.error('Hub Sub Head is required');  return; }

    // Uniqueness: HubMainHead + HubSubHead must not already exist
    const duplicate = existingRows.find(r =>
      r.HubMainHead?.trim().toLowerCase() === form.HubMainHead.trim().toLowerCase() &&
      r.HubSubHead?.trim().toLowerCase()  === form.HubSubHead.trim().toLowerCase()
    );
    if (duplicate) {
      toast.error('This Hub Main Head + Sub Head combination already exists');
      return;
    }

    setSaving(true);
    try {
      await incomeHeadService.add({
        HubHeadCode:     form.HubHeadCode.trim(),
        HubMainHead:      form.HubMainHead.trim(),
        HubSubHead:       form.HubSubHead.trim(),
        ContributionType: form.ContributionType.trim(),
        CashLimit:        Number(form.CashLimit)     || 0,
        DefaultLaagat:    Number(form.DefaultLaagat) || 0,
        DefaultBankAccountID: form.DefaultBankAccountID ? Number(form.DefaultBankAccountID) : null,
        IsActive:         1,
      });
      toast.success('Income Head added');
      setForm(DEFAULTS);
      onSaved();
    } catch {
      toast.error('Failed to add income head');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { setForm(DEFAULTS); onClose(); };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Income Head"
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {(() => {
          const groupSuggestions = [...new Set(existingRows.map(r => r.HubHeadCode).filter(Boolean))];
          const groupTrimLC      = form.HubHeadCode.trim().toLowerCase();

          const rowsByGroup = groupTrimLC
            ? existingRows.filter(r => r.HubHeadCode?.toLowerCase() === groupTrimLC)
            : existingRows;

          const mainSuggestions = [...new Set(rowsByGroup.map(r => r.HubMainHead).filter(Boolean))];
          const subSuggestions  = [...new Set(
            rowsByGroup
              .filter(r => r.HubMainHead?.toLowerCase() === form.HubMainHead.trim().toLowerCase())
              .map(r => r.HubSubHead)
              .filter(Boolean)
          )];

          const isNewGroup = form.HubHeadCode.trim() && !groupSuggestions.some(s => s.toLowerCase() === groupTrimLC);
          const isNewMain  = form.HubMainHead.trim()  && !mainSuggestions.some(s => s.toLowerCase() === form.HubMainHead.trim().toLowerCase());
          const isNewSub   = form.HubSubHead.trim()   && !subSuggestions.some(s => s.toLowerCase() === form.HubSubHead.trim().toLowerCase());

          return (
            <>
              <div>
                <label className="form-label flex items-center gap-2">
                  Hub Head Code
                  {isNewGroup && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">New</span>}
                </label>
                <SuggestionInput
                  placeholder="Enter hub head code"
                  value={form.HubHeadCode}
                  onChange={v => { set('HubHeadCode', v); set('HubMainHead', ''); set('HubSubHead', ''); }}
                  suggestions={groupSuggestions}
                />
              </div>

              <div>
                <label className="form-label flex items-center gap-2">
                  Hub Main Head <span className="text-red-500">*</span>
                  {isNewMain && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">New</span>}
                </label>
                <SuggestionInput
                  placeholder="Enter hub main head"
                  value={form.HubMainHead}
                  onChange={v => { set('HubMainHead', v); set('HubSubHead', ''); }}
                  suggestions={mainSuggestions}
                />
              </div>

              <div>
                <label className="form-label flex items-center gap-2">
                  Hub Sub Head <span className="text-red-500">*</span>
                  {isNewSub && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">New</span>}
                </label>
                <SuggestionInput
                  placeholder="Enter hub sub head"
                  value={form.HubSubHead}
                  onChange={v => set('HubSubHead', v)}
                  suggestions={subSuggestions}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Hub Main Head + Sub Head must be a unique combination.
                </p>
              </div>
            </>
          );
        })()}

        <div>
          <label className="form-label">Contribution Type</label>
          <SuggestionInput
            placeholder="Type to search or enter new…"
            value={form.ContributionType}
            onChange={v => set('ContributionType', v)}
            suggestions={contribSuggestions}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Cash Limit (₹)</label>
            <input
              type="number"
              min="0"
              className="form-input"
              placeholder="0"
              value={form.CashLimit}
              onChange={e => set('CashLimit', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Default Laagat (₹)</label>
            <input
              type="number"
              min="0"
              className="form-input"
              placeholder="0"
              value={form.DefaultLaagat}
              onChange={e => set('DefaultLaagat', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Default Bank Account</label>
          <select
            className="form-select"
            value={form.DefaultBankAccountID}
            onChange={e => set('DefaultBankAccountID', e.target.value)}
          >
            <option value="">— Org default account —</option>
            {bankAccounts.map(ba => (
              <option key={ba.ID} value={ba.ID}>{ba.Alias} ({ba.BankName})</option>
            ))}
          </select>
          <p className="text-[11px] text-gray-400 mt-1">
            Contributions to this head are collected into this account (incl. online UPI payments).
          </p>
        </div>
      </div>
    </Modal>
  );
}
