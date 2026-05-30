'use client';

import { useState, useEffect } from 'react';
import clsx  from 'clsx';
import toast from 'react-hot-toast';
import Modal from '@/components/shared/Modal';
import { SaveIcon }            from '@/components/shared/Icons';
import { incomeHeadService }   from '@/services';
import SuggestionInput         from './SuggestionInput';

export default function IncomeHeadEditModal({ open, onClose, item, onSaved, existingRows = [], contribSuggestions = [] }) {
  const [form,   setForm]   = useState({ HubHeadCode: '', HubMainHead: '', HubSubHead: '', ContributionType: '', CashLimit: '', DefaultLaagat: '', IsActive: 1 });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Sync form whenever the item being edited changes
  useEffect(() => {
    if (item) {
      setForm({
        HubHeadCode:     item.HubHeadCode     ?? '',
        HubMainHead:      item.HubMainHead      ?? '',
        HubSubHead:       item.HubSubHead       ?? '',
        ContributionType: item.ContributionType ?? '',
        CashLimit:        item.CashLimit        ?? '',
        DefaultLaagat:    item.DefaultLaagat    ?? '',
        IsActive:         item.IsActive         ?? 1,
      });
    }
  }, [item]);

  const handleSave = async () => {
    if (!form.HubMainHead.trim()) { toast.error('Hub Main Head is required'); return; }
    if (!form.HubSubHead.trim())  { toast.error('Hub Sub Head is required');  return; }

    const groupTrimLC = form.HubHeadCode.trim().toLowerCase();
    const rowsByGroup = groupTrimLC
      ? existingRows.filter(r => r.HubHeadCode?.toLowerCase() === groupTrimLC)
      : existingRows;

    // Block creating a brand-new HubMainHead via Edit
    const mainExists = rowsByGroup.some(r =>
      r.HubMainHead?.trim().toLowerCase() === form.HubMainHead.trim().toLowerCase()
    );
    if (!mainExists) {
      toast.error('Hub Main Head does not exist. Use "Add Income Head" to create new heads.');
      return;
    }

    // Block creating a brand-new HubSubHead under this Main Head via Edit
    const subExists = rowsByGroup.some(r =>
      r.HubMainHead?.trim().toLowerCase() === form.HubMainHead.trim().toLowerCase() &&
      r.HubSubHead?.trim().toLowerCase()  === form.HubSubHead.trim().toLowerCase()
    );
    if (!subExists) {
      toast.error('Hub Sub Head does not exist under this Main Head. Use "Add Income Head" to create new entries.');
      return;
    }

    // Uniqueness check — exclude the current record (Number() avoids string/number mismatch)
    const duplicate = existingRows.find(r =>
      Number(r.ID) !== Number(item.ID) &&
      r.HubMainHead?.trim().toLowerCase() === form.HubMainHead.trim().toLowerCase() &&
      r.HubSubHead?.trim().toLowerCase()  === form.HubSubHead.trim().toLowerCase()
    );
    if (duplicate) {
      toast.error('This Hub Main Head + Sub Head combination already exists');
      return;
    }

    setSaving(true);
    try {
      await incomeHeadService.update({
        ID:               item.ID,
        HubHeadCode:     form.HubHeadCode.trim(),
        HubMainHead:      form.HubMainHead.trim(),
        HubSubHead:       form.HubSubHead.trim(),
        ContributionType: form.ContributionType.trim(),
        CashLimit:        Number(form.CashLimit)     || 0,
        DefaultLaagat:    Number(form.DefaultLaagat) || 0,
        IsActive:         form.IsActive,
      });
      toast.success('Income Head updated');
      onSaved();
    } catch {
      toast.error('Failed to update income head');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Income Head"
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving…' : 'Save Changes'}
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

          const isNewMain = form.HubMainHead.trim() && !mainSuggestions.some(s => s.toLowerCase() === form.HubMainHead.trim().toLowerCase());
          const isNewSub  = form.HubSubHead.trim()  && !subSuggestions.some(s => s.toLowerCase() === form.HubSubHead.trim().toLowerCase());

          return (
            <>
              <div>
                <label className="form-label">Hub Head Code</label>
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
                  {isNewMain && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-600 rounded">New</span>}
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
                  {isNewSub && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-600 rounded">New</span>}
                </label>
                <SuggestionInput
                  placeholder="Enter hub sub head"
                  value={form.HubSubHead}
                  onChange={v => set('HubSubHead', v)}
                  suggestions={subSuggestions}
                />
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

        <div className="flex items-center gap-3">
          <label className="form-label mb-0">Active</label>
          <button
            type="button"
            onClick={() => set('IsActive', form.IsActive ? 0 : 1)}
            className={clsx(
              'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
              form.IsActive ? 'bg-blue-500' : 'bg-gray-300'
            )}
          >
            <span className={clsx(
              'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
              form.IsActive ? 'translate-x-4' : 'translate-x-1'
            )} />
          </button>
          <span className="text-[12px] text-gray-500">{form.IsActive ? 'Active' : 'Inactive'}</span>
        </div>
      </div>
    </Modal>
  );
}
