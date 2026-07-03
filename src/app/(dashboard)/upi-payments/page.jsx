'use client';
import PermissionGuard from '@/components/shared/PermissionGuard';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import PageHeader from '@/components/shared/PageHeader';
import toast from 'react-hot-toast';

function fmt(n) {
  return n != null ? Number(n).toLocaleString('en-IN') : '0';
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function UpiPaymentsPage() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(''); // txn_id currently being processed

  const load = () => {
    setLoading(true);
    api.get('/payment/upi/pending')
      .then(res => setRows(res.data?.data || []))
      .catch(() => toast.error('Failed to load pending payments.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const approve = async (row) => {
    if (!window.confirm(
      `Approve ₹ ${fmt(row.amount)} from ${row.FullName || row.accno} (UTR: ${row.utr})?\n\n` +
      'Only approve after verifying this UTR against the bank statement. ' +
      'A receipt will be generated and dues updated.'
    )) return;
    setBusy(row.txn_id);
    try {
      const res = await api.post(`/payment/upi/approve/${row.txn_id}`);
      toast.success(`Approved — Receipt ${res.data?.receiptNo || 'generated'}.`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Approval failed.');
    } finally {
      setBusy('');
    }
  };

  const reject = async (row) => {
    if (!window.confirm(
      `Reject this payment claim of ₹ ${fmt(row.amount)} from ${row.FullName || row.accno}?\n\n` +
      'Use this when no matching credit is found in the bank statement.'
    )) return;
    setBusy(row.txn_id);
    try {
      await api.post(`/payment/upi/reject/${row.txn_id}`);
      toast.success('Payment claim rejected.');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Reject failed.');
    } finally {
      setBusy('');
    }
  };

  return (
    <PermissionGuard permission="receipts.edit">
      <PageHeader
        title="UPI Payment Approvals"
        subtitle="Member-submitted UPI reference numbers awaiting verification against the bank statement"
      />

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-[13px] text-gray-400">
            No pending UPI payments to verify.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-[11px] font-semibold text-gray-500">Submitted</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-gray-500">Acc No</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-gray-500">Member</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-gray-500">Fund / Year</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-gray-500 text-right">Amount</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-gray-500">UTR / Ref No</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-gray-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.txn_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-[12px] text-gray-500 whitespace-nowrap">{fmtDate(row.created_at)}</td>
                    <td className="px-3 py-2 text-[12px] text-gray-700">{row.accno}</td>
                    <td className="px-3 py-2 text-[12px] text-gray-700">{row.FullName || '—'}</td>
                    <td className="px-3 py-2 text-[12px] text-gray-700">
                      {row.hub_sub_head || row.hub_main_head}
                      {row.for_year && <span className="text-gray-400"> · {row.for_year}</span>}
                    </td>
                    <td className="px-3 py-2 text-[12px] text-right font-semibold text-gray-900">₹ {fmt(row.amount)}</td>
                    <td className="px-3 py-2 text-[12px] font-mono text-gray-700">{row.utr}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <button
                        onClick={() => approve(row)}
                        disabled={busy === row.txn_id}
                        className="px-3 py-1.5 mr-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => reject(row)}
                        disabled={busy === row.txn_id}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-semibold transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
