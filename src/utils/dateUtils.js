// Shared date helpers
//
// Root cause of the "one day before" bug:
//   new Date('2026-06-14') parses as UTC midnight.
//   In UTC+5:30 that becomes 2026-06-13 18:30 local → displays as 13 Jun.
//   Fix: always extract y/m/d and construct with new Date(y, m-1, d) (local).

const pad2 = (n) => String(n).padStart(2, '0');

// Works for: "2026-06-14", "2026-06-14T00:00:00.000Z", JS Date objects
const toYMD = (val) => {
  if (!val) return null;
  if (val instanceof Date) {
    // Use local getters — avoids UTC-to-local shift
    return [val.getFullYear(), val.getMonth() + 1, val.getDate()];
  }
  const s = String(val).slice(0, 10); // "YYYY-MM-DD"
  const parts = s.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return parts;
};

// Parse any date value as a LOCAL date (no timezone shift)
export const parseLocalDate = (val) => {
  const ymd = toYMD(val);
  if (!ymd) return null;
  const [y, m, d] = ymd;
  return new Date(y, m - 1, d);
};

// Format for display — e.g. "14 Jun 2026"
export const fmtDate = (val, opts = { day: '2-digit', month: 'short', year: 'numeric' }) => {
  const d = parseLocalDate(val);
  return d ? d.toLocaleDateString('en-GB', opts) : '';
};

// Format for <input type="date"> → "YYYY-MM-DD"
export const toDateInput = (val) => {
  const ymd = toYMD(val);
  if (!ymd) return '';
  const [y, m, d] = ymd;
  return `${y}-${pad2(m)}-${pad2(d)}`;
};

// Current-month helpers (same pattern as safai chitthi page)
export const firstOfMonth = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`; };
export const lastOfMonth  = () => { const d = new Date(); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0); return `${last.getFullYear()}-${pad2(last.getMonth() + 1)}-${pad2(last.getDate())}`; };
