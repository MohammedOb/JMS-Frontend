'use client';
import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { TabBar } from './_components/ui';
import RegistrationTab from './_components/RegistrationTab';
import ListTab from './_components/ListTab';
import ReportTab from './_components/ReportTab';

const TABS = [
  { key: 'register', label: 'Registration'  },
  { key: 'list',     label: 'List / Assign'  },
  { key: 'report',   label: 'Sadar Report'   },
];

export default function MajlisPage() {
  const [tab, setTab] = useState('register');
  return (
    <div>
      <PageHeader title="Majlis Management" subtitle="Registration · Assignment · Sadar-wise reports" />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'register' && <RegistrationTab />}
      {tab === 'list'     && <ListTab />}
      {tab === 'report'   && <ReportTab />}
    </div>
  );
}
