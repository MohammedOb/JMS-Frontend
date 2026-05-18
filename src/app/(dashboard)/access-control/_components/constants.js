// Pre-defined catalog for the "members" module — maps every FEATURES flag in
// mumin-details/page.jsx to its permission code, label, description, and which
// UI controls it gates. Used by PermissionsTab to show a rich reference view.
export const MEMBER_FEATURE_CATALOG = [
  {
    code: 'members.view',
    action: 'view',
    label: 'View Member Details',
    description: 'Access to the Mumin Details page — view profile, takhmeen, receipts, family',
    controls: ['Mumin Details page (route guard)'],
  },
  {
    code: 'members.add',
    action: 'add',
    label: 'Add New Member',
    description: 'Add a new member to the system; also enables Add Receipt and Add Takhmeen buttons',
    controls: ['New member button in search bar', 'Add receipt button', 'Add takhmeen button'],
  },
  {
    code: 'members.edit',
    action: 'edit',
    label: 'Edit Member Profile',
    description: 'Edit existing member profile information (name, mobile, sector, status, etc.)',
    controls: ['Edit profile button'],
  },
  {
    code: 'members.reset_password',
    action: 'reset_password',
    label: 'Reset Member Password',
    description: 'Reset a member\'s login password from the member profile page',
    controls: ['Reset Password button on profile card'],
  },
  {
    code: 'members.quick_entry',
    action: 'quick_entry',
    label: 'Speed Vajebaat Entry',
    description: 'Shows the quick Vajebaat entry button in Mumin Details',
    controls: ['Vajebaat entry button'],
  },
  {
    code: 'members.view_vajebaat_details',
    action: 'view_vajebaat_details',
    label: 'Vajebaat Info Card',
    description: 'Shows the Vajebaat info card in the left panel of Mumin Details',
    controls: ['Vajebaat info card (left panel)'],
  },
  {
    code: 'members.view_vajebaat_tab',
    action: 'view_vajebaat_tab',
    label: 'Vajebaat Tab',
    description: 'Shows the Vajebaat tab in Mumin Details',
    controls: ['Vajebaat tab'],
  },
  {
    code: 'members.view_him',
    action: 'view_him',
    label: 'HIM Section',
    description: 'Shows the HIM takhmeen section inside the Vajebaat tab',
    controls: ['HIM section in Vajebaat tab'],
  },
  {
    code: 'members.view.safaichitthi_tab',
    action: 'view.safaichitthi_tab',
    label: 'Safai Chitthi Tab',
    description: 'Shows the Safai Chitthi tab in Mumin Details',
    controls: ['Safai Chitthi tab'],
  },
  {
    code: 'members.create.razachitthitab',
    action: 'create.razachitthitab',
    label: 'Add Raza Chitthi',
    description: 'Shows the Add Raza button inside the Safai Chitthi tab',
    controls: ['+ Add Raza button'],
  },
  {
    code: 'members.print_overalldue',
    action: 'print_overalldue',
    label: 'Overall Due Button',
    description: 'Shows the Overall Due button below the due summary table on the Mumin Details page',
    controls: ['Overall Due button (amber)'],
  },
  {
    code: 'members.edit_fmb',
    action: 'edit_fmb',
    label: 'Edit FMB Details',
    description: 'Shows the Edit FMB button on the FMB Details card in the left panel',
    controls: ['Edit FMB button'],
  },
  {
    code: 'members.print_fmb',
    action: 'print_fmb',
    label: 'Print FMB Details',
    description: 'Shows the Print button on the FMB Details card in the left panel',
    controls: ['Print button'],
  },
  {
    code: 'members.hide_actions',
    action: 'hide_actions',
    label: 'Hide All Action Buttons',
    description: 'Hides all action buttons — puts member details in read-only mode for this user',
    controls: ['Edit profile', 'Add receipt', 'Add takhmeen', 'Speed vajebaat', 'Safai/Due/Follow-up buttons', 'New member'],
  },
];

// Pre-defined catalog for the "safai" module permissions
export const SAFAI_FEATURE_CATALOG = [
  {
    code: 'safai.edit',
    action: 'edit',
    label: 'Edit Raza Record',
    description: 'Shows the Edit button on each Safai Chitthi row',
    controls: ['Edit button (pencil icon) per row'],
  },
  {
    code: 'safai.delete',
    action: 'delete',
    label: 'Delete Raza Record',
    description: 'Shows the Delete button on each Safai Chitthi row',
    controls: ['Delete button (trash icon) per row'],
  },
  {
    code: 'safai.print',
    action: 'print',
    label: 'Print Raza Record',
    description: 'Shows the Print button on each row in the Safai Chitthi standalone page and Mumin Details tab',
    controls: ['Print button per row'],
  },
  {
    code: 'safai.update_raza',
    action: 'update_raza',
    label: 'Approve / Revert Raza Status',
    description: 'Shows the Approve (green tick) and Revert (orange refresh) buttons on each row',
    controls: ['Approve button', 'Revert to Pending button'],
  },
];

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
