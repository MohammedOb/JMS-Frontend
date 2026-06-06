'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { FileTextIcon, InboxIcon } from '@/components/shared/Icons';
import { waQueueService } from '@/services';

function ModeCard({ href, icon: Icon, title, desc, tag, color }) {
  return (
    <Link href={href} className="group block border border-border rounded-xl p-5 bg-white hover:border-blue-300 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[14px] font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
              {title}
            </span>
            {tag && (
              <span className="text-[10px] font-medium bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{tag}</span>
            )}
          </div>
          <p className="text-[12px] text-gray-500 leading-relaxed">{desc}</p>
        </div>
        <div className="text-gray-300 group-hover:text-blue-400 transition-colors text-lg mt-0.5">›</div>
      </div>
    </Link>
  );
}

function RecentBatchRow({ batch }) {
  const pct = batch.total_items > 0 ? Math.round((batch.sent_count / batch.total_items) * 100) : 0;
  const STATUS = {
    active:    'bg-blue-100 text-blue-700',
    paused:    'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700',
    failed:    'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-gray-700 truncate">{batch.label || `Batch ${batch.batch_id?.slice(0, 8) || '—'}`}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">
          {batch.sent_count}/{batch.total_items} sent · {batch.failed_count > 0 ? `${batch.failed_count} failed · ` : ''}
          {new Date(batch.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      <div className="w-20 flex flex-col gap-1">
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[9px] text-gray-400 text-right">{pct}%</div>
      </div>
      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS[batch.status] || 'bg-gray-100 text-gray-500'}`}>
        {batch.status}
      </span>
    </div>
  );
}

export default function WaBulkLandingPage() {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    waQueueService.recent(5)
      .then(res => setRecent(res.data?.data || []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Messaging"
        subtitle="Send personalized WhatsApp messages to members or from an Excel upload"
      />

      {/* Mode cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ModeCard
          href="/messaging/wa-bulk/excel"
          icon={FileTextIcon}
          title="Excel Upload"
          desc="Upload a spreadsheet (.xlsx/.csv) with any columns. Map the mobile number column and use all other columns as message variables."
          tag="Excel / CSV"
          color="bg-emerald-100 text-emerald-600"
        />
      </div>

      {/* How it works */}
      <div>
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">How it works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {[
            { n: 1, label: 'Select recipients', desc: 'Filter members or upload a spreadsheet' },
            { n: 2, label: 'Compose message',   desc: 'Write a template with {VariableName} placeholders' },
            { n: 3, label: 'Queue batch',        desc: 'Messages are saved to the background queue' },
            { n: 4, label: 'Worker sends',       desc: 'Server sends them with human-like delays — no tab needed' },
          ].map(s => (
            <div key={s.n} className="border border-border rounded-xl p-3.5 bg-white">
              <div className="w-6 h-6 rounded-full bg-navy-800 text-white text-[11px] font-bold flex items-center justify-center mb-2">
                {s.n}
              </div>
              <div className="text-[12px] font-semibold text-gray-700 mb-0.5">{s.label}</div>
              <div className="text-[11px] text-gray-400 leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent batches */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Recent Batches</h3>
            <Link href="/messaging/wa-queue" className="text-[11px] text-blue-500 hover:underline">
              View all in Queue Monitor →
            </Link>
          </div>
          <div className="border border-border rounded-xl bg-white px-4 py-1">
            {recent.map(b => <RecentBatchRow key={b.batch_id} batch={b} />)}
          </div>
        </div>
      )}

      {/* Queue monitor link */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-[12px] text-blue-800">
        <InboxIcon className="w-4 h-4 flex-shrink-0" />
        <span>Track send progress, pause, resume or retry batches in the <Link href="/messaging/wa-queue" className="font-semibold underline">Queue Monitor</Link>.</span>
      </div>
    </div>
  );
}
