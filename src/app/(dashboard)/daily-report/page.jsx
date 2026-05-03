'use client';

import { useState, useCallback } from 'react';
import { useAuth }            from '@/context/AuthContext';
import { receiptService }     from '@/services';
import toast                  from 'react-hot-toast';
import PageHeader             from '@/components/shared/PageHeader';
import { StatusBadge }        from '@/components/shared/Badge';
import Modal                  from '@/components/shared/Modal';
import { DownloadIcon, PrintIcon, SearchIcon, SaveIcon } from '@/components/shared/Icons';

const today = () => new Date().toISOString().split('T')[0];
const fmt   = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

export default function DailyReportPage() {
  const { permissions } = useAuth();

  const [filters, setFilters] = useState({
    fromDate: today(), toDate: today(),
    mode: '', mainHead: '', subHead: '', forYear: '', transType: '',
  });
  const [rows,       setRows]       = useState([]);
  const [totals,     setTotals]     = useState(null);
  const [itemTotals, setItemTotals] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [searched,   setSearched]   = useState(false);

  // Edit receipt modal
  const [editModal, setEditModal]   = useState(false);
  const [editRow,   setEditRow]     = useState(null);

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        receiptService.getDailyReport(filters),
        receiptService.getDailyTotals(filters),
        receiptService.getDailyItemTotals(filters),
      ]);
      setRows(r1.data);
      setTotals(r2.data);
      setItemTotals(r3.data);
      setSearched(true);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleEdit = (row) => {
    if (!permissions.DREdit) return toast.error('No permission to edit');
    setEditRow(row);
    setEditModal(true);
  };

  const saveEdit = async () => {
    if (!editRow) return;
    try {
      await receiptService.update(editRow.receiptNo, editRow);
      toast.success('Receipt updated');
      setEditModal(false);
      search();
    } catch {
      toast.error('Failed to update');
    }
  };

  // Stats at top
  const statCards = [
    { label: 'Total Entries',  value: totals?.totalCount   ?? '—' },
    { label: 'Cash Total',     value: fmt(totals?.cashTotal),  color: 'text-green-600' },
    { label: 'Online Total',   value: fmt(totals?.onlineTotal),color: 'text-blue-500' },
    { label: 'Cancelled',      value: totals?.cancelledCount ?? '—', color: 'text-red-600' },
  ];

  return (
    <div>
      <PageHeader title="Daily Report" subtitle="SP: GetDailyReport · GetDailyReportItemTotal · GetDailyReportTotal">
        <button className="btn btn-secondary btn-sm"><DownloadIcon className="w-3.5 h-3.5 mr-1.5" />Export Excel</button>
        <button className="btn btn-secondary btn-sm" onClick={() => window.print()}><PrintIcon className="w-3.5 h-3.5 mr-1.5" />Print</button>
        <button className="btn btn-primary btn-sm" onClick={search} disabled={loading}>
          {loading ? 'Loading…' : <><SearchIcon className="w-3.5 h-3.5 mr-1.5" />Apply Filters</>}
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="bg-white border border-border rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="form-label">From Date</label>
          <input type="date" className="form-input w-[130px]" value={filters.fromDate} onChange={e => setF('fromDate', e.target.value)} />
        </div>
        <div>
          <label className="form-label">To Date</label>
          <input type="date" className="form-input w-[130px]" value={filters.toDate} onChange={e => setF('toDate', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Payment Mode</label>
          <select className="form-select w-[100px]" value={filters.mode} onChange={e => setF('mode', e.target.value)}>
            <option value="">All</option>
            {['Cash','Online','Cheque','UPI'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Group Type</label>
          <select className="form-select w-[110px]" value={filters.mainHead} onChange={e => setF('mainHead', e.target.value)}>
            <option value="">All</option>
            {['Sabeel','FMB','Vajebaat','Other'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Sub Type</label>
          <select className="form-select w-[160px]" value={filters.subHead} onChange={e => setF('subHead', e.target.value)}>
            <option value="">All</option>
            {['Sabeel Regular','Sabeel Mutaveteen','FMB Regular','FMB Half Thaali','Vajebaat','HIM','Other'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">For Year</label>
          <select className="form-select w-[100px]" value={filters.forYear} onChange={e => setF('forYear', e.target.value)}>
            <option value="">All</option>
            <option>{permissions.ForYearAll}</option>
            <option>{permissions.ForYearFMB}</option>
          </select>
        </div>
        <div>
          <label className="form-label">Trans Type</label>
          <select className="form-select w-[120px]" value={filters.transType} onChange={e => setF('transType', e.target.value)}>
            <option value="">All</option>
            <option>New</option>
            <option>Adjust</option>
          </select>
        </div>
      </div>

      {/* Stat cards */}
      {searched && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          {statCards.map(s => (
            <div key={s.label} className="card">
              <div className="card-body">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">{s.label}</div>
                <div className={`font-display text-[22px] font-bold ${s.color || 'text-navy-900'}`}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transactions table */}
      <div className="card mb-4">
        <div className="card-header">
          Transaction List
          {searched && <span className="text-[11px] text-gray-400 font-normal">{rows.length} entries found</span>}
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                {['Receipt#','Acc#','Member','Mobile','Type','Amount','Mode','Date','Trans Type','Status','Edit'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan={11} className="text-center py-10 text-gray-400">Apply filters and click Search</td></tr>
              ) : loading ? (
                <tr><td colSpan={11} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-10 text-gray-400">No records found</td></tr>
              ) : rows.map((r, i) => (
                <tr
                  key={i}
                  className={r.status === 'Cancelled' ? 'bg-red-50' : 'hover:bg-blue-500/[0.025]'}
                >
                  <td className="px-3 py-2.5 border-t border-border text-blue-500 font-semibold">#{r.receiptNo}</td>
                  <td className="px-3 py-2.5 border-t border-border text-blue-500 cursor-pointer">{r.accno}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.memberName}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.mobile}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.hubType}</td>
                  <td className="px-3 py-2.5 border-t border-border font-semibold">{fmt(r.amount)}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.mode}</td>
                  <td className="px-3 py-2.5 border-t border-border whitespace-nowrap">{r.date}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.transType}</td>
                  <td className="px-3 py-2.5 border-t border-border"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-2.5 border-t border-border">
                    {r.status !== 'Cancelled' && permissions.DREdit && (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(r)}>Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom totals */}
      {searched && (
        <div className="grid grid-cols-2 gap-3">
          {/* Item totals */}
          <div className="card">
            <div className="card-header text-[12px]">Item-wise Totals</div>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {['Sub Type','Count','Total Amount'].map(h => <th key={h} className="th-navy">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {itemTotals.map((it, i) => (
                  <tr key={i} className="hover:bg-blue-500/[0.025]">
                    <td className="px-3 py-2 border-t border-border">{it.subType}</td>
                    <td className="px-3 py-2 border-t border-border">{it.count}</td>
                    <td className="px-3 py-2 border-t border-border font-semibold">{fmt(it.total)}</td>
                  </tr>
                ))}
                {itemTotals.length > 0 && (
                  <tr className="bg-surface font-semibold">
                    <td className="px-3 py-2 border-t border-border">Grand Total</td>
                    <td className="px-3 py-2 border-t border-border">{itemTotals.reduce((s, r) => s + (r.count || 0), 0)}</td>
                    <td className="px-3 py-2 border-t border-border">{fmt(itemTotals.reduce((s, r) => s + (r.total || 0), 0))}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Mode totals */}
          <div className="card">
            <div className="card-header text-[12px]">Mode Totals</div>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {['Mode','Count','Total Amount'].map(h => <th key={h} className="th-navy">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {totals?.modes?.map((m, i) => (
                  <tr key={i} className="hover:bg-blue-500/[0.025]">
                    <td className="px-3 py-2 border-t border-border">{m.mode}</td>
                    <td className="px-3 py-2 border-t border-border">{m.count}</td>
                    <td className="px-3 py-2 border-t border-border font-semibold">{fmt(m.total)}</td>
                  </tr>
                ))}
                {totals?.modes?.length > 0 && (
                  <tr className="bg-surface font-semibold">
                    <td className="px-3 py-2 border-t border-border">Grand Total</td>
                    <td className="px-3 py-2 border-t border-border">{totals.totalCount}</td>
                    <td className="px-3 py-2 border-t border-border">{fmt(totals.grandTotal)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Receipt Modal */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title={`Edit Receipt #${editRow?.receiptNo}`}
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveEdit}><SaveIcon className="w-3.5 h-3.5 mr-1.5" />Update Receipt</button>
          </>
        }
      >
        {editRow && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-100 border-l-4 border-l-blue-500 rounded-md p-3 text-[12px] text-blue-800">
              ℹ Editing receipt will call SP: UpdateTakhmeenDetails after save
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="form-label">Receipt No.</label>
                <input className="form-input bg-surface" value={editRow.receiptNo} readOnly />
              </div>
              <div>
                <label className="form-label">Receipt Date</label>
                <input type="date" className="form-input" value={editRow.date} onChange={e => setEditRow(r => ({ ...r, date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Payment Mode</label>
                <select className="form-select" value={editRow.mode} onChange={e => setEditRow(r => ({ ...r, mode: e.target.value }))}>
                  {['Cash','Online','Cheque','UPI'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Amount</label>
              <input type="number" className="form-input" value={editRow.amount} onChange={e => setEditRow(r => ({ ...r, amount: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Remark</label>
              <input className="form-input" value={editRow.remark || ''} onChange={e => setEditRow(r => ({ ...r, remark: e.target.value }))} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
