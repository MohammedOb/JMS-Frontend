'use client';
import PermissionGuard from '@/components/shared/PermissionGuard';
import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { TabBar } from './_components/ui';
import RegistrationTab from './_components/RegistrationTab';
import ListTab from './_components/ListTab';
import ListDoneTab from './_components/ListDoneTab';

const TABS = [
  { key: 'register', label: 'Registration'   },
  { key: 'list',     label: 'List - Pending'  },
  { key: 'done',     label: 'List - Done'     },
];

export default function MajlisPage() {
  const [tab, setTab] = useState('register');
  return (
    <PermissionGuard permission="majlis.view">
    <div>
      <PageHeader title="Majlis Management" subtitle="Registration · Sadar-wise Assignment & Reports" />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {/* All tabs stay mounted — only visibility changes, state is never lost on tab switch */}
      <div className={tab !== 'register' ? 'hidden' : ''}><RegistrationTab /></div>
      <div className={tab !== 'list'     ? 'hidden' : ''}><ListTab /></div>
      <div className={tab !== 'done'     ? 'hidden' : ''}><ListDoneTab /></div>
    </div>
  </PermissionGuard>
  );
}
