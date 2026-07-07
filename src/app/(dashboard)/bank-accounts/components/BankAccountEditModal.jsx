'use client';

import { useState, useEffect } from 'react';
import clsx  from 'clsx';
import toast from 'react-hot-toast';
import Modal from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { bankAccountService } from '@/services';
import BankAccountFormFields  from './BankAccountFormFields';

export default function BankAccountEditModal({ open, onClose, item, onSaved, existingRows = [] }) {
  const [form,   setForm]   = useState({
    Alias: '', BankName: '', AccountHolder: '', AccountNumber: '',
    IFSC: '', Branch: '', UpiVpa: '', UpiName: '', IsDefault: 0, IsActive: 1,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Sync form whenever the item being edited changes
  useEffect(() => {
    if (item) {
      setForm({
        Alias:         item.Alias         ?? '',
        BankName:      item.BankName      ?? '',
        AccountHolder: item.AccountHolder ?? '',
        AccountNumber: item.AccountNumber ?? '',
        IFSC:          item.IFSC          ?? '',
        Branch:        item.Branch        ?? '',
        UpiVpa:        item.UpiVpa        ?? '',
        UpiName:       item.UpiName       ?? '',
        IsDefault:     item.IsDefault     ?? 0,
        IsActive:      item.IsActive      ?? 1,
      });
    }
  }, [item]);

  const handleSave = async () => {
    if (!form.Alias.trim())    { toast.error('Alias is required');     return; }
    if (!form.BankName.trim()) { toast.error('Bank Name is required'); return; }

    const duplicate = existingRows.find(r =>
      Number(r.ID) !== Number(item.ID) &&
      r.Alias?.trim().toLowerCase() === form.Alias.trim().toLowerCase()
    );
    if (duplicate) {
      toast.error('A bank account with this alias already exists');
      return;
    }

    setSaving(true);
    try {
      await bankAccountService.update({
        ID:            item.ID,
        Alias:         form.Alias.trim(),
        BankName:      form.BankName.trim(),
        AccountHolder: form.AccountHolder.trim(),
        AccountNumber: form.AccountNumber.trim(),
        IFSC:          form.IFSC.trim(),
        Branch:        form.Branch.trim(),
        UpiVpa:        form.UpiVpa.trim(),
        UpiName:       form.UpiName.trim(),
        IsDefault:     form.IsDefault,
        IsActive:      form.IsActive,
      });
      toast.success('Bank account updated');
      onSaved();
    } catch {
      toast.error('Failed to update bank account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Bank Account"
      size="md"
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
      <BankAccountFormFields form={form} set={set} />

      <div className="flex items-center gap-3 mt-3">
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
    </Modal>
  );
}
