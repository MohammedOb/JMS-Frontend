'use client';

import { useEffect, useState } from 'react';
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

const CHECKOUT_SECONDS = 300;         // 5 min session
const UTR_REVEAL_AFTER = 180;         // show manual fallback after 3 min

export default function DuesPage() {
  const [takhmeen, setTakhmeen] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [tab, setTab]           = useState('dues');
  const [tablePage, setTablePage] = useState(0);
  const TABLE_PAGE_SIZE = 10;

  // ── Amount confirmation sheet ─────────────────────────────────────────────
  const [confirmRow,    setConfirmRow]    = useState(null);  // row being paid
  const [confirmAmount, setConfirmAmount] = useState('');    // editable amount
  const [paying,        setPaying]        = useState(false);

  // ── UPI checkout sheet ────────────────────────────────────────────────────
  const [upiCheckout,  setUpiCheckout]  = useState(null);  // { upiLink, txnid, amount, label }
  const [qrDataUrl,    setQrDataUrl]    = useState('');
  const [secondsLeft,  setSecondsLeft]  = useState(CHECKOUT_SECONDS);
  const [confirming,   setConfirming]   = useState(false);  // intent result being verified
  const [utrValue,     setUtrValue]     = useState('');
  const [utrSubmitted, setUtrSubmitted] = useState(false);
  const [utrSending,   setUtrSending]   = useState(false);
  const [utrRevealed,  setUtrRevealed]  = useState(false);  // user tapped "Already paid?"

  const isInApp = typeof window !== 'undefined' && !!window.ReactNativeWebView;

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

  // Step 2: "Proceed" → create in-house UPI order and open the checkout sheet
  const handlePay = async () => {
    if (!confirmRow) return;
    const max    = Number(confirmRow.Remaining || confirmRow.TotalRemaining);
    const amount = Number(confirmAmount);
    if (!amount || amount <= 0)   { alert('Please enter a valid amount.'); return; }
    if (amount > max)             { alert(`Amount cannot exceed ₹ ${fmt(max)}.`); return; }

    const label       = `${confirmRow.HubSubHead || confirmRow.HubMainHead} ${confirmRow.ForYear || ''}`.trim();
    const productInfo = `JMS Due: ${label}`;
    setPaying(true);
    try {
      const res = await muminApi.post('/mumin/payment/create-order', {
        amount,
        productInfo,
        hubMainHead: confirmRow.HubMainHead || '',
        hubSubHead:  confirmRow.HubSubHead  || '',
        forYear:     confirmRow.ForYear     || '',
      });
      const { upiLink, txnid, amount: amtStr } = res.data;
      if (!upiLink || !amtStr) {
        // Server is still on the old gateway code (or misconfigured)
        setPaying(false);
        alert('Payment service is being updated. Please try again in a few minutes.');
        return;
      }
      setConfirmRow(null);
      setPaying(false);
      setUpiCheckout({ upiLink, txnid, amount: amtStr, label });
    } catch {
      setPaying(false);
      alert('Could not initiate payment. Please try again.');
    }
  };

  // Open the member's UPI app. New app builds handle the intent natively (and
  // report the result back); old builds and plain browsers navigate the upi://
  // link, which Android resolves to the installed-UPI-apps chooser.
  const openUpiApp = () => {
    if (!upiCheckout) return;
    if (isInApp && window.__upiIntentSupported) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'upi_intent_checkout', upiLink: upiCheckout.upiLink, txnid: upiCheckout.txnid })
      );
    } else {
      window.location.href = upiCheckout.upiLink;
    }
  };

  // Reset checkout session state + countdown whenever a checkout opens
  useEffect(() => {
    if (!upiCheckout) return;
    setSecondsLeft(CHECKOUT_SECONDS);
    setConfirming(false);
    setUtrValue('');
    setUtrSubmitted(false);
    setUtrRevealed(false);
    const t = setInterval(() => setSecondsLeft(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [upiCheckout]);

  // Poll order status — flips to the result page the moment the backend
  // confirms (native intent result or admin approval).
  useEffect(() => {
    if (!upiCheckout) return;
    const iv = setInterval(async () => {
      try {
        const res = await muminApi.get(`/mumin/payment/status/${upiCheckout.txnid}`);
        const d = res.data?.data;
        if (d?.t && d.status !== 'pending') {
          window.location.href = `/mumin/payment/result?t=${d.t}`;
        }
      } catch {}
    }, 3000);
    return () => clearInterval(iv);
  }, [upiCheckout]);

  // QR code for browser/desktop users (pointless inside the app WebView)
  useEffect(() => {
    if (!upiCheckout || isInApp) { setQrDataUrl(''); return; }
    let alive = true;
    import('qrcode')
      .then(QR => QR.toDataURL(upiCheckout.upiLink, { width: 220, margin: 1 }))
      .then(url => { if (alive) setQrDataUrl(url); })
      .catch(() => {});
    return () => { alive = false; };
  }, [upiCheckout, isInApp]);

  // Receive the native UPI intent result injected by the RN app
  useEffect(() => {
    if (!upiCheckout || typeof window === 'undefined') return;
    window.__onUpiIntentResult = async (result) => {
      if (!result || result.txnid !== upiCheckout.txnid) return;
      setConfirming(true);
      try {
        const res = await muminApi.post('/mumin/payment/upi-intent-result', result);
        const { t } = res.data || {};
        if (t) { window.location.href = `/mumin/payment/result?t=${t}`; return; }
      } catch {}
      setConfirming(false); // pending/unknown — polling + UTR fallback take over
    };
    return () => { delete window.__onUpiIntentResult; };
  }, [upiCheckout]);

  const submitUtr = async () => {
    if (!upiCheckout || !utrValue.trim()) return;
    setUtrSending(true);
    try {
      await muminApi.post('/mumin/payment/submit-utr', { txnid: upiCheckout.txnid, utr: utrValue.trim() });
      setUtrSubmitted(true);
    } catch (e) {
      alert(e.response?.data?.message || 'Could not submit reference number.');
    } finally {
      setUtrSending(false);
    }
  };

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
                {paying ? 'Please wait…' : `Pay ₹ ${fmt(Number(confirmAmount) || 0)}`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── UPI checkout sheet ─────────────────────────────────────────────── */}
      {upiCheckout && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl pt-5 px-5 pb-24 space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ maxWidth: 512, margin: '0 auto' }}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto -mt-1" />

            {/* Order summary */}
            <div className="text-center">
              <div className="text-[12px] text-gray-500">{upiCheckout.label}</div>
              <div className="text-[26px] font-bold text-gray-900 mt-0.5">₹ {fmt(upiCheckout.amount)}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Txn: {upiCheckout.txnid}</div>
            </div>

            {confirming ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-[13px] font-semibold text-gray-700">Confirming your payment…</div>
              </div>
            ) : (
              <>
                {/* Pay button */}
                <button
                  onClick={openUpiApp}
                  disabled={secondsLeft === 0}
                  className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-[15px] font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Pay via UPI App
                </button>
                <div className="text-[11px] text-gray-400 text-center -mt-2">
                  GPay · PhonePe · Paytm · any UPI app
                </div>

                {/* QR for browser/desktop */}
                {qrDataUrl && (
                  <div className="flex flex-col items-center gap-1.5 pt-1">
                    <div className="text-[11px] text-gray-400 font-medium">OR scan with any UPI app</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="UPI QR code" className="w-[180px] h-[180px] border border-gray-200 rounded-xl" />
                  </div>
                )}

                {/* Waiting / countdown */}
                <div className="flex items-center justify-center gap-2 text-[12px] text-gray-500">
                  {secondsLeft > 0 ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      Waiting for payment confirmation…
                      <span className="font-semibold text-gray-700">
                        {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                      </span>
                    </>
                  ) : (
                    <span className="text-amber-600 font-medium">
                      Session expired — if you already paid, submit your UPI reference below.
                    </span>
                  )}
                </div>

                {/* "Already paid?" — lets browser users reach the UTR fallback right away
                    (browsers get no automatic confirmation; only the app does) */}
                {!utrRevealed && secondsLeft > CHECKOUT_SECONDS - UTR_REVEAL_AFTER && (
                  <button
                    onClick={() => setUtrRevealed(true)}
                    className="w-full text-center text-[12px] text-blue-600 font-medium underline underline-offset-2"
                  >
                    Already paid? Confirm with your UPI reference number
                  </button>
                )}

                {/* Manual fallback — via "Already paid?" or auto-reveal after 3 min */}
                {(utrRevealed || secondsLeft <= CHECKOUT_SECONDS - UTR_REVEAL_AFTER) && (
                  utrSubmitted ? (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center text-[12px] text-blue-700">
                      Reference number submitted. Your payment will be verified and the
                      receipt generated shortly — you can safely close this page.
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                      <div className="text-[12px] font-semibold text-gray-700">
                        Trouble confirming? Enter your UPI reference number (UTR)
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Find it in your UPI app under this transaction's details.
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={22}
                          placeholder="e.g. 415012345678"
                          className="flex-1 px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none"
                          value={utrValue}
                          onChange={e => setUtrValue(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
                          disabled={utrSending}
                        />
                        <button
                          onClick={submitUtr}
                          disabled={utrSending || utrValue.trim().length < 10}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold transition-colors disabled:opacity-50"
                        >
                          {utrSending ? '…' : 'Submit'}
                        </button>
                      </div>
                    </div>
                  )
                )}
              </>
            )}

            <button
              onClick={() => setUpiCheckout(null)}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}
