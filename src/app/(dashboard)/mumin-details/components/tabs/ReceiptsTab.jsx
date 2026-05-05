'use client';

import { useState, useEffect, useMemo } from 'react';
import { EditIcon, PrintIcon } from '@/components/shared/Icons';
import { StatusBadge } from '@/components/shared/Badge';
import { fmt, fmtDate, normalizeArray } from '../../utils';
import { receiptService } from '@/services';
import toast from 'react-hot-toast';

export default function ReceiptsTab({ receipts, setReceipts, accno, permissions, onAddReceipt, onEditReceipt, onPrintReceipt }) {
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterHubType, setFilterHubType] = useState('');
  const [filterSubType, setFilterSubType] = useState('');
  const [filterForYear, setFilterForYear] = useState('');

  useEffect(() => {
    if (accno) {
      loadData();
    }
  }, [accno]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await receiptService.loadTransactionDetails({ AccNo: accno });
      const data = normalizeArray(res.data);
      const mapped = data.map(r => ({
        receiptNo: r.ReceiptNo || r.receiptNo || r.RcptNo,
        receivedDate: r.ReceivedDate || r.receivedDate || r.SystemDate || r.CreatedDate || r.Date || r.date || r.ReceiptDate || r.RcptDate,
        mainHead: r.MainHead || r.mainHead || r.HubMainHead,
        subHead: r.SubHead || r.subHead || r.HubSubHead,
        forYear: r.ForYear || r.forYear,
        amount: r.Amount || r.amount || r.Received,
        mode: r.Mode || r.mode || r.PaymentMode,
        status: r.Status || r.status || r.ReceiptStatus,
        ...r
      }));
      if (setReceipts) {
        setReceipts(mapped);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = useMemo(() => {
    if (!Array.isArray(receipts)) return [];
    return receipts.filter(r => {
      const matchHub = !filterHubType || r.mainHead === filterHubType;
      const matchSub = !filterSubType || r.subHead === filterSubType;
      const matchYear = !filterForYear || String(r.forYear) === String(filterForYear);
      return matchHub && matchSub && matchYear;
    });
  }, [receipts, filterHubType, filterSubType, filterForYear]);

  // Derived filter options based on cascaded filtering
  const hubTypeOptions = useMemo(() => [...new Set((receipts || []).map(r => r.mainHead))].filter(Boolean), [receipts]);
  const subTypeOptions = useMemo(() => [...new Set((receipts || []).filter(r => !filterHubType || r.mainHead === filterHubType).map(r => r.subHead))].filter(Boolean), [receipts, filterHubType]);
  const yearOptions = useMemo(() => [...new Set((receipts || []).filter(r => (!filterHubType || r.mainHead === filterHubType) && (!filterSubType || r.subHead === filterSubType)).map(r => r.forYear))].filter(Boolean), [receipts, filterHubType, filterSubType]);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <select 
            className="form-input py-1 text-[12px] min-w-[130px]" 
            value={filterHubType} 
            onChange={(e) => { setFilterHubType(e.target.value); setFilterSubType(''); setFilterForYear(''); }}
          >
            <option value="">All Hub Types</option>
            {hubTypeOptions.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <select 
            className="form-input py-1 text-[12px] min-w-[130px]" 
            value={filterSubType} 
            onChange={(e) => { setFilterSubType(e.target.value); setFilterForYear(''); }}
          >
            <option value="">All Sub Types</option>
            {subTypeOptions.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <select 
            className="form-input py-1 text-[12px] min-w-[110px]" 
            value={filterForYear} 
            onChange={(e) => setFilterForYear(e.target.value)}
          >
            <option value="">All Years</option>
            {yearOptions.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <span className="text-[12px] font-medium text-navy-800 ml-2 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 whitespace-nowrap">
            {loading ? 'Loading...' : `${filteredReceipts.length} receipts`}
          </span>
        </div>
        <div className="flex items-center gap-3 pl-3">
          {permissions?.MDNewInsert && (
            <button className="btn btn-primary btn-sm whitespace-nowrap" onClick={onAddReceipt}>+ New Receipt</button>
          )}
        </div>
      </div>
      <div className="rounded-lg overflow-hidden border border-border">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              {['Actions', 'Receipt#', 'Received Date', 'Type', 'Sub Type', 'For Year', 'Amount', 'Mode', 'Status'].map(h => (
                <th key={h} className="th-navy">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : filteredReceipts.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">No receipts found</td></tr>
            ) : filteredReceipts.map((r, i) => {
              const isCancelled = r.status === 'Cancelled' || r.status === 'Cancel Receipt' || r.status === 'Cancel';
              return (
                <tr key={i} className={isCancelled ? 'bg-red-500 text-white' : 'hover:bg-blue-500/[0.025]'}>
                  <td className={`px-3 py-2 border-t ${isCancelled ? 'border-red-400' : 'border-border'} whitespace-nowrap`}>
                    {!isCancelled && permissions?.MDEditReceipt && (
                      <button className="btn btn-secondary btn-sm mr-1" onClick={() => onEditReceipt(r)}>
                        <EditIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {permissions?.MDEditReceipt && (
                      <button className="btn btn-secondary btn-sm" onClick={() => onPrintReceipt(r)}>
                        <PrintIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                  <td className={`px-3 py-2 border-t ${isCancelled ? 'border-red-400 text-white' : 'border-border text-blue-500'} font-semibold`}>#{r.receiptNo}</td>
                  <td className={`px-3 py-2 border-t ${isCancelled ? 'border-red-400' : 'border-border'} whitespace-nowrap`}>{fmtDate(r.receivedDate)}</td>
                  <td className={`px-3 py-2 border-t ${isCancelled ? 'border-red-400' : 'border-border'}`}>{r.mainHead}</td>
                  <td className={`px-3 py-2 border-t ${isCancelled ? 'border-red-400' : 'border-border'}`}>{r.subHead}</td>
                  <td className={`px-3 py-2 border-t ${isCancelled ? 'border-red-400' : 'border-border'}`}>{r.forYear}</td>
                  <td className={`px-3 py-2 border-t ${isCancelled ? 'border-red-400' : 'border-border'} font-semibold`}>{fmt(r.amount)}</td>
                  <td className={`px-3 py-2 border-t ${isCancelled ? 'border-red-400' : 'border-border'}`}>{r.mode}</td>
                  <td className={`px-3 py-2 border-t ${isCancelled ? 'border-red-400' : 'border-border'}`}>
                    {isCancelled ? <span className="font-semibold">{r.status}</span> : <StatusBadge status={r.status} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}