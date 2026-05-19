
export const MODULE_COLOR = {
  dashboard:     'bg-blue-100 text-blue-700',
  members:       'bg-indigo-100 text-indigo-700',
  receipts:      'bg-green-100 text-green-700',
  takhmeen:      'bg-teal-100 text-teal-700',
  safai:         'bg-orange-100 text-orange-700',
  bookings:      'bg-purple-100 text-purple-700',
  seating:       'bg-violet-100 text-violet-700',
  expenses:      'bg-red-100 text-red-700',
  expense_report:'bg-rose-100 text-rose-700',
  users:         'bg-yellow-100 text-yellow-700',
  roles:         'bg-amber-100 text-amber-700',
  permissions:   'bg-slate-100 text-slate-700',
  audit_logs:    'bg-gray-100 text-gray-700',
};

export const moduleColor = (m) => MODULE_COLOR[m] || 'bg-gray-100 text-gray-600';

export const ROLE_COLOR = [
  'bg-blue-500','bg-indigo-500','bg-violet-500','bg-teal-500','bg-green-500',
  'bg-orange-500','bg-red-500','bg-amber-500','bg-pink-500','bg-sky-500',
];
export const roleColor = (i) => ROLE_COLOR[i % ROLE_COLOR.length];

export const HUB_VALUES = ['sabeel', 'fmb', 'vajebaat', 'other'];

export const initials = (name) =>
  (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const fmtTime = (d) =>
  d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
