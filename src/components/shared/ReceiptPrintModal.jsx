'use client';

import { useState } from 'react';
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
          remark={slipProps.refNo}
          status={rcpt.status}
        />
      </div>
    </div>
  );
}

const SIZE_OPTIONS = [
  { value: 'A5',  label: 'A5',     hint: '2 pages' },
  { value: 'A4',  label: 'A4',     hint: '1 page'  },
  { value: 'LT',  label: 'Letter', hint: '1 page'  },
  { value: 'LG',  label: 'Legal',  hint: '1 page'  },
];

/**
 * Modal that shows a print preview and triggers window.print().
 *
 * Paper size toggle in footer:
 *   A5        → A5 landscape, receipt page 1 + annexure page 2
 *   A4/Letter/Legal → portrait, receipt top-half + annexure bottom-half on 1 page
 */
export default function ReceiptPrintModal({ open, onClose, printData }) {
  const [paperSize, setPaperSize] = useState('A5');

  if (!open || !printData) return null;

  const { receipts = [], profile, date, mode, refNo, createdBy, contributionType } = printData;
  const slipProps = { profile, date, mode, refNo, createdBy, contributionType };

  const slipList = receipts.map((rcpt, i) => (
    <ReceiptWithAnnexure key={i} rcpt={rcpt} slipProps={slipProps} index={i} total={receipts.length} />
  ));

  const isA5 = paperSize === 'A5';

  // @page size string per selection
  const pageSize = { A5: 'A5 landscape', A4: 'A4 portrait', LT: '215.9mm 279.4mm portrait', LG: '215.9mm 355.6mm portrait' }[paperSize];

  // Usable height of non-A5 pages minus padding (A4=297mm, Letter≈279mm, Legal≈356mm)
  const pageH  = { A4: 297, LT: 279.4, LG: 355.6 }[paperSize] ?? 297;
  const receiptH = 148; // always 148mm — matches A5 landscape height
  const annexH   = pageH - receiptH;  // remaining height for annexure

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '10px 16px', borderTop: '1px solid #e5e7eb' }}>

            {/* Paper size selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>Paper:</span>
              <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden' }}>
                {SIZE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPaperSize(opt.value)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 500,
                      border: 'none',
                      borderRight: opt.value !== 'LG' ? '1px solid #d1d5db' : 'none',
                      cursor: 'pointer',
                      background: paperSize === opt.value ? '#1e3a5f' : '#fff',
                      color:      paperSize === opt.value ? '#fff'    : '#374151',
                      transition: 'background 0.15s',
                    }}
                    title={`${opt.label} — prints in ${opt.hint}`}
                  >
                    {opt.label}
                    <span style={{ fontSize: '9px', opacity: 0.75, marginLeft: '3px' }}>({opt.hint})</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
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

        @page { size: ${pageSize}; margin: 0; }
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

          /* ── Receipt slip — always 148mm tall (= A5 landscape height) ────── */
          #receipt-print-area .receipt-page-wrapper {
            width: 210mm;
            height: ${receiptH}mm;
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

          ${isA5 ? `
          /* ── A5: annexure on its own page ─────────────────────────────────── */
          #receipt-print-area .annexure-wrapper {
            page-break-before: always;
            padding: 8mm;
            box-sizing: border-box;
            margin-top: 0 !important;
          }
          ` : `
          /* ── A4/Letter/Legal: annexure immediately below receipt (1 page) ── */
          #receipt-print-area .annexure-wrapper {
            padding: 0 8mm 4mm;
            box-sizing: border-box;
            margin-top: 0 !important;
            max-height: ${annexH - 4}mm;
            overflow: hidden;
          }
          /* Each receipt+annexure pair gets a page break when printing multiples */
          #receipt-print-area .receipt-pair {
            page-break-after: always;
          }
          #receipt-print-area .receipt-pair:last-child {
            page-break-after: avoid;
          }
          `}
        }
      `}</style>
    </>
  );
}
