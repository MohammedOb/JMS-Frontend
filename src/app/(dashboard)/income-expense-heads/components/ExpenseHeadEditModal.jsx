'use client';

import { useState, useEffect } from 'react';
import clsx  from 'clsx';
import toast from 'react-hot-toast';
import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { expenseHeadService } from '@/services';
import SuggestionInput from './SuggestionInput';

export default function ExpenseHeadEditModal({ open, onClose, item, onSaved, existingRows = [] }) {
  const [form,   setForm]   = useState({ ExpenseHeadwithCode: '', ExpenseSubHead: '', VoucherSeries: '', ExpenseGroupwithCode: '', IsActive: 1 });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (item) {
      setForm({
        ExpenseHeadwithCode:  item.ExpenseHeadwithCode  ?? '',
        ExpenseSubHead:       item.ExpenseSubHead       ?? '',
        VoucherSeries:        item.VoucherSeries        ?? '',
        ExpenseGroupwithCode: item.ExpenseGroupwithCode ?? '',
        IsActive:             item.IsActive             ?? 1,
      });
    }
  }, [item]);

  const handleSave = async () => {
    if (!form.ExpenseHeadwithCode.trim()) { toast.error('Expense Head Code is required'); return; }

    const subHeadOptions = [...new Set(
      existingRows
        .filter(r => r.ExpenseHeadwithCode?.toLowerCase() === form.ExpenseHeadwithCode.trim().toLowerCase())
        .map(r => r.ExpenseSubHead).filter(Boolean)
    )];
    const voucherOptions = [...new Set(existingRows.map(r => r.VoucherSeries).filter(Boolean))];

    if (form.ExpenseSubHead.trim() && !subHeadOptions.some(s => s.toLowerCase() === form.ExpenseSubHead.trim().toLowerCase())) {
      toast.error('Sub Head does not exist under this Code. Use "Add Expense Head" to create new entries.');
      return;
    }
    if (form.VoucherSeries.trim() && !voucherOptions.some(s => s.toLowerCase() === form.VoucherSeries.trim().toLowerCase())) {
      toast.error('Voucher Series does not exist. Use "Add Expense Head" to create new entries.');
      return;
    }

    setSaving(true);
    try {
      await expenseHeadService.update({
        ID:                   item.ID,
        ExpenseHeadwithCode:  form.ExpenseHeadwithCode.trim(),
        ExpenseSubHead:       form.ExpenseSubHead.trim(),
        VoucherSeries:        form.VoucherSeries.trim(),
        ExpenseGroupwithCode: form.ExpenseGroupwithCode.trim(),
        IsActive:             form.IsActive,
      });
      toast.success('Expense Head updated');
      onSaved();
    } catch {
      toast.error('Failed to update expense head');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Expense Head"
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </>
      }
    >
      {(() => {
        const codeOptions    = [...new Set(existingRows.map(r => r.ExpenseHeadwithCode).filter(Boolean))];
        const subHeadOptions = [...new Set(
          existingRows
            .filter(r => r.ExpenseHeadwithCode?.toLowerCase() === form.ExpenseHeadwithCode.trim().toLowerCase())
            .map(r => r.ExpenseSubHead).filter(Boolean)
        )];
        const voucherOptions = [...new Set(existingRows.map(r => r.VoucherSeries).filter(Boolean))];
        const groupOptions   = [...new Set(existingRows.map(r => r.ExpenseGroupwithCode).filter(Boolean))];

        const isNewCode    = form.ExpenseHeadwithCode.trim()  && !codeOptions.some(s => s.toLowerCase() === form.ExpenseHeadwithCode.trim().toLowerCase());
        const isNewSubHead = form.ExpenseSubHead.trim()       && !subHeadOptions.some(s => s.toLowerCase() === form.ExpenseSubHead.trim().toLowerCase());
        const isNewVoucher = form.VoucherSeries.trim()        && !voucherOptions.some(s => s.toLowerCase() === form.VoucherSeries.trim().toLowerCase());
        const isNewGroup   = form.ExpenseGroupwithCode.trim() && !groupOptions.some(s => s.toLowerCase() === form.ExpenseGroupwithCode.trim().toLowerCase());

        return (
          <div className="space-y-3">
            <div className="space-y-3">
              <div>
                <label className="form-label flex items-center gap-2">
                  Expense Group Code
                  {isNewGroup && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">New</span>}
                </label>
                <SuggestionInput
                  placeholder="Enter expense group code"
                  value={form.ExpenseGroupwithCode}
                  onChange={v => set('ExpenseGroupwithCode', v)}
                  suggestions={groupOptions}
                />
              </div>

              <div>
                <label className="form-label flex items-center gap-2">
                  Expense Head Code <span className="text-red-500">*</span>
                  {isNewCode && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">New</span>}
                </label>
                <SuggestionInput
                  placeholder="Enter expense head code"
                  value={form.ExpenseHeadwithCode}
                  onChange={v => set('ExpenseHeadwithCode', v)}
                  suggestions={codeOptions}
                />
              </div>

              <div>
                <label className="form-label flex items-center gap-2">
                  Sub Head
                  {isNewSubHead && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-600 rounded">New</span>}
                </label>
                <SuggestionInput
                  placeholder="Enter sub head"
                  value={form.ExpenseSubHead}
                  onChange={v => set('ExpenseSubHead', v)}
                  suggestions={subHeadOptions}
                />
              </div>

              <div>
                <label className="form-label flex items-center gap-2">
                  Voucher Series
                  {isNewVoucher && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-600 rounded">New</span>}
                </label>
                <SuggestionInput
                  placeholder="Enter voucher series"
                  value={form.VoucherSeries}
                  onChange={v => set('VoucherSeries', v)}
                  suggestions={voucherOptions}
                  dropUp
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
        );
      })()}
    </Modal>
  );
}
