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

  useEffect(() => {
    muminApi.get('/mumin/takhmeen')
      .then(res => setTakhmeen(res.data?.data || []))
      .catch(() => setError('Failed to load dues data.'))
      .finally(() => setLoading(false));
  }, []);

  const handlePay = async (row) => {
    const amount      = Number(row.Remaining || row.TotalRemaining);
    const productInfo = `JMS Due: ${row.HubSubHead || row.HubMainHead} ${row.ForYear || ''}`.trim();

    try {
      const res = await muminApi.post('/mumin/payment/create-order', {
        amount,
        productInfo,
        hubMainHead: row.HubMainHead || '',
        hubSubHead:  row.HubSubHead  || '',
        forYear:     row.ForYear     || '',
      });
      const { payuUrl, payuParams } = res.data;
      setPayuData({ payuUrl, payuParams });
    } catch {
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
            <DueCard key={`${row.HubSubHead}-${row.ForYear}`} row={row} onPay={handlePay} />
          ))}
        </div>
      )}

      {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>}

      {/* Tabs: Due only / All entries */}
      <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
        {[
          { key: 'dues',    label: 'Dues Only' },
          { key: 'all',     label: 'All Entries' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setTablePage(0); }}
            className={`flex-1 py-2 text-[12px] font-medium transition-colors ${
              tab === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'
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
    </div>
  );
}
