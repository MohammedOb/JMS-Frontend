'use client';

import { useState } from 'react';
import toast        from 'react-hot-toast';
import Modal        from '@/components/shared/Modal';
import { SaveIcon } from '@/components/shared/Icons';
import { bankAccountService } from '@/services';
import BankAccountFormFields  from './BankAccountFormFields';

const DEFAULTS = {
  Alias: '', BankName: '', AccountHolder: '', AccountNumber: '',
  IFSC: '', Branch: '', UpiVpa: '', UpiName: '', IsDefault: 0,
};

export default function BankAccountAddModal({ open, onClose, onSaved, existingRows = [] }) {
  const [form,   setForm]   = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.Alias.trim())    { toast.error('Alias is required');     return; }
    if (!form.BankName.trim()) { toast.error('Bank Name is required'); return; }

    const duplicate = existingRows.find(r =>
      r.Alias?.trim().toLowerCase() === form.Alias.trim().toLowerCase()
    );
    if (duplicate) {
      toast.error('A bank account with this alias already exists');
      return;
    }

    setSaving(true);
    try {
      await bankAccountService.add({
        Alias:         form.Alias.trim(),
        BankName:      form.BankName.trim(),
        AccountHolder: form.AccountHolder.trim(),
        AccountNumber: form.AccountNumber.trim(),
        IFSC:          form.IFSC.trim(),
        Branch:        form.Branch.trim(),
        UpiVpa:        form.UpiVpa.trim(),
        UpiName:       form.UpiName.trim(),
        IsDefault:     form.IsDefault,
        IsActive:      1,
      });
      toast.success('Bank account added');
      setForm(DEFAULTS);
      onSaved();
    } catch {
      toast.error('Failed to add bank account');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => { setForm(DEFAULTS); onClose(); };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Bank Account"
      size="md"
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
      <BankAccountFormFields form={form} set={set} />
    </Modal>
  );
}
