// Shared constants and helpers used by both ReceiptSlip and AnnexureSlip.

export const FUND_URDU = {
  'Sabeel Regular':    'سبیل الخیر والبرکات',
  'Sabeel Mutaveteen': 'سبیل الخیر والبرکات',
  // 'Sabeel':            'سبیل الخیر والبرکات',
  // 'FMB Regular':       'فطرہ معبودین بوہرہ',
  // 'FMB Half Thaali':   'فطرہ معبودین بوہرہ',
  // 'FMB':               'فطرہ معبودین بوہرہ',
  // 'Vajebaat':          'واجبات',
  // 'Vajebaat House':    'واجبات',
  // 'HIM':               'حسین انسپائرنگ ملینز',
  // 'Shehrullah Niyaz':  'شہراللہ نیاز',
  // 'Sila Fitra':        'صلہ فطرہ',
  // 'Taherabad Safar':   'طاہرآباد سفر',
  // 'General':           'عام چندہ',
};

// Payment modes that need a reference number displayed on the slip.
export const NON_CASH = ['cheque', 'online', 'upi', 'bank', 'neft', 'rtgs', 'imps'];

/** Format a number using Indian locale (e.g. 1,00,000). */
export function fmt(n) {
  return n != null ? Number(n).toLocaleString('en-IN') : '0';
}

/** Format an ISO date string as DD-MM-YYYY. */
export function fmtDate(str) {
  if (!str) return '';
  try {
    const d = new Date(str);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${d.getFullYear()}`;
  } catch { return str; }
}

/** Convert a numeric amount to English words (Indian system). */
export function amountInWords(num) {
  if (!num || isNaN(num)) return '';
  const n = Math.floor(Number(num));
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

  function toWords(x) {
    if (x === 0) return '';
    if (x < 20)  return ones[x];
    if (x < 100) return tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : '');
    if (x < 1000)     return ones[Math.floor(x / 100)]    + ' Hundred'  + (x % 100    ? ' ' + toWords(x % 100)    : '');
    if (x < 100000)   return toWords(Math.floor(x / 1000))   + ' Thousand' + (x % 1000   ? ' ' + toWords(x % 1000)   : '');
    if (x < 10000000) return toWords(Math.floor(x / 100000)) + ' Lakh'     + (x % 100000 ? ' ' + toWords(x % 100000) : '');
    return toWords(Math.floor(x / 10000000)) + ' Crore' + (x % 10000000 ? ' ' + toWords(x % 10000000) : '');
  }

  return n === 0 ? 'Rupees Zero Only' : 'Rupees ' + toWords(n) + ' Only';
}
