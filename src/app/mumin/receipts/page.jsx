'use client';

import { useEffect, useState } from 'react';
import muminApi from '@/lib/muminApi';
import { resolveApiBaseUrl } from '@/lib/api';

function fmt(n) {
  return n != null ? Number(n).toLocaleString('en-IN') : '0';
}

function fmtDate(str) {
  if (!str) return '—';
  try {
    const d  = new Date(str);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mm}-${d.getFullYear()}`;
  } catch { return str; }
}

function ReceiptCard({ receipt, onDownload }) {
  const isCancelled = ['Cancelled', 'Cancel Receipt', 'Cancel'].includes(receipt.Status);
  const status = isCancelled ? 'Cancelled' : receipt.IsCashMemo ? 'Cash Memo' : 'Receipt';

  return (
    <div className="relative bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3 overflow-hidden">
      {isCancelled && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[30px] font-black text-red-500/25 tracking-widest uppercase" style={{ transform: 'rotate(-35deg)' }}>
            CANCELLED
          </span>
        </div>
      )}
      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-semibold text-gray-900">{receipt.ReceiptNo}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
            isCancelled
              ? 'bg-red-100 text-red-600'
              : 'bg-green-100 text-green-700'
          }`}>{status}</span>
        </div>
        <div className="text-[11px] text-gray-500">{fmtDate(receipt.ReceivedDate)} · {receipt.HubSubHead}</div>
        {receipt.ForYear && <div className="text-[11px] text-gray-400">Year: {receipt.ForYear}</div>}
        <div className="text-[15px] font-bold text-gray-800 mt-1">₹ {fmt(receipt.Amount)}</div>
        {receipt.Mode && <div className="text-[11px] text-gray-400 capitalize">{receipt.Mode}</div>}
      </div>
      <button
        onClick={() => onDownload(receipt)}
        className="flex-shrink-0 flex flex-col items-center gap-0.5 text-blue-600 hover:text-blue-700 transition-colors p-1"
        title="Open PDF"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span className="text-[9px] font-medium">PDF</span>
      </button>
    </div>
  );
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    muminApi.get('/mumin/receipts')
      .then(res => {
        // Query returns one row per line item — deduplicate by receipt ID, sort newest first
        const seen = new Set();
        const unique = (res.data?.data || []).filter(r => {
          if (seen.has(r.ID)) return false;
          seen.add(r.ID);
          return true;
        }).sort((a, b) => b.ID - a.ID);
        setReceipts(unique);
      })
      .catch(() => setError('Failed to load receipts.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = (receipt) => {
    const token = localStorage.getItem('jms_mumin_token');
    const url = `${resolveApiBaseUrl()}mumin/receipts/${receipt.ID}/pdf?token=${encodeURIComponent(token)}`;

    if (window.ReactNativeWebView) {
      // Running inside the mobile app — ask native shell to open in system PDF viewer
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'open_pdf', url }));
    } else {
      // Regular browser — open in a new tab
      window.open(url, '_blank');
    }
  };

  const q = search.toLowerCase();
  const filtered = receipts.filter(r => {
    if (!search) return true;
    return (
      String(r.ReceiptNo  || '').toLowerCase().includes(q) ||
      String(r.HubSubHead || '').toLowerCase().includes(q) ||
      String(r.ForYear    || '').toLowerCase().includes(q)
    );
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-[16px] font-bold text-gray-900">Receipt History</h1>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by receipt no, fund, year..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Total summary */}
      {receipts.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-[12px] text-blue-600 font-medium">{receipts.length} receipts total</span>
          <span className="text-[14px] font-bold text-blue-700">
            ₹ {fmt(receipts.filter(r => !['Cancelled', 'Cancel Receipt', 'Cancel'].includes(r.Status)).reduce((s, r) => s + Number(r.Amount || 0), 0))}
          </span>
        </div>
      )}

      {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[13px] text-gray-400">
            {search ? 'No receipts match your search.' : 'No receipts found.'}
          </div>
        ) : (
          paginated.map(r => (
            <ReceiptCard
              key={r.ID}
              receipt={r}
              onDownload={handleDownload}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1 pb-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-[12px] text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
