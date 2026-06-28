'use client';

import { useEffect, useRef, useState } from 'react';
import muminApi from '@/lib/muminApi';

function fmt(n) {
  return n != null ? Number(n).toLocaleString('en-IN') : '0';
}

function DueCard({ row, onPay }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-red-800 truncate">
          {row.HubSubHead || row.HubMainHead || 'Due'}
        </div>
        {row.ForYear && <div className="text-[11px] text-red-500 mt-0.5">Year: {row.ForYear}</div>}
        <div className="text-[11px] text-red-500">{row.HubMainHead}</div>
        <div className="text-[18px] font-bold text-red-700 mt-1">
          ₹ {fmt(row.Remaining || row.TotalRemaining)}
        </div>
      </div>
      <button
        onClick={() => onPay(row)}
        className="flex-shrink-0 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-[12px] font-semibold rounded-lg px-4 py-2 transition-colors"
      >
        Pay Now
      </button>
    </div>
  );
}

function TakhmeenRow({ row, idx }) {
  const remaining = Number(row.Remaining || 0);
  return (
    <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
      <td className="px-3 py-2 text-[11px] text-gray-700">{row.HubSubHead}</td>
      <td className="px-3 py-2 text-[11px] text-gray-500">{row.ForYear}</td>
      <td className="px-3 py-2 text-[11px] text-right font-medium">₹ {fmt(row.Takhmeen)}</td>
      <td className="px-3 py-2 text-[11px] text-right text-green-600">₹ {fmt(row.Received)}</td>
      <td className={`px-3 py-2 text-[11px] text-right font-semibold ${remaining > 0 ? 'text-red-600' : 'text-gray-400'}`}>
        ₹ {fmt(row.Remaining)}
      </td>
    </tr>
  );
}

