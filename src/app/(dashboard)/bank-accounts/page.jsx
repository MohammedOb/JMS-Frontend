'use client';
import PermissionGuard from '@/components/shared/PermissionGuard';

import { useState, useEffect, useCallback } from 'react';
import toast      from 'react-hot-toast';
import PageHeader from '@/components/shared/PageHeader';
import { bankAccountService } from '@/services';

import BankAccountList      from './components/BankAccountList';
import BankAccountAddModal  from './components/BankAccountAddModal';
import BankAccountEditModal from './components/BankAccountEditModal';

export default function BankAccountsPage() {
  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [addOpen,  setAddOpen]  = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bankAccountService.load({});
      const data = res.data?.data ?? res.data;
      setRows(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = () => {
    setAddOpen(false);
    setEditItem(null);
    load();
  };

  return (
    <PermissionGuard permission="utility.view">
    <div>
      <PageHeader
        title="Bank Accounts"
        subtitle="Org bank accounts — hub heads and the UPI gateway pay into these"
      />

      <BankAccountList
        rows={rows}
        loading={loading}
        onAdd={() => setAddOpen(true)}
        onEdit={(item) => setEditItem(item)}
        onChanged={load}
      />

      <BankAccountAddModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={handleSaved}
        existingRows={rows}
      />
      <BankAccountEditModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        item={editItem}
        onSaved={handleSaved}
        existingRows={rows}
      />
    </div>
    </PermissionGuard>
  );
}
