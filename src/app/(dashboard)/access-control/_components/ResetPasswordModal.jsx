'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/shared/Modal';
import { KeyIcon } from '@/components/shared/Icons';
import { rbacService } from '@/services';
import toast from 'react-hot-toast';

export default function ResetPasswordModal({ open, onClose, userId }) {
  const [newPwd, setNewPwd]   = useState('');
  const [saving, setSaving]   = useState(false);

  useEffect(() => { if (!open) setNewPwd(''); }, [open]);

  const doReset = async () => {
    if (!newPwd || newPwd.length < 6) { toast.error('Min 6 characters'); return; }
    setSaving(true);
    try {
      await rbacService.resetPassword(userId, { new_password: newPwd });
      toast.success('Password reset');
      onClose();
    } catch {
      toast.error('Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reset Password"
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={doReset} disabled={saving}>
            <KeyIcon className="w-3.5 h-3.5 mr-1.5" />Reset
          </button>
        </>
      }
    >
      <div>
        <label className="form-label">New Password (min 6 characters)</label>
        <input
          className="form-input"
          type="password"
          value={newPwd}
          onChange={e => setNewPwd(e.target.value)}
          placeholder="Enter new password"
        />
      </div>
    </Modal>
  );
}
