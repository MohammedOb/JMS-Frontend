'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { expenseHeadService } from '@/services';
import SuggestionInput from './SuggestionInput';

const DEFAULTS = { ExpenseHeadwithCode: '', ExpenseSubHead: '', VoucherSeries: '', ExpenseGroupwithCode: '' };

export default function ExpenseHeadAddModal({ open, onClose, onSaved, existingRows = [] }) {
  const [form,   setForm]   = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.ExpenseHeadwithCode.trim()) { toast.error('Expense Head Code is required'); return; }

    setSaving(true);
    try {
      await expenseHeadService.add({
        ExpenseHeadwithCode:  form.ExpenseHeadwithCode.trim(),
        ExpenseSubHead:       form.ExpenseSubHead.trim(),
        VoucherSeries:        form.VoucherSeries.trim(),
        ExpenseGroupwithCode: form.ExpenseGroupwithCode.trim(),
        IsActive:             1,
      });
      toast.success('Expense Head added');
      setForm(DEFAULTS);
      onSaved();
    } catch {
      toast.error('Failed to add expense head');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { setForm(DEFAULTS); onClose(); };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Expense Head"
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={handleClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <SaveIcon className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving…' : 'Save'}
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
                {isNewSubHead && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">New</span>}
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
                {isNewVoucher && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded">New</span>}
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
        );
      })()}
    </Modal>
  );
}
