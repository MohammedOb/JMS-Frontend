import { fmtDate } from '@/utils/dateUtils';

export { fmtDate, toDateInput, firstOfMonth, lastOfMonth } from '@/utils/dateUtils';

export const FIELDS = [
  { key: 'mithas',     label: 'Mithas' },
  { key: 'kharas',     label: 'Kharas' },
  { key: 'tarkari',    label: 'Tarkari' },
  { key: 'roti_nan',   label: 'Roti / Nan' },
  { key: 'jaman',      label: 'Jaman' },
  { key: 'soup_curry', label: 'Soup / Curry' },
  { key: 'cold_drink', label: 'Cold Drinks' },
  { key: 'fruit',      label: 'Fruit' },
  { key: 'sounf',      label: 'Sounf' },
  { key: 'salad',      label: 'Salad' },
  { key: 'others',     label: 'Others' },
];

export const PAGE_SIZES = [30, 90, 180, 365, 700, 1000, 'All'];

const pad2 = (n) => String(n).padStart(2, '0');
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
export const addDays = (dateStr, n) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
};

export const blank = () => {
  const t = today();
  return {
    menu_date: t, meal_type: '', event: '',
    feedback_close_date: addDays(t, 4),
    mithas: '', kharas: '', tarkari: '', roti_nan: '', jaman: '',
    soup_curry: '', cold_drink: '', fruit: '', sounf: '',
    salad: '', others: '',
  };
};

export const defaultItems = (r) => {
  const eventItem = r.event && r.event.trim() ? [r.event.trim()] : [];
  const food      = FIELDS.map(f => r[f.key]).filter(v => v && v.trim());
  return [...eventItem, ...food];
};

export const buildLine = (date, items) => [fmtDate(date), ...items].join(', ');