export default function DuesPage() {
  const [takhmeen, setTakhmeen] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [tab, setTab]           = useState('dues');
  const [tablePage, setTablePage] = useState(0);
  const TABLE_PAGE_SIZE = 10;
  const payFormRef              = useRef(null);
  const [payuData, setPayuData] = useState(null);

  // ── Amount confirmation sheet ─────────────────────────────────────────────
  const [confirmRow,    setConfirmRow]    = useState(null);  // row being paid
  const [confirmAmount, setConfirmAmount] = useState('');    // editable amount
  const [paying,        setPaying]        = useState(false);

  useEffect(() => {
    muminApi.get('/mumin/takhmeen')
      .then(res => setTakhmeen(res.data?.data || []))
      .catch(() => setError('Failed to load dues data.'))
      .finally(() => setLoading(false));
  }, []);

  // Step 1: "Pay Now" → open confirmation sheet with pre-filled amount
  const openConfirm = (row) => {
    setConfirmRow(row);
    setConfirmAmount(String(Number(row.Remaining || row.TotalRemaining)));
    setPaying(false);
  };

  // Step 2: "Proceed" → create order and redirect to PayU
  const handlePay = async () => {
    if (!confirmRow) return;
    const max    = Number(confirmRow.Remaining || confirmRow.TotalRemaining);
    const amount = Number(confirmAmount);
    if (!amount || amount <= 0)   { alert('Please enter a valid amount.'); return; }
    if (amount > max)             { alert(`Amount cannot exceed ₹ ${fmt(max)}.`); return; }

    const productInfo = `JMS Due: ${confirmRow.HubSubHead || confirmRow.HubMainHead} ${confirmRow.ForYear || ''}`.trim();
    setPaying(true);
    try {
      const res = await muminApi.post('/mumin/payment/create-order', {
        amount,
        productInfo,
        hubMainHead: confirmRow.HubMainHead || '',
        hubSubHead:  confirmRow.HubSubHead  || '',
        forYear:     confirmRow.ForYear     || '',
      });
      const { payuUrl, payuParams } = res.data;
      setConfirmRow(null);
      setPayuData({ payuUrl, payuParams });
    } catch {
      setPaying(false);
      alert('Could not initiate payment. Please try again.');
    }
  };

  // Auto-submit PayU form when payuData is set
  useEffect(() => {
    if (payuData && payFormRef.current) {
      payFormRef.current.submit();
    }
  }, [payuData]);

  const parseYear = y => parseInt(String(y || '0').split('-')[0], 10);
  const sorted = [...takhmeen].sort((a, b) => parseYear(b.ForYear) - parseYear(a.ForYear));

  const duesToShow = tab === 'dues'
    ? sorted.filter(r => Number(r.Remaining) > 0)
    : sorted;

  const totalTablePages = Math.ceil(duesToShow.length / TABLE_PAGE_SIZE);
  const tablePageData   = duesToShow.slice(tablePage * TABLE_PAGE_SIZE, (tablePage + 1) * TABLE_PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* PayU hidden form — auto-submitted */}
      {payuData && (
        <form ref={payFormRef} action={payuData.payuUrl} method="POST" style={{ display: 'none' }}>
          {Object.entries(payuData.payuParams).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
        </form>
      )}

      <h1 className="text-[16px] font-bold text-gray-900">Dues & Takhmeen</h1>

      {/* Total remaining for this member */}
      {takhmeen.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
          <div className="text-[18px] font-bold text-red-600">
            ₹ {fmt(takhmeen.reduce((s, r) => s + Number(r.Remaining || 0), 0))}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Total Remaining</div>
        </div>
      )}

      {/* Due amount cards (red rows) — sorted desc by ForYear */}
      {sorted.filter(r => Number(r.Remaining) > 0).length > 0 && (
        <div className="space-y-2">
          <h2 className="text-[12px] font-semibold text-red-600 uppercase tracking-wide">Pending Dues</h2>
          {sorted.filter(r => Number(r.Remaining) > 0).map((row) => (
            <DueCard key={`${row.HubSubHead}-${row.ForYear}`} row={row} onPay={openConfirm} />
          ))}
        </div>
      )}

      {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>}

      {/* Tabs: Due only / All entries */}
      <div className="flex rounded-xl overflow-hidden border border-blue-100">
        {[
          { key: 'dues', label: 'Dues Only' },
          { key: 'all',  label: 'All Entries' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setTablePage(0); }}
            className={`flex-1 py-2.5 text-[13px] font-semibold transition-colors ${
              tab === t.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Takhmeen table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-[11px] font-semibold text-gray-500">Fund</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-gray-500">Year</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-gray-500 text-right">Due</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-gray-500 text-right">Paid</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-gray-500 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {duesToShow.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[12px] text-gray-400">
                    {tab === 'dues' ? 'No pending dues.' : 'No entries found.'}
                  </td>
                </tr>
              ) : (
                tablePageData.map((row, i) => <TakhmeenRow key={`${row.HubSubHead}-${row.ForYear}-${i}`} row={row} idx={i} />)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table pagination */}
      {totalTablePages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setTablePage(p => Math.max(0, p - 1))}
            disabled={tablePage === 0}
            className="px-3 py-1.5 text-[12px] font-medium rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-[12px] text-gray-500">
            Page {tablePage + 1} of {totalTablePages}
          </span>
          <button
            onClick={() => setTablePage(p => Math.min(totalTablePages - 1, p + 1))}
            disabled={tablePage >= totalTablePages - 1}
            className="px-3 py-1.5 text-[12px] font-medium rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* ── Amount confirmation bottom sheet ───────────────────────────────── */}
      {confirmRow && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => !paying && setConfirmRow(null)}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl pt-5 px-5 pb-24 space-y-4"
            style={{ maxWidth: 512, margin: '0 auto' }}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto -mt-1" />

            {/* Due info */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <div className="text-[13px] font-semibold text-red-800">
                {confirmRow.HubSubHead || confirmRow.HubMainHead}
              </div>
              {confirmRow.ForYear && (
                <div className="text-[11px] text-red-500 mt-0.5">Year: {confirmRow.ForYear}</div>
              )}
              <div className="text-[11px] text-red-500">
                Total Due: ₹ {fmt(confirmRow.Remaining || confirmRow.TotalRemaining)}
              </div>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                Amount to Pay (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[15px] font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-full pl-8 pr-4 py-3 text-[18px] font-bold text-gray-900 border-2 border-gray-200 rounded-xl focus:border-red-400 focus:outline-none transition-colors"
                  value={confirmAmount}
                  onChange={e => {
                    const val = e.target.value;
                    const max = Number(confirmRow.Remaining || confirmRow.TotalRemaining);
                    // Allow typing freely but cap on blur / validate on submit
                    if (val === '' || Number(val) <= max) setConfirmAmount(val);
                  }}
                  onBlur={() => {
                    const max = Number(confirmRow.Remaining || confirmRow.TotalRemaining);
                    const val = Number(confirmAmount);
                    if (!val || val <= 0) setConfirmAmount(String(max));
                    else if (val > max)   setConfirmAmount(String(max));
                  }}
                  min={1}
                  max={Number(confirmRow.Remaining || confirmRow.TotalRemaining)}
                  disabled={paying}
                />
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                You can pay a partial amount. Maximum: ₹ {fmt(confirmRow.Remaining || confirmRow.TotalRemaining)}
              </div>
              {/* Quick fraction buttons */}
              {(() => {
                const max = Number(confirmRow.Remaining || confirmRow.TotalRemaining);
                return max >= 200 ? (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {[
                      { label: 'Full',  val: max },
                      { label: '½',     val: Math.floor(max / 2) },
                      { label: '¼',     val: Math.floor(max / 4) },
                    ].filter(b => b.val > 0).map(b => (
                      <button
                        key={b.label}
                        type="button"
                        disabled={paying}
                        onClick={() => setConfirmAmount(String(b.val))}
                        className={`text-[11px] px-3 py-1 rounded-full border font-medium transition-colors ${
                          Number(confirmAmount) === b.val
                            ? 'bg-red-600 text-white border-red-600'
                            : 'border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-700'
                        }`}
                      >
                        {b.label} — ₹ {fmt(b.val)}
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setConfirmRow(null)}
                disabled={paying}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handlePay}
                disabled={paying || !confirmAmount || Number(confirmAmount) <= 0}
                className="flex-[2] py-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-[13px] font-bold transition-colors disabled:opacity-50"
              >
                {paying ? 'Redirecting…' : `Pay ₹ ${fmt(Number(confirmAmount) || 0)}`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
