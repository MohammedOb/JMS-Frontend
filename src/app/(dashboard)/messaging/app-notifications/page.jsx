'use client';

import PageHeader from '@/components/shared/PageHeader';
import { SmartphoneIcon, BellIcon } from '@/components/shared/Icons';

const PLANNED_FEATURES = [
  { icon: '📢', title: 'Broadcast Announcements',      desc: 'Send announcements to all members or filtered groups.' },
  { icon: '🔔', title: 'Due Payment Reminders',        desc: 'Automated push reminders when dues are pending.' },
  { icon: '📅', title: 'Event Notifications',          desc: 'Notify members about upcoming events and registrations.' },
  { icon: '✅', title: 'Receipt Confirmations',         desc: 'Instant confirmation when a receipt is added.' },
  { icon: '📊', title: 'Delivery Reports',             desc: 'Track sent, delivered, and opened notifications.' },
  { icon: '🎯', title: 'Targeted Segments',            desc: 'Filter by mohallah, sector, sabeel type, and more.' },
];

export default function AppNotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="App Notifications"
        subtitle="Android & iOS push notification management"
      />

      {/* Hero card */}
      <div className="bg-gradient-to-br from-navy-800 to-blue-900 rounded-2xl p-8 text-white text-center">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
            <SmartphoneIcon className="w-10 h-10 text-blue-300" />
          </div>
        </div>
        <h2 className="text-[22px] font-bold mb-2">Coming Soon</h2>
        <p className="text-white/60 text-[14px] max-w-md mx-auto leading-relaxed">
          Push notification management for JMS Android and iOS mobile apps.
          Members will receive real-time alerts directly on their phones.
        </p>
        <div className="flex justify-center gap-3 mt-5">
          {['Android', 'iOS'].map(p => (
            <span key={p} className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-[12px] font-medium text-white/80">
              📱 {p}
            </span>
          ))}
        </div>
      </div>

      {/* Planned features */}
      <div>
        <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Planned Features
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PLANNED_FEATURES.map(f => (
            <div key={f.title} className="border border-border rounded-xl p-4 bg-white hover:border-blue-200 transition-colors">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-[13px] font-semibold text-gray-800 mb-1">{f.title}</div>
              <div className="text-[12px] text-gray-400 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status note */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 text-[12px] text-amber-800">
        <BellIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Not yet available.</strong> This section will be activated once the JMS mobile apps are published.
          The infrastructure is being designed alongside the WhatsApp messaging system.
        </div>
      </div>
    </div>
  );
}
