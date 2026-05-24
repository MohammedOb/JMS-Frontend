'use client';

import { amountInWords, fmt, fmtDate, FUND_URDU, NON_CASH } from '@/utils/receiptUtils';

// Underlined input-style span used throughout the slip.
function Dotted({ children, minW = '80px', bold = false, dir = 'ltr', align = 'center' }) {
  return (
    <span style={{
      borderBottom: '1px dotted #000',
      minWidth: minW,
      display: 'inline-block',
      textAlign: align,
      fontWeight: bold ? 'bold' : 'normal',
      direction: dir,
    }}>
      {children}
    </span>
  );
}

/**
 * Single receipt slip (the Urdu/Arabic-style printable template).
 *
 * Props:
 *   rcpt             – receipt object (receiptNo, amount, items, status, …)
 *   profile          – member profile (fullName, itsNo, accno, address, …)
 *   date             – receipt date string
 *   mode             – payment mode (Cash / Cheque / Online …)
 *   refNo            – cheque / reference number
 *   createdBy        – name of the staff member who created the receipt
 *   contributionType – e.g. "VOLUNTARY CONTRIBUTION", "CORPUS FUND"
 *   index / total    – position in a multi-receipt batch (controls page breaks)
 */
export default function ReceiptSlip({ rcpt, profile, date, mode, refNo, createdBy, contributionType, index, total }) {
  const { accno, receiptNo, familyMemberName, amount, items = [], status, isCashMemo } = rcpt;
  const isCancelled = ['cancelled', 'cancel receipt', 'cancel'].includes((status || '').toLowerCase());

  const subHead  = items[0]?.hubSubHead || items[0]?.hubType || '';
  const fundUrdu = FUND_URDU[subHead] || subHead;

  const memberName = familyMemberName || profile?.fullName || '—';
  const address    = profile?.address || profile?.mohalla || profile?.sector || '';

  // contributionType from the API is the source of truth.
  // Fund lookup is only used as a fallback when no explicit type is set.
  const ct          = (contributionType || '').toUpperCase();
  const isVoluntary = ct.includes('VOLUNTARY');
  const isCorpus    = !isVoluntary && ct.includes('CORPUS');
  // Show Sabeel/fund Urdu text only when the API gave no recognised contribution type
  const knownFund   = !isVoluntary && !isCorpus && Boolean(FUND_URDU[subHead]);
  const contribLabel = contributionType || 'VOLUNTARY CONTRIBUTION';
  const corpusLabel  = contributionType || 'CORPUS FUND';

  const showRefNo = NON_CASH.includes((mode || '').toLowerCase());
  const refLabel  = (mode || '').toLowerCase() === 'cheque' ? 'Chq No' : 'Ref No';

  const arabicFont = '"AL-KANZ", "Traditional Arabic", serif';

  return (
    <div className="receipt-slip" style={{ pageBreakAfter: index < total - 1 ? 'always' : 'auto' }}>
      <div style={{
        border: '2px solid #000',
        fontFamily: '"Times New Roman", Georgia, serif',
        fontSize: '13px',
        lineHeight: 1.6,
        maxWidth: '700px',
        margin: '0 auto',
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

        {/* Header */}
        <div style={{ borderBottom: '1.5px solid #000', padding: '6px 14px', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '15px', letterSpacing: '0.2px' }}>
            SHIA DAWOODI BOHRA JAMAAT MASJID &amp; DARUL EMARAT, SAGWARA
          </div>
          <div style={{ fontSize: '13px', marginTop: '2px' }}>Waqf Reg. No. 21 (Dungarpur)</div>
          <div style={{ fontSize: '13px' }}>Managed by : Anjuman-e-Saifee</div>
        </div>

        {/* Body */}
        <div style={{ padding: '8px 14px' }}>

          {/* Row 1: رسید نمبر (right) | CASH MEMO center | تاریخ (left) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'rtl', marginBottom: '4px' }}>
            <div>
              <span style={{ fontFamily: arabicFont }}>رسيد نمبر :</span>&nbsp;
              <Dotted minW="60px" bold>{receiptNo || ''}</Dotted>
            </div>
            {isCashMemo && (
              <div style={{ direction: 'ltr', color: '#dc2626', fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>
                CASH MEMO
              </div>
            )}
            <div>
              <span style={{ fontFamily: arabicFont }}>تاريخ :</span>&nbsp;
              <Dotted minW="90px">{fmtDate(date)}</Dotted>
            </div>
          </div>

          {/* Row 2: نام */}
          <div style={{ direction: 'rtl', display: 'flex', gap: '6px', alignItems: 'baseline', marginBottom: '4px' }}>
            <span style={{ whiteSpace: 'nowrap', fontFamily: arabicFont }}>نام :</span>
            <Dotted minW="0" bold dir="ltr">
              <span style={{ display: 'block', width: '100%', minWidth: '180px' }}>{memberName}</span>
            </Dotted>
            <span style={{ whiteSpace: 'nowrap', fontSize: '12px', fontFamily: arabicFont }}>(حفظه الله تعلى)</span>
          </div>

          {/* Row 3: ITS No | سبل نمبر */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
            <div>
              ITS No :&nbsp;
              <Dotted minW="110px" align="left">{profile?.itsNo || ''}</Dotted>
            </div>
            <div style={{ direction: 'rtl' }}>
              <span style={{ fontFamily: arabicFont }}>سبل نمبر :</span>&nbsp;
              <Dotted minW="60px" bold>{profile?.accno || accno || ''}</Dotted>
            </div>
          </div>

          {/* Address */}
          <div style={{ marginBottom: '8px' }}>
            Address :&nbsp;
            <Dotted minW="220px" align="left">{address}</Dotted>
          </div>

          {/* بعد السلام الجميل */}
          <div style={{
            textAlign: 'center', fontSize: '19px',
            fontFamily: arabicFont, direction: 'rtl', margin: '6px 0',
          }}>
            بعد السلام الجميل
          </div>

          {/* Amount row */}
          <div style={{
            direction: 'rtl', display: 'flex', gap: '8px',
            alignItems: 'baseline', margin: '4px 0', flexWrap: 'wrap',
          }}>
            <span style={{ whiteSpace: 'nowrap', fontFamily: arabicFont }}>اْثث طرف سي روثثية :</span>
            <span style={{ direction: 'ltr', fontWeight: 'bold' }}><Dotted minW="20px">{fmt(amount)}</Dotted></span>
            <span style={{ fontFamily: arabicFont }}>انكه</span>
            <span style={{ direction: 'ltr', whiteSpace: 'nowrap' }}><Dotted minW="220px">{amountInWords(amount)}</Dotted></span>
          </div>

          {/* Fund / contribution type label — hidden for cash memo receipts */}
          {!isCashMemo && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', margin: '8px 0 4px' }}>
              {isVoluntary ? (
                <>
                  <span style={{ direction: 'rtl', fontFamily: arabicFont }}>طريقسس وصول تهيا ؛</span>
                  <span style={{ fontWeight: 'bold', direction: 'ltr' }}>&quot;{contribLabel}&quot;</span>
                </>
              ) : isCorpus ? (
                <>
                  <span style={{ direction: 'rtl', fontFamily: arabicFont }}>طريقسس وصول تهيا ؛</span>
                  <span style={{ fontWeight: 'bold', direction: 'ltr' }}>&quot;{corpusLabel}&quot;</span>
                </>
              ) : (
                <span style={{ fontWeight: 'bold', direction: 'rtl', fontFamily: arabicFont }}>
                  سبل الجيروالبركات  فند ما وصول تهيا ؛
                </span>
              )}
            </div>
          )}

        </div>

        {/* Signature row */}
        <div className="receipt-signature-row" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          padding: '4px 14px 8px',
        }}>
          <div style={{ fontSize: '11px', color: '#333' }}>
            {mode && <span>{mode}</span>}
            {showRefNo && refNo && (
              <span>&nbsp;|&nbsp;{refLabel}: <strong>{refNo}</strong></span>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: arabicFont, fontSize: '12px', direction: 'rtl' }}>
              (وصول كرنار ني صحيع) عبد سيدنا طع
            </div>
            {createdBy && (
              <div style={{ fontSize: '11px', color: '#444', marginTop: '50px' }}>{createdBy}</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
