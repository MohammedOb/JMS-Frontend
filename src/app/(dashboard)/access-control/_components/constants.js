
export const MODULE_COLOR = {
  dashboard:      'bg-blue-200 text-blue-900 border border-blue-300',
  members:        'bg-indigo-200 text-indigo-900 border border-indigo-300',
  receipts:       'bg-green-200 text-green-900 border border-green-300',
  takhmeen:       'bg-teal-200 text-teal-900 border border-teal-300',
  safai:          'bg-orange-200 text-orange-900 border border-orange-300',
  bookings:       'bg-purple-200 text-purple-900 border border-purple-300',
  seating:        'bg-violet-200 text-violet-900 border border-violet-300',
  expenses:       'bg-red-200 text-red-900 border border-red-300',
  expense_report: 'bg-rose-200 text-rose-900 border border-rose-300',
  users:          'bg-yellow-200 text-yellow-900 border border-yellow-300',
  roles:          'bg-amber-200 text-amber-900 border border-amber-300',
  permissions:    'bg-slate-200 text-slate-900 border border-slate-300',
  audit_logs:     'bg-gray-200 text-gray-900 border border-gray-300',
  daily_report:   'bg-cyan-200 text-cyan-900 border border-cyan-300',
  due:            'bg-pink-200 text-pink-900 border border-pink-300',
  followup:       'bg-fuchsia-200 text-fuchsia-900 border border-fuchsia-300',
  member_search:  'bg-sky-200 text-sky-900 border border-sky-300',
  receipt_quick:  'bg-emerald-200 text-emerald-900 border border-emerald-300',
  utility:        'bg-lime-200 text-lime-900 border border-lime-300',
  mohallah:       'bg-red-200 text-stone-900 border border-stone-300',
  distribution:   'bg-sky-200 text-sky-900 border border-sky-300',
  musaida:        'bg-teal-200 text-teal-900 border border-teal-300',
  majlis:         'bg-indigo-200 text-indigo-900 border border-indigo-300',
  ohbat_majlis:   'bg-violet-200 text-violet-900 border border-violet-300',
  fmb_menu:       'bg-green-200 text-green-900 border border-green-300',
  sabeel_stats:   'bg-blue-200 text-blue-900 border border-blue-300',
  fmb_stats:      'bg-teal-200 text-teal-900 border border-teal-300',
};

export const moduleColor = (m) => MODULE_COLOR[m] || 'bg-gray-200 text-gray-900 border border-gray-300';

const SCOPE_TYPE_COLOR = {
  foryear:    'bg-blue-200 text-blue-900 border border-blue-300',
  createdby:  'bg-purple-200 text-purple-900 border border-purple-300',
  sabeel:     'bg-green-200 text-green-900 border border-green-300',
  sector:     'bg-orange-200 text-orange-900 border border-orange-300',
  vajebaat:   'bg-teal-200 text-teal-900 border border-teal-300',
  hub:        'bg-indigo-200 text-indigo-900 border border-indigo-300',
  place:      'bg-sky-200 text-sky-900 border border-sky-300',
  time:       'bg-amber-200 text-amber-900 border border-amber-300',
};
export const scopeTypeColor = (t) => SCOPE_TYPE_COLOR[t?.toLowerCase()] || 'bg-gray-200 text-gray-900 border border-gray-300';

export const ACTION_COLOR = {
  login:          'bg-green-200 text-green-900 border border-green-300',
  logout:         'bg-slate-200 text-slate-800 border border-slate-300',
  create:         'bg-blue-200 text-blue-900 border border-blue-300',
  update:         'bg-amber-200 text-amber-900 border border-amber-300',
  delete:         'bg-red-200 text-red-900 border border-red-300',
  reset_password: 'bg-violet-200 text-violet-900 border border-violet-300',
};
export const actionColor = (a) => ACTION_COLOR[a] || 'bg-gray-200 text-gray-800 border border-gray-300';

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
