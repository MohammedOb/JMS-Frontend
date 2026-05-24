'use client';

import AnnexureSlip from './AnnexureSlip';

function amountInWords(num) {
  if (!num || isNaN(num)) return '';
  const n = Math.floor(Number(num));
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

  function toWords(x) {
    if (x === 0) return '';
    if (x < 20)  return ones[x];
    if (x < 100) return tens[Math.floor(x/10)] + (x%10 ? ' '+ones[x%10] : '');
    if (x < 1000)     return ones[Math.floor(x/100)]   + ' Hundred'  + (x%100    ? ' '+toWords(x%100)    : '');
    if (x < 100000)   return toWords(Math.floor(x/1000))   + ' Thousand' + (x%1000   ? ' '+toWords(x%1000)   : '');
    if (x < 10000000) return toWords(Math.floor(x/100000)) + ' Lakh'     + (x%100000 ? ' '+toWords(x%100000) : '');
    return toWords(Math.floor(x/10000000)) + ' Crore' + (x%10000000 ? ' '+toWords(x%10000000) : '');
  }

  return n === 0 ? 'Rupees Zero Only' : 'Rupees ' + toWords(n) + ' Only';
}

const FUND_URDU = {
  'Sabeel Regular':    'سبیل الخیر والبرکات',
  'Sabeel Mutaveteen': 'سبیل الخیر والبرکات',
  'Sabeel':            'سبیل الخیر والبرکات',
  'FMB Regular':       'فطرہ معبودین بوہرہ',
  'FMB Half Thaali':   'فطرہ معبودین بوہرہ',
  'FMB':               'فطرہ معبودین بوہرہ',
  'Vajebaat':          'واجبات',
  'Vajebaat House':    'واجبات',
  'HIM':               'حسین انسپائرنگ ملینز',
  'Shehrullah Niyaz':  'شہراللہ نیاز',
  'Sila Fitra':        'صلہ فطرہ',
  'Taherabad Safar':   'طاہرآباد سفر',
  'General':           'عام چندہ',
};

const NON_CASH = ['cheque','online','upi','bank','neft','rtgs','imps'];

function fmt(n) {
  return n != null ? Number(n).toLocaleString('en-IN') : '0';
}

function fmtDate(str) {
  if (!str) return '';
  try {
    const d = new Date(str);
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    return `${dd}-${mm}-${d.getFullYear()}`;
  } catch { return str; }
}

function Dotted({ children, minW = '80px', bold = false, dir = 'ltr' }) {
  return (
    <span style={{
      borderBottom: '1px dotted #000',
      minWidth: minW,
      display: 'inline-block',
      textAlign: 'center',
      fontWeight: bold ? 'bold' : 'normal',
      direction: dir,
    }}>
      {children}
    </span>
  );
}

