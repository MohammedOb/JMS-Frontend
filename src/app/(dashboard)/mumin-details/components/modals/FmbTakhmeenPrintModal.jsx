'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { memberService } from '@/services';

const fmt    = n => (n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—');
const ALKANZ = 'AL-KANZ, serif';

/* ── shared cell styles ────────────────────────────────────────────────── */
const BORDER  = '1.5px solid #c00';   // form outer / section borders (red in image)
const IBORDER = '1px solid #999';     // inner table borders

const TAN = { background: '#d6ccaa' };

/* ── sub-components ────────────────────────────────────────────────────── */

function LabelBox({ children, style }) {
  return (
    <div style={{
      ...TAN,
      borderLeft: IBORDER,
      padding: '5px 8px',
      direction: 'rtl', textAlign: 'right',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      ...style,
    }}>
      {children}
    </div>
  );
}

/* Right-column section: [blank  |  tan-label] */
function RightBox({ label, sub, children, minHeight = 60, flex }) {
  return (
    <div style={{ display: 'flex', borderBottom: IBORDER, minHeight, ...(flex ? { flex } : {}) }}>
      {/* Left: blank fill-in area (or content like fraction boxes) */}
      <div style={{ flex: 1, padding: '5px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
      {/* Right: tan label */}
      <LabelBox style={{ width: '35%', flexShrink: 0 }}>
        <span style={{ fontWeight: 'bold', fontSize: '18px', fontFamily: ALKANZ }}>
          {label}
        </span>
        {sub && (
          <span style={{ fontSize: '14px', marginTop: '3px' }}>{sub}</span>
        )}
      </LabelBox>
    </div>
  );
}

function FmbForm({ member, fmbTakhmeen, counts, currentYear, printDate }) {
  const { Male = 0, Female = 0, Children = 0, Total = 0 } = counts || {};
  const sector = member.sector || (member.subsector || '').split(' - ')[0];
  const subsectorName = sector  
    || (member.subsector || '').split(' - ').slice(1).join(' - ')
    || member.sector
    || '';

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif', fontSize: '11px',
      background: 'white', width: '190mm', margin: '0 auto',
    }}>
      <div style={{ border: BORDER }}>

        {/* ════ HEADER ROW ════ */}
        <div style={{ display: 'flex', borderBottom: BORDER }}>

          {/* Left: Mouze / Date */}
          <div style={{
            ...TAN,
            width: '150px', flexShrink: 0,
            borderRight: BORDER,
            padding: '6px 8px',
          }}>
            {[['Mouze :', 'Sagwara'], ['Date :', printDate]].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: '4px', alignItems: 'baseline', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{label}</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Right: Arabic title */}
          <div style={{ flex: 1, textAlign: 'center', padding: '8px 12px' }}>
            <div style={{
              fontSize: '32px', fontWeight: 'bold',
              fontFamily: ALKANZ,
              direction: 'rtl', lineHeight: 1.3,
            }}>فيض الموائد البرهانية</div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '8px', marginTop: '3px', direction: 'rtl' }}>
              <span style={{
                fontSize: '20px', fontWeight: 'bold',
                fontFamily: ALKANZ,
              }}>تخمين فارم  {currentYear}</span>
            </div>
          </div>
        </div>

        {/* ════ CONTENT: left 55% | right 45% ════ */}
        <div style={{ display: 'flex' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ width: '55%', borderRight: BORDER }}>

            {/* Takhmeen History */}
            <div style={{ borderBottom: IBORDER }}>
              <div style={{
                textAlign: 'center', fontWeight: 'bold',
                padding: '4px', borderBottom: IBORDER, fontSize: '14px',
              }}>
                Takhmeen History
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr style={{ background: '#1e3a5f', color: 'white' }}>
                    {['For Year', 'Type', 'Takhmeen', 'Remaining'].map(h => (
                      <th key={h} style={{ border: IBORDER, padding: '3px 5px', textAlign: 'center' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fmbTakhmeen.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '6px', color: '#999' }}>No FMB records</td>
                    </tr>
                  ) : fmbTakhmeen.map((t, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#f5f3ea' : 'white' }}>
                      <td style={{ border: IBORDER, padding: '3px 5px', textAlign: 'center', fontSize: '12px' }}>{t.forYear}</td>
                      <td style={{ border: IBORDER, padding: '3px 5px', fontSize: '12px' }}>{t.subHead}</td>
                      <td style={{ border: IBORDER, padding: '3px 5px', textAlign: 'right', fontSize: '12px' }}>{fmt(t.takhmeen)}</td>
                      <td style={{
                        border: IBORDER, padding: '3px 5px', textAlign: 'right',
                        color: Number(t.remaining) > 0 ? '#b91c1c' : 'inherit',
                        fontWeight: Number(t.remaining) > 0 ? 'bold' : 'normal',
                        fontSize: '12px'
                      }}>{fmt(t.remaining)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Urdu text box — rounded dashed */}
            <div style={{ padding: '8px', borderBottom: IBORDER }}>
              <div style={{
                border: '2px dashed #888',
                borderRadius: '10px',
                padding: '8px 10px',
                minHeight: '120px',
                direction: 'rtl', textAlign: 'right', fontSize: '22px',
                fontFamily: ALKANZ,
              }}>
                کئ  تاريخ  انسس  سوطط  مناسبة  سي  نياز  كرواني  نية  كيدي  :
              </div>
            </div>

            {/* Thali Size — rounded section */}
            <div style={{ padding: '8px', alignSelf: 'bottom' }}>
              <div style={{
                border: '1.5px solid #888',
                borderRadius: '10px',
                padding: '8px',
                minHeight: '75px',
              }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '6px', fontSize: '18px' }}>
                  Thali Size : {member.thaaliSize || '—'}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ background: '#1e3a5f', color: 'white' }}>
                      {['Male', 'Female', 'Children', 'Total'].map(h => (
                        <th key={h} style={{ border: IBORDER, padding: '3px 4px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {[Male, Female, Children, Total].map((v, i) => (
                        <td key={i} style={{ border: IBORDER, padding: '3px 4px' }}>{v}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

            {/* Member info box */}
            <div style={{ borderBottom: BORDER, padding: '8px 10px' }}>
              {[
                ['Name',   member.name],
                ['Acc No', member.accno],
                ['ITS No', member.itsNo || '—'],
                ['Mobile', member.mobile || '—'],
                ['Sector', subsectorName || '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '5px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'normal', minWidth: '52px', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 'normal' }}>:</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', wordBreak: 'break-word' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* نيار تخمين */}
            <RightBox label="نيار تخمين" sub={<span style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: ALKANZ }}>{currentYear}</span>} minHeight={70} />

            {/* ذبيحه */}
            <RightBox label="ذبيحه :" minHeight={58} />

            {/* جملة نيار */}
            <RightBox label="جملة نيار" minHeight={52}>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                {[' ', '1', '¾', '½', '¼'].map(n => (
                  <div key={n} style={{
                    border: '1px solid #444',
                    width: '34px', height: '30px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', fontWeight: 'bold', background: 'white',
                  }}>{n}</div>
                ))}
              </div>
            </RightBox>

            {/* ليلة القدر عرض */}
            <RightBox label="ليلة القدر عرض :" minHeight={64} flex={1} />
          </div>
        </div>

        {/* ════ DASHED DIVIDER ════ */}
        <div style={{ borderTop: BORDER }} />

        {/* ════ SIGNATURE ROW ════ */}
        <div style={{ display: 'flex' }}>
          {[
            'عرض کرنار  نى   صحيح',
            'فيض الموائد البرهانية کميتي\nنا Finance-Secretary ني صحيح',
            'عامل صاحب ني صحيح',
          ].map((label, i) => (
            <div key={i} style={{
              flex: 1,
              borderRight: i < 2 ? IBORDER : 'none',
              padding: '8px 8px 6px',
              minHeight: '150px',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              textAlign: 'center', direction: 'rtl',
            }}>
              {label.split('\n').map((line, j) => (
                <div key={j} style={{
                  fontSize: '18px',
                  fontFamily: ALKANZ,
                }}>{line}</div>
              ))}
            </div>
          ))}
        </div>

        {/* ════ BOTTOM INFO STRIP ════ */}
        <div style={{ display: 'flex', borderTop: '2px dashed #999', borderColor: 'black', padding: '6px 10px', fontSize: '10px', gap: '7px' }}>

          {/* Left: Name / Mobile / Sabeel */}
          <div style={{ flex: 1, borderRight: BORDER, padding: '10px 7px' }}>
            {[
              ['Name',   member.name],
              ['Acc No', member.accno],
              ['Mobile', member.mobile || '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '5px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'normal', minWidth: '42px', flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: 'normal' }}>:</span>
                <span style={{ fontSize: '13px', fontWeight: 'bold', wordBreak: 'break-word' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Right: FMB Takhmeen / Zabihat / Amount */}
          <div style={{ flex: 1, padding: '6px 9px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' }}>
              FMB Takhmeen : ({currentYear})
            </div>
            <div style={{ fontSize: '16px', marginBottom: '10px' }}>Zabihat :</div>
            <div style={{ fontSize: '16px' }}>Amount :</div>
          </div>
        </div>

        {/* ════ FOOTER ════ */}
        <div style={{
          borderTop: IBORDER,
          textAlign: 'center', padding: '4px 8px',
          fontSize: '11px', fontStyle: 'italic',
        }}>
          give this slip to the mumin and keep a copy for the record. 
        </div>
      </div>
    </div>
  );
}

/* ── Modal wrapper ─────────────────────────────────────────────────────── */
export default function FmbTakhmeenPrintModal({ open, onClose, member, takhmeen }) {
  const { user } = useAuth();
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    if (!open || !member?.hofIts) return;
    memberService.loadFamilyMembersCount({ HOF_ID: member.hofIts })
      .then(res => setCounts(res.data?.data?.[0] || null))
      .catch(() => setCounts(null));
  }, [open, member?.hofIts]);

  if (!open || !member) return null;

  const currentYear = user?.ForYearFMB || '';

  const fmbTakhmeen = (() => {
    const all = takhmeen
      .filter(t => (t.mainHead || '').toUpperCase() === 'FMB' || (t.subHead || '').toUpperCase().includes('FMB'))
      .filter(t => String(t.forYear) !== String(currentYear));

    const byYear = {};
    all.forEach(t => {
      const y = String(t.forYear);
      if (!byYear[y]) byYear[y] = [];
      byYear[y].push(t);
    });

    const years = Object.keys(byYear).sort((a, b) => b.localeCompare(a)).slice(0, 3);
    return years.flatMap(y => {
      const records = byYear[y];
      const regular = records.filter(t => (t.subHead || '').toLowerCase() === 'fmb regular');
      return regular.length > 0 ? regular : records;
    });
  })();
  const printDate   = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

  const formProps = { member, fmbTakhmeen, counts, currentYear, printDate };

  return (
    <>
      {/* ── Screen modal UI ── */}
      <div className="fmb-print-modal-ui" style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}>
        <div style={{
          background: '#fff', borderRadius: '10px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
          width: '100%', maxWidth: '880px',
          display: 'flex', flexDirection: 'column', maxHeight: '92vh',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px',
            background: '#1e3a5f', borderRadius: '10px 10px 0 0',
          }}>
            <span style={{ fontWeight: 600, fontSize: '15px', color: 'white' }}>
              FMB Takhmeen Form — {member.name}
            </span>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
              fontSize: '16px', color: 'white', borderRadius: '4px', padding: '3px 9px',
            }}>✕</button>
          </div>

          {/* Preview */}
          <div style={{
            overflowY: 'auto', flex: '1 1 auto',
            maxHeight: 'calc(92vh - 110px)',
            padding: '16px', background: '#f3f4f6',
          }}>
            <FmbForm {...formProps} />
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '8px',
            padding: '10px 16px', borderTop: '1px solid #e5e7eb', flexShrink: 0,
          }}>
            <button onClick={onClose} style={{
              padding: '7px 20px', borderRadius: '6px',
              border: '1px solid #d1d5db', background: '#fff',
              cursor: 'pointer', fontSize: '13px', fontWeight: 500,
            }}>Close</button>
            <button onClick={() => window.print()} style={{
              padding: '7px 20px', borderRadius: '6px', border: 'none',
              background: '#1e3a5f', color: '#fff',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>🖨 Print</button>
          </div>
        </div>
      </div>

      {/* ── Print-only area ── */}
      <div id="fmb-tak-print-area">
        <FmbForm {...formProps} />
      </div>

      <style>{`
        @font-face {
          font-family: 'AL-KANZ';
          src: url('/fonts/AL-KANZ.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        @page { size: A4 portrait; margin: 8mm; }
        #fmb-tak-print-area { display: none; }

        @media print {
          .fmb-print-modal-ui { display: none !important; }
          html, body { background: white !important; }
          body * { visibility: hidden !important; }
          #fmb-tak-print-area {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            top: 0; left: 0;
            width: 100%;
            background: white !important;
            z-index: 999999;
          }
          #fmb-tak-print-area * { visibility: visible !important; }
        }
      `}</style>
    </>
  );
}
