'use client';

import ReceiptSlip from './ReceiptSlip';
import AnnexureSlip from './AnnexureSlip';

// One receipt + its annexure, wrapped in a pair container for page-break logic.
function ReceiptWithAnnexure({ rcpt, slipProps, index, total }) {
  return (
    <div className="receipt-pair" style={{ marginBottom: index < total - 1 ? '32px' : 0 }}>
      {total > 1 && (
        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', textAlign: 'center' }}>
          Receipt {index + 1} of {total}
        </div>
      )}
      <div className="receipt-page-wrapper">
        <ReceiptSlip
          rcpt={rcpt}
          {...slipProps}
          contributionType={rcpt.contributionType || slipProps.contributionType}
          index={index}
          total={total}
        />
      </div>
      <div className="annexure-wrapper" style={{ marginTop: '16px' }}>
        <AnnexureSlip
          rcpt={rcpt}
          profile={slipProps.profile}
          date={slipProps.date}
          mode={slipProps.mode}
          remark={slipProps.remark ?? slipProps.refNo}
          status={rcpt.status}
        />
      </div>
    </div>
  );
}

/**
 * Modal that shows a print preview and triggers window.print().
 *
 * Paper size is chosen in the browser's print dialog — no manual selection needed.
 *   A5 landscape (page height ≤ 155mm) → receipt fills page 1, annexure on page 2
 *   A4 portrait  (page height ≥ 250mm) → receipt top-half + annexure bottom-half, 1 page
 */
export default function ReceiptPrintModal({ open, onClose, printData }) {
  if (!open || !printData) return null;

  const { receipts = [], profile, date, mode, refNo, remark, createdBy, contributionType } = printData;
  const slipProps = { profile, date, mode, refNo, remark, createdBy, contributionType };

  const slipList = receipts.map((rcpt, i) => (
    <ReceiptWithAnnexure key={i} rcpt={rcpt} slipProps={slipProps} index={i} total={receipts.length} />
  ));

  return (
    <>
      {/* ── Screen: modal overlay ───────────────────────────────────────────── */}
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
          height: 'fit-content', display: 'flex', flexDirection: 'column',
        }}>

          {/* Modal header */}
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

          {/* Scrollable preview */}
          <div style={{ overflowY: 'auto', flex: '0 0 auto', maxHeight: 'calc(90vh - 115px)', padding: '16px', background: '#f3f4f6' }}>
            {slipList}
          </div>

          {/* Modal footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', padding: '10px 16px', borderTop: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af', marginRight: 'auto' }}>
              Select paper size &amp; orientation in the print dialog
            </span>
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

      {/* ── Print-only area ──────────────────────────────────────────────────── */}
      <div id="receipt-print-area">{slipList}</div>

      <style>{`
        @font-face {
          font-family: 'AL-KANZ';
          src: url('/fonts/AL-KANZ.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }

        /* Let the browser print dialog control paper size and orientation */
        @page { size: auto; margin: 0; }
        #receipt-print-area { display: none; }

        @media print {
          .receipt-modal-ui { display: none !important; }
          html, body { background: white !important; }
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

          /* Receipt slip — always 148mm tall (= A5 landscape height) */
          #receipt-print-area .receipt-page-wrapper {
            width: 100%;
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
        }

        /* ── A5 landscape: page height ≤ 155mm → annexure on its own page ─── */
        @media print and (max-height: 155mm) {
          #receipt-print-area .annexure-wrapper {
            page-break-before: always;
            padding: 8mm;
            box-sizing: border-box;
            margin-top: 0 !important;
          }
        }

        /* ── A4 portrait: page height ≥ 250mm → annexure below receipt, 1 page */
        @media print and (min-height: 250mm) {
          #receipt-print-area .annexure-wrapper {
            padding: 0 8mm 4mm;
            box-sizing: border-box;
            margin-top: 0 !important;
            max-height: 145mm;
            overflow: hidden;
          }
          #receipt-print-area .receipt-pair {
            page-break-after: always;
          }
          #receipt-print-area .receipt-pair:last-child {
            page-break-after: avoid;
          }
        }
      `}</style>
    </>
  );
}
