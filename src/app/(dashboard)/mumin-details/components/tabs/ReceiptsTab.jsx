'use client';

import { useState, useEffect, useMemo } from 'react';
import { EditIcon, PrintIcon } from '@/components/shared/Icons';
import { StatusBadge } from '@/components/shared/Badge';
import { fmt, fmtDate, normalizeArray } from '../../utils';
import { receiptService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function ReceiptsTab({ receipts, setReceipts, accno, onAddReceipt, onEditReceipt, onPrintReceipt }) {
  const { can } = useAuth();
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterHubType, setFilterHubType] = useState('');
  const [filterSubType, setFilterSubType] = useState('');
  const [filterForYear, setFilterForYear] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [showUpdateInfo, setShowUpdateInfo] = useState(false);

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
        grade: r.Grade || r.grade || '',
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

    const hasItemFilter = !!filterSubType || !!filterForYear;

    const base = receipts.filter(r => {
      const matchHub  = !filterHubType || r.mainHead === filterHubType;
      const matchSub  = !filterSubType || r.subHead  === filterSubType;
      const matchYear = !filterForYear || String(r.forYear) === String(filterForYear);
      return matchHub && matchSub && matchYear;
    });

    if (hasItemFilter) {
      // Per-item view when SubType or ForYear filter is active
      return base.sort((a, b) => {
        const d = new Date(b.receivedDate) - new Date(a.receivedDate);
        return d !== 0 ? d : Number(b.receiptNo) - Number(a.receiptNo);
      });
    }

    // Summary view — one row per TransactionsDetail header (t.ID), amount = sum of its items
    const map = new Map();
    base.forEach(r => {
      const key = String(r.ID || r.id || r.receiptNo);
      if (!map.has(key)) {
        map.set(key, { ...r, amount: Number(r.amount) || 0 });
      } else {
        const ex = map.get(key);
        ex.amount += Number(r.amount) || 0;
        // Show null (renders as —) for fields that differ across items of the same receipt
        if (ex.subHead !== r.subHead) ex.subHead = null;
        if (String(ex.forYear) !== String(r.forYear)) ex.forYear = null;
        if (ex.grade !== r.grade) ex.grade = null;
      }
    });

    return Array.from(map.values())
      .sort((a, b) => {
        const d = new Date(b.receivedDate) - new Date(a.receivedDate);
        return d !== 0 ? d : Number(b.receiptNo) - Number(a.receiptNo);
      });
  }, [receipts, filterHubType, filterSubType, filterForYear]);

  const totalPages = pageSize === 'All' ? 1 : Math.ceil(filteredReceipts.length / pageSize);
  const paginatedReceipts = useMemo(() => {
    if (pageSize === 'All') return filteredReceipts;
    const start = (currentPage - 1) * pageSize;
    return filteredReceipts.slice(start, start + pageSize);
  }, [filteredReceipts, pageSize, currentPage]);

  // Derived filter options based on cascaded filtering
  const hubTypeOptions = useMemo(() => [...new Set((receipts || []).map(r => r.mainHead))].filter(Boolean), [receipts]);
  const subTypeOptions = useMemo(() => [...new Set((receipts || []).filter(r => !filterHubType || r.mainHead === filterHubType).map(r => r.subHead))].filter(Boolean), [receipts, filterHubType]);
  const yearOptions = useMemo(() => [...new Set((receipts || []).filter(r => (!filterHubType || r.mainHead === filterHubType) && (!filterSubType || r.subHead === filterSubType)).map(r => r.forYear))].filter(Boolean), [receipts, filterHubType, filterSubType]);

  const baseColCount = 11; // Actions, Receipt#, Received Date, Full Name, Type, Sub Type, For Year, Grade, Amount, Mode, Status
  const colCount = baseColCount + (showUpdateInfo ? 2 : 0);

  return (
    <div className="p-4">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <select
            className="form-input py-1 text-[12px] min-w-[130px]"
            value={filterHubType}
            onChange={(e) => { setFilterHubType(e.target.value); setFilterSubType(''); setFilterForYear(''); setCurrentPage(1); }}
          >
            <option value="">All Hub Types</option>
            {hubTypeOptions.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <select
            className="form-input py-1 text-[12px] min-w-[130px]"
            value={filterSubType}
            onChange={(e) => { setFilterSubType(e.target.value); setFilterForYear(''); setCurrentPage(1); }}
          >
            <option value="">All Sub Types</option>
            {subTypeOptions.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <select
            className="form-input py-1 text-[12px] min-w-[110px]"
            value={filterForYear}
            onChange={(e) => { setFilterForYear(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Years</option>
            {yearOptions.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <span className="text-[12px] font-medium text-navy-800 ml-2 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 whitespace-nowrap">
            {loading ? 'Loading...' : `${filteredReceipts.length} receipts`}
          </span>
          
          <select
            className="form-input py-1 text-[12px] w-[80px]"
            value={pageSize}
            onChange={e => { setPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value)); setCurrentPage(1); }}
          >
            {[20, 50, 100, 200, 500, 1000, 'All'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap ml-1">
            <input
              type="checkbox"
              checked={showUpdateInfo}
              onChange={e => setShowUpdateInfo(e.target.checked)}
              className="w-3.5 h-3.5 accent-blue-600"
            />
            <span className="text-[11px] text-gray-600">Update info</span>
          </label>
          
        </div>
        <div className="flex items-center gap-3 pl-3">
          {can('receipts.create') && (
            <button className="btn btn-primary btn-sm whitespace-nowrap" onClick={onAddReceipt}>+ New Receipt</button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-[12px] min-w-[800px]">
          <thead>
            <tr>
              {['Actions', 'Receipt#', 'Received Date', 'Full Name', 'Type', 'Sub Type', 'For Year', 'Grade', 'Amount', 'Mode', 'Status'].map(h => (
                <th key={h} className="th-navy">{h}</th>
              ))}
              {showUpdateInfo && <>
                <th className="th-navy">Update Reason</th>
                <th className="th-navy">Update Date</th>
              </>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={colCount} className="text-center py-8 text-gray-400">Loading...</td></tr>
            ) : filteredReceipts.length === 0 ? (
              <tr><td colSpan={colCount} className="text-center py-8 text-gray-400">No receipts found</td></tr>
            ) : paginatedReceipts.map((r, i) => {
              const isCancelled = r.status === 'Cancelled' || r.status === 'Cancel Receipt' || r.status === 'Cancel';
              const td = `px-3 py-2 border-t ${isCancelled ? 'border-red-400' : 'border-border'}`;
              return (
                <tr key={i} className={isCancelled ? 'bg-red-600 text-white' : 'hover:bg-blue-500/[0.025]'}>
                  <td className={`${td} whitespace-nowrap`}>
                    {!isCancelled && can('receipts.edit') && (
                      <button className="btn btn-secondary btn-sm mr-1" onClick={() => onEditReceipt(r)}>
                        <EditIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {can('receipts.edit') && (
                      <button className="btn btn-secondary btn-sm" onClick={() => onPrintReceipt(r)}>
                        <PrintIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                  <td className={`${td} ${isCancelled ? 'text-red-100' : 'text-blue-500'} font-semibold`}>#{r.receiptNo}</td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDate(r.receivedDate)}</td>
                  <td className={td}>{r.ReceivedFrom || r.receivedFrom || r.fullName || '—'}</td>
                  <td className={td}>{r.mainHead}</td>
                  <td className={td}>{r.subHead ?? '—'}</td>
                  <td className={td}>{r.forYear ?? '—'}</td>
                  <td className={td}>{r.grade ?? '—'}</td>
                  <td className={`${td} font-semibold`}>{fmt(r.amount)}</td>
                  <td className={td}>{r.mode}</td>
                  <td className={td}>
                    {isCancelled
                      ? <span className="inline-block bg-white text-red-600 text-xs font-semibold px-2 py-0.5 rounded">{r.status}</span>
                      : <StatusBadge status={r.status} />}
                  </td>
                  {showUpdateInfo && <>
                    <td className={`${td} max-w-[180px] truncate`} title={r.RecordUpdateReason || ''}>{r.RecordUpdateReason || '—'}</td>
                    <td className={`${td} whitespace-nowrap`}>{r.RecordUpdateDate ? fmtDate(r.RecordUpdateDate) : '—'}</td>
                  </>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-[11px] text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredReceipts.length)} of {filteredReceipts.length}
          </span>
          <div className="flex items-center gap-1">
            <button className="btn btn-secondary btn-sm px-2 disabled:opacity-40" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>«</button>
            <button className="btn btn-secondary btn-sm px-2 disabled:opacity-40" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹</button>
            <span className="text-[11px] text-gray-500 px-2">Page {currentPage} of {totalPages}</span>
            <button className="btn btn-secondary btn-sm px-2 disabled:opacity-40" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>›</button>
            <button className="btn btn-secondary btn-sm px-2 disabled:opacity-40" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}
