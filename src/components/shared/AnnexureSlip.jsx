'use client';

function fmt(n) {
  return n != null ? Number(n).toLocaleString('en-IN') : '0';
}

function fmtDate(str) {
  if (!str) return '';
  try {
    const d = new Date(str);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${d.getFullYear()}`;
  } catch { return str; }
}

function amountInWords(num) {
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

const LBL = { fontWeight: 700, fontSize: '11px', color: '#444', whiteSpace: 'nowrap' };
const VAL = { fontSize: '12px', paddingLeft: '3px' };
const CELL = { padding: '4px 10px', verticalAlign: 'top' };

function Row({ label, value }) {
  return (
    <td style={CELL}>
      <span style={LBL}>{label}:</span>
      <span style={VAL}>{value || '—'}</span>
    </td>
  );
}

export default function AnnexureSlip({ rcpt, profile, date, remark, status }) {
  const isCancelled = ['cancelled','cancel receipt','cancel'].includes((status || '').toLowerCase());
  const { accno, receiptNo, amount, items = [] } = rcpt;
  const totalAmt = items.length > 0
    ? items.reduce((s, it) => s + Number(it.amount || 0), 0)
    : Number(amount || 0);

  return (
    <div style={{
      border: '1.5px solid #000',
      fontFamily: '"Times New Roman", Georgia, serif',
      background: '#fff',
      position: 'relative',
    }}>

      {/* ── Cancelled watermark ─────────────────────────────────────────────── */}
      {isCancelled && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 10,
        }}>
          <span style={{
            fontSize: '80px',
            fontWeight: 'bold',
            color: 'rgba(220,38,38,0.18)',
            transform: 'rotate(-35deg)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            letterSpacing: '4px',
          }}>CANCELLED</span>
        </div>
      )}

      {/* ── Title ──────────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1.5px solid #000', padding: '5px 14px', textAlign: 'center', background: '#f0f0f0' }}>
        <span style={{ fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px' }}>ANNEXURE</span>
      </div>

      {/* ── Header details — table grid ─────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid #ccc' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <tbody>
            {/* Row 1: Receipt No | Received Date */}
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <Row label="Receipt No"    value={receiptNo} />
              <Row label="Received Date" value={fmtDate(date)} />
              <td style={CELL} /><td style={CELL} />
            </tr>
            {/* Row 2: Acc No | Full Name */}
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <Row label="Acc No"    value={profile?.accno || accno} />
              <Row label="Full Name" value={profile?.fullName} />
              <td style={CELL} /><td style={CELL} />
            </tr>
            {/* Row 3: ITS No | Mobile | Sector */}
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <Row label="ITS No"  value={profile?.itsNo} />
              <Row label="Mobile"  value={profile?.mobile} />
              <Row label="Sector"  value={profile?.sector} />
              <td style={CELL} />
            </tr>
            {/* Row 4: Remark (multiline, full width) */}
            <tr>
              <td colSpan={4} style={{ ...CELL, verticalAlign: 'top' }}>
                <span style={LBL}>Remark: </span>
                <span style={{ ...VAL, whiteSpace: 'pre-wrap', display: 'inline' }}>
                  {remark || '—'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Items grid ─────────────────────────────────────────────────────── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: '#e8e8e8' }}>
            <th style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center', width: '36px' }}>#</th>
            <th style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'left' }}>Sub Head</th>
            <th style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center', width: '80px' }}>Year</th>
            <th style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'right', width: '110px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} style={{ background: i % 2 === 1 ? '#fafafa' : '#fff' }}>
              <td style={{ border: '1px solid #ccc', padding: '4px 8px', textAlign: 'center' }}>{i + 1}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>{it.hubSubHead || it.hubType || '—'}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px 8px', textAlign: 'center' }}>{it.forYear || '—'}</td>
              <td style={{ border: '1px solid #ccc', padding: '4px 8px', textAlign: 'right' }}>₹ {fmt(it.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#e8e8e8', fontWeight: 'bold' }}>
            <td colSpan={3} style={{ border: '1px solid #ccc', padding: '5px 10px', fontStyle: 'italic', fontWeight: 'normal', fontSize: '11px', color: '#333' }}>
              {amountInWords(totalAmt)}
            </td>
            <td style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'right' }}>₹ {fmt(totalAmt)}</td>
          </tr>
        </tfoot>
      </table>

    </div>
  );
}
