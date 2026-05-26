'use client';
import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import FormsList from './_components/FormsList';
import QuestionBankTab from './_components/QuestionBankTab';

const TABS = [
  { key: 'forms', label: 'Forms' },
  { key: 'bank',  label: 'Question Bank' },
];

export default function EventFormsPage() {
  const [tab, setTab] = useState('forms');

  return (
    <div>
      <PageHeader title="Event Registration Forms" subtitle="Create event forms, manage questions, view responses" />

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-[12px] font-semibold border-b-2 transition-all -mb-px ${
              tab === t.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={tab !== 'forms' ? 'hidden' : ''}><FormsList /></div>
      <div className={tab !== 'bank'  ? 'hidden' : ''}><QuestionBankTab /></div>
    </div>
  );
}
