import clsx from 'clsx';

const VARIANTS = {
  green:  'bg-green-100 text-green-700',
  red:    'bg-red-100 text-red-700',
  amber:  'bg-amber-100 text-amber-700',
  blue:   'bg-blue-100 text-blue-700',
  gray:   'bg-gray-100 text-gray-600',
  navy:   'bg-navy-800/10 text-navy-800',
  orange: 'bg-orange-100 text-orange-700',
};

export default function Badge({ variant = 'gray', children, className }) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold', VARIANTS[variant], className)}>
      {children}
    </span>
  );
}

// Pre-made status badge for common patterns
export function StatusBadge({ status }) {
  const map = {
    Active:    { variant: 'green',  label: 'Active' },
    active:    { variant: 'green',  label: 'Active' },
    Paid:      { variant: 'green',  label: 'Paid' },
    Cancelled: { variant: 'red',    label: 'Cancelled' },
    cancelled: { variant: 'red',    label: 'Cancelled' },
    Expired:   { variant: 'red',    label: 'Expired' },
    Inactive:  { variant: 'red',    label: 'Inactive' },
    Partial:   { variant: 'amber',  label: 'Partial' },
    Pending:   { variant: 'amber',  label: 'Pending' },
    pending:   { variant: 'amber',  label: 'Pending' },
    Upcoming:  { variant: 'amber',  label: 'Upcoming' },
    Done:      { variant: 'green',  label: 'Done' },
    Planned:   { variant: 'amber',  label: 'Planned' },
    Approved:  { variant: 'green',  label: 'Approved' },
    Confirmed: { variant: 'green',  label: 'Confirmed' },
  };
  const m = map[status] || { variant: 'gray', label: status };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
