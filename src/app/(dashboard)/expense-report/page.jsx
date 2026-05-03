'use client';

import { useState, useCallback } from 'react';
import { expenseService }  from '@/services';
import toast               from 'react-hot-toast';
import PageHeader          from '@/components/shared/PageHeader';
import { DownloadIcon, BarChartIcon } from '@/components/shared/Icons';

const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

export default function ExpenseReportPage() {
  const [filters, setFilters] = useState({ fromDate: '', toDate: '', mainCat: '' });
  const [rows,    setRows]    = useState([]);
  const [totals,  setTotals]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched,setSearched]= useState(false);

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  const generate = useCallback(async () => {
    if (!filters.fromDate || !filters.toDate) { toast.error('Select date range'); return; }
    setLoading(true);
    try {
      const res = await expenseService.getReport(filters);
      setRows(res.data.rows);
      setTotals(res.data.totals);
      setSearched(true);
    } catch { toast.error('Failed to generate'); }
    finally { setLoading(false); }
  }, [filters]);

  return (
    <div>
      <PageHeader title="Expense Report" subtitle="Monthly and periodic expense analysis">
        <button className="btn btn-secondary btn-sm"><DownloadIcon className="w-3.5 h-3.5 mr-1.5" />Export Excel</button>
        <button className="btn btn-primary btn-sm" onClick={generate} disabled={loading}>
          {loading ? 'Generating…' : <><BarChartIcon className="w-3.5 h-3.5 mr-1.5" />Generate Report</>}
        </button>
      </PageHeader>

      <div className="bg-white border border-border rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div><label className="form-label">From Date</label><input type="date" className="form-input" value={filters.fromDate} onChange={e => setF('fromDate', e.target.value)} /></div>
        <div><label className="form-label">To Date</label><input type="date" className="form-input" value={filters.toDate} onChange={e => setF('toDate', e.target.value)} /></div>
        <div>
          <label className="form-label">Main Category</label>
          <select className="form-select w-[140px]" value={filters.mainCat} onChange={e => setF('mainCat', e.target.value)}>
            <option value="">All</option>
            {['Administration','Maintenance','FMB','Event'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {!searched ? (
        <div className="text-center py-16 text-gray-400 bg-white border border-border rounded-lg">
          Select date range and click Generate Report
        </div>
      ) : (
        <>
          {/* Category totals */}
          {totals && (
            <div className="grid grid-cols-4 gap-3 mb-4">
              {Object.entries(totals.byCat || {}).map(([cat, amt]) => (
                <div key={cat} className="card card-body">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{cat}</div>
                  <div className="font-display text-[20px] font-bold text-navy-900">{fmt(amt)}</div>
                </div>
              ))}
            </div>
          )}
          <div className="card mb-4">
            <div className="card-header">
              Expense Details
              <span className="text-[11px] text-gray-400 font-normal">Total: {fmt(totals?.grandTotal)}</span>
            </div>
            <div className="overflow-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead><tr>{['Date','Main Category','Sub Category','Description','Amount','Added By'].map(h => <th key={h} className="th-navy">{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-blue-500/[0.025]">
                      <td className="px-3 py-2.5 border-t border-border whitespace-nowrap">{r.date}</td>
                      <td className="px-3 py-2.5 border-t border-border">{r.mainCat}</td>
                      <td className="px-3 py-2.5 border-t border-border">{r.subCat}</td>
                      <td className="px-3 py-2.5 border-t border-border">{r.description}</td>
                      <td className="px-3 py-2.5 border-t border-border font-semibold">{fmt(r.amount)}</td>
                      <td className="px-3 py-2.5 border-t border-border">{r.addedBy || 'Admin'}</td>
                    </tr>
                  ))}
                  <tr className="bg-surface font-semibold">
                    <td colSpan={4} className="px-3 py-2.5 border-t border-border">Grand Total</td>
                    <td className="px-3 py-2.5 border-t border-border text-navy-900 text-[13px]">{fmt(totals?.grandTotal)}</td>
                    <td className="border-t border-border" />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
