'use client';

import { amountInWords, fmt, fmtDate } from '@/utils/receiptUtils';

// ── Font-size knob ───────────────────────────────────────────────────────────
const EN = 15;   // px – body font size  (original: 12 px)
// ─────────────────────────────────────────────────────────────────────────────

// Derived sizes (proportional to originals, scaled by EN above)
const enSmall = `${Math.round(11 * EN / 12)}px`;   // was 11
const enBase  = `${EN}px`;                           // was 12
const enTitle = `${Math.round(13 * EN / 12)}px`;    // was 13

const LBL  = { fontWeight: 700, fontSize: enSmall, color: '#000', whiteSpace: 'nowrap' };
const VAL  = { fontSize: enBase, paddingLeft: '3px' };
const CELL = { padding: '4px 10px', verticalAlign: 'top' };

function Row({ label, value }) {
  return (
    <td style={CELL}>
      <span style={LBL}>{label}:</span>
      <span style={VAL}>{value || '—'}</span>
    </td>
  );
}

/**
 * Annexure slip — the detailed breakdown printed on the page after each receipt slip.
 *
 * Props:
 *   rcpt    – receipt object (receiptNo, amount, items, …)
 *   profile – member profile (accno, fullName, itsNo, mobile, sector)
 *   date    – receipt date string
 *   remark  – free-text remark / reference number
 *   status  – receipt status (used for the CANCELLED watermark)
 */
export default function AnnexureSlip({ rcpt, profile, date, remark, status }) {
  const isCancelled = ['cancelled', 'cancel receipt', 'cancel'].includes((status || '').toLowerCase());
  const { accno, receiptNo, amount, items = [] } = rcpt;
  const totalAmt = items.length > 0
    ? items.reduce((s, it) => s + Number(it.amount || 0), 0)
    : Number(amount || 0);

  return (
    <div style={{
      border: '1.5px solid #000',
      fontFamily: '"Times New Roman", Georgia, serif',
      color: '#000',
      background: '#fff',
      position: 'relative',
    }}>

      {/* Cancelled watermark */}
      {isCancelled && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 10,
        }}>
          <span style={{
            fontSize: '80px', fontWeight: 'bold',
            color: 'rgba(220,38,38,0.18)',
            transform: 'rotate(-35deg)',
            whiteSpace: 'nowrap', userSelect: 'none', letterSpacing: '4px',
          }}>CANCELLED</span>
        </div>
      )}

      {/* Title */}
      <div style={{ borderBottom: '1.5px solid #000', padding: '5px 14px', textAlign: 'center', background: '#f0f0f0' }}>
        <span style={{ fontWeight: 'bold', fontSize: enTitle, letterSpacing: '1px' }}>Receipt Details</span>
      </div>

      {/* Header details */}
      <div style={{ borderBottom: '1px solid #ccc' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: enBase }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <Row label="Receipt No"    value={receiptNo} />
              <Row label="Received Date" value={fmtDate(date)} />
              <td style={CELL} /><td style={CELL} />
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <Row label="Acc No"    value={profile?.accno || accno} />
              <Row label="Full Name" value={profile?.fullName} />
              <td style={CELL} /><td style={CELL} />
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <Row label="ITS No" value={profile?.itsNo} />
              <Row label="Mobile" value={profile?.mobile} />
              <Row label="Sector" value={profile?.sector} />
              <td style={CELL} />
            </tr>
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

      {/* Items grid */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: enBase }}>
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
            <td colSpan={3} style={{ border: '1px solid #ccc', padding: '5px 10px', fontStyle: 'italic', fontWeight: 'normal', fontSize: enSmall, color: '#000' }}>
              {amountInWords(totalAmt)}
            </td>
            <td style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'right' }}>₹ {fmt(totalAmt)}</td>
          </tr>
        </tfoot>
      </table>

    </div>
  );
}
