// Hijri conversion anchor: 15 Jun 2026 = 1 Muharram 1448
const HIJRI_ANCHOR = { gYear: 2026, gMonth: 6, gDay: 15, hYear: 1448, hMonth: 1, hDay: 1 };

export const HIJRI_MONTH_NAMES = [
  'Moharram', 'Safar', 'Rabi ul Awwal', 'Rabi ul Akhar',
  'Jamadil Awwal', 'Jamadil Akhar', 'Rajab', 'Shabaan',
  'Ramazan', 'Shawwal', 'Zilqad', 'Zilhajj',
];

const ARABIC_MONTH_NAMES = [
  'محرم', 'صفر', 'ربيع الاول', 'ربيع الاخر',
  'جمادى الاولى', 'جمادى الاخرى', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذي القعدة', 'ذي الحجة',
];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Raw Julian-day → Islamic date ─────────────────────────────────────────────
function islamicRaw(sourceDate, adj = 0) {
  const s = new Date(sourceDate.getFullYear(), sourceDate.getMonth(), sourceDate.getDate() + adj);
  let [day, m, y] = [s.getDate(), s.getMonth() + 1, s.getFullYear()];
  if (m < 3) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = y >= 1583 ? 2 - a + Math.floor(a / 4) : 0;
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;
  let z = jd - 1948084;
  const cyc = Math.floor(z / 10631); z -= 10631 * cyc;
  const j = Math.floor((z - 8.01 / 60) / (10631 / 30));
  z -= Math.floor(j * (10631 / 30) + 8.01 / 60);
  let im = Math.floor((z + 28.5001) / 29.5);
  if (im === 13) im = 12;
  return { day: z - Math.floor(29.5001 * im - 29), month: im - 1, year: 30 * cyc + j };
}

// ── Calibration shift (computed once) ─────────────────────────────────────────
let _adj = null;
function calibration() {
  if (_adj !== null) return _adj;
  const anc = new Date(HIJRI_ANCHOR.gYear, HIJRI_ANCHOR.gMonth - 1, HIJRI_ANCHOR.gDay);
  for (let s = -60; s <= 60; s++) {
    const p = islamicRaw(anc, s);
    if (p.day === HIJRI_ANCHOR.hDay && p.month === HIJRI_ANCHOR.hMonth - 1 && p.year === HIJRI_ANCHOR.hYear)
      return (_adj = s);
  }
  return (_adj = HIJRI_ANCHOR.hDay - islamicRaw(anc, 0).day);
}

function shiftFor(date) {
  const anc = new Date(HIJRI_ANCHOR.gYear, HIJRI_ANCHOR.gMonth - 1, HIJRI_ANCHOR.gDay);
  return date < anc ? calibration() - 1 : calibration();
}

// ── Public API ────────────────────────────────────────────────────────────────
export function getHijriParts(date) {
  return islamicRaw(date, shiftFor(date));
}

/** "11 Zilqad 1447" */
export function getHijriLabel(date) {
  const p = getHijriParts(date);
  return `${p.day} ${HIJRI_MONTH_NAMES[p.month]} ${p.year}`;
}

/** Arabic format string stored in DB: "1447-ذي الحجة-30" */
export function toHijriString(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  const date = new Date(y, m - 1, d);
  const h = islamicRaw(date, shiftFor(date));
  return `${h.year} - ${ARABIC_MONTH_NAMES[h.month]} - ${h.day}`;
}

// ── Calendar grid helpers ─────────────────────────────────────────────────────
export function parseBookingDate(value) {
  if (!value) return null;
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Full ISO datetime — parse with JS engine then extract local parts to avoid UTC-offset shift
    if (trimmed.length > 10) {
      const d = new Date(trimmed);
      if (!Number.isNaN(d.getTime()))
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    const plain = trimmed.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(plain)) {
      const [yr, mo, da] = plain.split('-').map(Number);
      return new Date(yr, mo - 1, da);
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? null
    : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function buildCalendar(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return { date, key: toDateKey(date), day: date.getDate(), isCurrentMonth: date.getMonth() === month };
  });
}

export function groupBookingsByDay(bookings) {
  return bookings.reduce((acc, b) => {
    const date = parseBookingDate(b.date);
    if (!date) return acc;
    const key = toDateKey(date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});
}

export const EMPTY_EVENT_FORM = {
  date: '', hijriDate: '', eventName: '', accNo: '', fullName: '',
  mobile: '', mobile1: '', itsNo: '', address: '',
  venue: '', eventTime: '', thaal: '', requestBy: '',
  createdBy: '', remark: '',
  serialNo: '', requestDate: '', razaStatus: '',
  updateReason: '', updatedAt: '', reasonForUpdate: '',
};