function ReceiptSlip({ rcpt, profile, date, mode, refNo, createdBy, contributionType, index, total }) {
  const { accno, receiptNo, familyMemberName, amount, items = [], status } = rcpt;
  const isCancelled = ['cancelled','cancel receipt','cancel'].includes((status || '').toLowerCase());

  const subHead  = items[0]?.hubSubHead || items[0]?.hubType || '';
  const fundUrdu = FUND_URDU[subHead] || subHead;

  const memberName = familyMemberName || profile?.fullName || '—';
  const address    = profile?.address || profile?.mohalla || profile?.sector || '';

  const knownFund   = Boolean(FUND_URDU[subHead]);
  const ct          = (contributionType || '').toUpperCase();
  const isVoluntary = !knownFund && (ct.includes('VOLUNTARY') || !ct);
  const contribLabel = contributionType || (isVoluntary ? 'VOLUNTARY CONTRIBUTION' : '');
  const isCorpus = !knownFund && (ct.includes('CORPUS') || !ct);
  const corpuscontribLabel = contributionType || (isCorpus ? 'CORPUS FUND' : '');

  const showRefNo = NON_CASH.includes((mode || '').toLowerCase());
  const refLabel  = (mode || '').toLowerCase() === 'cheque' ? 'Chq No' : 'Ref No';

  const arabicFont = '"AL-KANZ", "Traditional Arabic", serif';

  return (
    <div className="receipt-slip" style={{ pageBreakAfter: index < total-1 ? 'always' : 'auto' }}>
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

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div style={{ borderBottom: '1.5px solid #000', padding: '6px 14px', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '15px', letterSpacing: '0.2px' }}>
            SHIA DAWOODI BOHRA JAMAAT MASJID &amp; DARUL EMARAT, SAGWARA
          </div>
          <div style={{ fontSize: '13px', marginTop: '2px' }}>Waqf Reg. No. 21 (Dungarpur)</div>
          <div style={{ fontSize: '13px' }}>Managed by : Anjuman-e-Saifee</div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────────── */}
        <div style={{ padding: '8px 14px' }}>

          {/* Row 1: رسید نمبر (right) | تاریخ (left) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', direction: 'rtl', marginBottom: '4px' }}>
            <div>
              <span style={{ fontFamily: arabicFont }}>رسيد نمبر :</span>&nbsp;
              <Dotted minW="60px" bold>{receiptNo || ''}</Dotted>
            </div>
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

          {/* Row 3: ITS No (left) | سبل نمبر / AccNo (right) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
            <div>
              ITS No :&nbsp;
              <Dotted minW="110px">{profile?.itsNo || ''}</Dotted>
            </div>
            <div style={{ direction: 'rtl' }}>
              <span style={{ fontFamily: arabicFont }}>سبل نمبر :</span>&nbsp;
              <Dotted minW="60px" bold>{profile?.accno || accno || ''}</Dotted>
            </div>
          </div>

          {/* Address */}
          <div style={{ marginBottom: '8px' }}>
            Address :&nbsp;
            <Dotted minW="220px">{address}</Dotted>
          </div>

          {/* بعد السلام الجميل */}
          <div style={{
            textAlign: 'center',
            fontSize: '19px',
            fontFamily: arabicFont,
            direction: 'rtl',
            margin: '6px 0',
          }}>
            بعد السلام الجميل
          </div>

          {/* Amount row */}
          <div style={{
            direction: 'rtl',
            display: 'flex',
            gap: '8px',
            alignItems: 'baseline',
            margin: '4px 0',
            flexWrap: 'wrap',
          }}>
            <span style={{ whiteSpace: 'nowrap', fontFamily: arabicFont }}>اْثث طرف سي روثثية :</span>
            <span style={{ direction: 'ltr', fontWeight: 'bold' }}><Dotted minW="20px">{fmt(amount)}</Dotted></span>
            <span style={{ fontFamily: arabicFont }}>انكه</span>
            <span style={{ direction: 'ltr', whiteSpace: 'nowrap' }}><Dotted minW="220px">{amountInWords(amount)}</Dotted></span>
          </div>


          {/* Body text: Voluntary vs Sabeel/Fund */}
          {isVoluntary ? (
            <div style={{

              display: 'flex',
              justifyContent: 'center',
              alignItems: 'baseline',
              margin: '8px 0 4px',
            }}>
              <span style={{ direction: 'rtl', fontFamily: arabicFont }}>طريقسس وصول تهيا ؛</span>

              <span style={{ fontWeight: 'bold', direction: 'ltr' }}>&quot;{contribLabel}&quot;</span>
            </div>
          ) : isCorpus ? (
            <div style={{

              display: 'flex',
              justifyContent: 'center',
              alignItems: 'baseline',
              margin: '8px 0 4px',
            }}>
              <span style={{ direction: 'rtl', fontFamily: arabicFont }}>طريقسس وصول تهيا ؛</span>

              <span style={{ fontWeight: 'bold', direction: 'ltr' }}>&quot;{corpuscontribLabel}&quot;</span>
            </div>
          ) : (
            <div style={{

              display: 'flex',
              justifyContent: 'center',
              alignItems: 'baseline',
              margin: '8px 0 4px',
            }}>
              {/* <div style={{ direction: 'rtl', margin: '6px 0 2px', lineHeight: 2, fontFamily: arabicFont, fontSize: '14px' }}> */}
                <span style={{ fontWeight: 'bold', direction: 'rtl', fontFamily: arabicFont }}>سبل الجيروالبركات  فند ما وصول تهيا ؛ </span>   
              </div>
              
            
          )}

        </div>

        {/* Signature row — direct child of bordered box so print flex can pin it to bottom */}
        <div className="receipt-signature-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '4px 14px 8px' }}>
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

// ── Public modal component ─────────────────────────────────────────────────────
export default function ReceiptPrintModal({ open, onClose, printData }) {
  if (!open || !printData) return null;

  const { receipts = [], profile, date, mode, refNo, createdBy, contributionType } = printData;
  const slipProps = { profile, date, mode, refNo, createdBy, contributionType };

  const slips = receipts.map((rcpt, i) => (
    <div key={i} style={{ marginBottom: i < receipts.length - 1 ? '32px' : 0 }}>
      {receipts.length > 1 && (
        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', textAlign: 'center' }}>
          Receipt {i + 1} of {receipts.length}
        </div>
      )}
      <div className="receipt-page-wrapper">
        <ReceiptSlip
          rcpt={rcpt}
          {...slipProps}
          contributionType={rcpt.contributionType || contributionType}
          index={i}
          total={receipts.length}
        />
      </div>
      <div className="annexure-wrapper" style={{ marginTop: '16px' }}>
        <AnnexureSlip rcpt={rcpt} profile={profile} date={date} remark={refNo} status={rcpt.status} />
      </div>
    </div>
  ));

  return (
    <>
      {/* Modal UI — hidden during print */}
      <div className="receipt-modal-ui" style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}>
        <div style={{
          background: '#fff', borderRadius: '10px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
          width: '100%', maxWidth: '760px', maxHeight: '90vh',
          height: 'fit-content',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>Receipt Preview</span>
              {receipts.length > 1 && (
                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280' }}>
                  {receipts.length} receipts
                </span>
              )}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#6b7280', lineHeight: 1 }}>
              ✕
            </button>
          </div>

          {/* Scrollable receipt preview */}
          <div style={{ overflowY: 'auto', flex: '0 0 auto', maxHeight: 'calc(90vh - 115px)', padding: '16px', background: '#f3f4f6' }}>
            {slips}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={onClose}
              style={{ padding: '7px 18px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              style={{ padding: '7px 18px', borderRadius: '6px', border: 'none', background: '#1e3a5f', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              🖨 Print
            </button>
          </div>
        </div>
      </div>

      {/* Print-only area — SIBLING of modal so print CSS can show it independently */}
      <div id="receipt-print-area">{slips}</div>

      <style>{`
        @font-face {
          font-family: 'AL-KANZ';
          src: url('/fonts/AL-KANZ.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        @page { size: A5 landscape; margin: 0; }
        #receipt-print-area { display: none; }
        @media print {
          .receipt-modal-ui { display: none !important; }
          body * { visibility: hidden !important; }
          #receipt-print-area {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            top: 0; left: 0;
            width: 100%;
            background: white !important;
            z-index: 999999;
          }
          #receipt-print-area * { visibility: visible !important; }

          /* Page 1: receipt fills one A5 landscape page */
          #receipt-print-area .receipt-page-wrapper {
            width: 210mm;
            height: 148mm;
            padding: 8mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }
          #receipt-print-area .receipt-page-wrapper .receipt-slip {
            flex: 1;
            display: flex;
            flex-direction: column;
          }
          #receipt-print-area .receipt-page-wrapper .receipt-slip > div {
            flex: 1;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            box-sizing: border-box;
            display: flex !important;
            flex-direction: column !important;
          }
          #receipt-print-area .receipt-page-wrapper .receipt-slip > div > div:nth-child(2) {
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-evenly !important;
          }
          #receipt-print-area .receipt-page-wrapper .receipt-slip > div > .receipt-signature-row {
            flex-shrink: 0 !important;
          }

          /* Page 2: annexure starts on a new page */
          #receipt-print-area .annexure-wrapper {
            page-break-before: always;
            padding: 8mm;
            box-sizing: border-box;
            margin-top: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
