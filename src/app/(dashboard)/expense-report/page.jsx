'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import toast                     from 'react-hot-toast';
import { expenseService, expenseHeadService } from '@/services';
import { useAuth }               from '@/context/AuthContext';
import PageHeader                from '@/components/shared/PageHeader';
import { PlusIcon, EditIcon, TrashIcon, PrintIcon, DownloadIcon,
         TableIcon, FileTextIcon, ExportIcon } from '@/components/shared/Icons';
import AddExpenseModal, { EMPTY_EXPENSE_FORM } from './components/AddExpenseModal';
import EditExpenseModal          from './components/EditExpenseModal';

// ─── constants ────────────────────────────────────────────────────────────────

const PAY_MODES   = ['Cash', 'Chq', 'DD', 'RTGS', 'Online'];
const PAGE_SIZES  = [50, 100, 250, 500, 1000, 0]; // 0 = All

// Suggestions rebuilt from search results (NOT head-derived ones)
const LIST_SUGGESTION_KEYS = ['EventPlaceName', 'Given', 'FundSource', 'ExpenseSubHead', 'DocNo'];

const EMPTY_FILTERS = {
  ExpenseGroupwithCode: '', ExpenseHeadwithCode: '', ExpenseSubHead: '',
  EventPlaceName: '', VoucherSeries: '', VoucherFromDate: '', VoucherToDate: '',
  IsCashMemo: '', Given: '', PayMode: '', FundSource: '',
};

const TABLE_COLS = [
  { key: 'VoucherNo',           label: 'Voucher No' },
  { key: 'VoucherDate',         label: 'Voucher Date',  fmt: 'date' },
  { key: 'EventPlaceName',      label: 'Event / Place' },
  { key: 'ExpenseHeadwithCode', label: 'Expense Head' },
  { key: 'ExpenseSubHead',      label: 'Sub Head' },
  { key: 'Given',               label: 'Given' },
  { key: 'PayMode',             label: 'Pay Mode' },
  { key: 'DocNo',               label: 'Doc No' },
  { key: 'Amount',              label: 'Amount' },
  { key: 'ExpenseDescription',  label: 'Description' },
  { key: 'RecordStatus',        label: 'Status' },
];

const MORE_INFO_COLS = [
  { key: 'ExpenseGroupwithCode', label: 'Main Group' },
  { key: 'IsCashMemo',           label: 'Cash Memo',      fmt: 'bool' },
  { key: 'VoucherSeries',        label: 'Series' },
  { key: 'FundSource',           label: 'Fund Source' },
  { key: 'CreatedBy',            label: 'Created By' },
  { key: 'RecordUpdateReason',   label: 'Update Reason' },
  { key: 'RecordUpdateAt',       label: 'Update Date',    fmt: 'datetime' },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (value.recordset) return value.recordset;
  if (Array.isArray(value.recordsets?.[0])) return value.recordsets[0];
  if (Array.isArray(value.data)) return value.data;
  return [];
}

const uniq = (rows, key) => [...new Set(rows.map(r => r[key]).filter(Boolean))].sort();

// Parse a DB date value into YYYY-MM-DD using local timezone (avoids UTC-midnight off-by-one)
const toInputDate = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// MySQL DATETIME format in local time: "YYYY-MM-DD HH:MM:SS"
const toMySQLDateTime = () => {
  const d   = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const isTruthy = v => v == 1 || v === true || v === 'TRUE' || v === 'true';

const renderCell = (col, row) => {
  const raw = row[col.key];
  if (raw == null || raw === '') return '—';
  if (col.fmt === 'date')     return fmtDate(raw);
  if (col.fmt === 'datetime') return fmtDateTime(raw);
  if (col.fmt === 'bool')     return isTruthy(raw) ? 'Yes' : 'No';
  return raw;
};

// ─── export helpers ───────────────────────────────────────────────────────────

function getCellExportValue(col, row) {
  const raw = row[col.key];
  if (raw == null || raw === '') return '';
  if (col.fmt === 'date')     return fmtDate(raw);
  if (col.fmt === 'datetime') return fmtDateTime(raw);
  if (col.fmt === 'bool')     return isTruthy(raw) ? 'Yes' : 'No';
  return raw;
}

function buildExportData(rows, cols, totalAmount) {
  const body   = rows.map(r => cols.map(c => getCellExportValue(c, r)));
  const amtIdx = cols.findIndex(c => c.key === 'Amount');
  if (amtIdx >= 0 && totalAmount != null) {
    body.push(cols.map((c, i) => {
      if (i === 0)          return 'Grand Total';
      if (c.key === 'Amount') return totalAmount;
      return '';
    }));
  }
  return body;
}

function exportToCSV(rows, cols, totalAmount) {
  const esc    = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = cols.map(c => esc(c.label)).join(',');
  const body   = buildExportData(rows, cols, totalAmount).map(r => r.map(v => esc(v)).join(','));
  const csv    = [header, ...body].join('\r\n');
  const blob   = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href = url; a.download = 'expense-report.csv'; a.click();
  URL.revokeObjectURL(url);
}

async function exportToExcel(rows, cols, totalAmount) {
  const mod  = await import('xlsx');
  const XLSX = mod.default ?? mod;   // handles both CJS and ESM wrapping
  const data = buildExportData(rows, cols, totalAmount);
  const ws   = XLSX.utils.aoa_to_sheet([cols.map(c => c.label), ...data]);
  const wb   = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Expense Report');
  XLSX.writeFile(wb, 'expense-report.xlsx');
}

async function exportToPDF(rows, cols, totalAmount) {
  const { default: jsPDF }     = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc    = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const data   = buildExportData(rows, cols, totalAmount).map(r => r.map(v => String(v ?? '')));
  const amtIdx = cols.findIndex(c => c.key === 'Amount');
  autoTable(doc, {
    head: [cols.map(c => c.label)],
    body: data,
    styles:     { fontSize: 6.5, cellPadding: 3 },
    headStyles: { fillColor: [15, 39, 79], textColor: 255, fontStyle: 'bold' },
    didParseCell: (hook) => {
      if (amtIdx >= 0 && hook.row.index === data.length - 1) {
        hook.cell.styles.fontStyle  = 'bold';
        hook.cell.styles.fillColor  = [243, 244, 246];
      }
    },
  });
  doc.save('expense-report.pdf');
}

function printData(rows, cols, totalAmount) {
  const ths = cols.map(c => `<th>${c.label}</th>`).join('');
  const trs = rows.map(r =>
    `<tr>${cols.map(c => `<td>${getCellExportValue(c, r)}</td>`).join('')}</tr>`
  ).join('');
  const amtIdx = cols.findIndex(c => c.key === 'Amount');
  let totalTr = '';
  if (amtIdx >= 0 && totalAmount != null) {
    totalTr = `<tr class="total">${cols.map((c, i) => {
      if (i === 0)          return `<td><b>Grand Total</b></td>`;
      if (c.key === 'Amount') return `<td><b>${Number(totalAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</b></td>`;
      return '<td></td>';
    }).join('')}</tr>`;
  }
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Expense Report</title>
<style>
  body{font-family:Arial,sans-serif;font-size:10px}
  h2{margin-bottom:8px}
  table{border-collapse:collapse;width:100%}
  th,td{border:1px solid #ccc;padding:3px 6px;white-space:nowrap}
  th{background:#0f274f;color:#fff}
  tr.total td{background:#f3f4f6}
  @page{margin:1cm;size:landscape}
</style></head><body>
<h2>Expense Report — ${rows.length.toLocaleString('en-IN')} records</h2>
<table><thead><tr>${ths}</tr></thead><tbody>${trs}${totalTr}</tbody></table>
<script>window.onload=()=>window.print();</script>
</body></html>`;
  const w = window.open('', '_blank', 'width=1200,height=800');
  if (w) { w.document.write(html); w.document.close(); }
  else toast.error('Popup blocked — allow popups to print');
}

// ─── ExportDropdown ───────────────────────────────────────────────────────────

function ExportDropdown({ allRows, visibleCols, totalAmount }) {
  const [open,      setOpen]      = useState(false);
  const [exporting, setExporting] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handle = async (type) => {
    setOpen(false);
    if (!allRows.length) { toast.error('No data to export'); return; }
    setExporting(true);
    try {
      if (type === 'csv')   exportToCSV(allRows, visibleCols, totalAmount);
      if (type === 'excel') await exportToExcel(allRows, visibleCols, totalAmount);
      if (type === 'pdf')   await exportToPDF(allRows, visibleCols, totalAmount);
      if (type === 'print') printData(allRows, visibleCols, totalAmount);
      if (type !== 'print') toast.success(`Exported ${allRows.length.toLocaleString('en-IN')} records`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const ITEMS = [
    { type: 'excel', label: 'Excel (.xlsx)', Icon: TableIcon    },
    { type: 'csv',   label: 'CSV (.csv)',    Icon: FileTextIcon  },
    { type: 'pdf',   label: 'PDF (.pdf)',    Icon: ExportIcon    },
    { type: 'print', label: 'Print',         Icon: PrintIcon     },
  ];

  return (
    <div ref={wrapRef} className="relative">
      <button
        className="btn btn-secondary btn-sm flex items-center gap-1.5"
        onClick={() => setOpen(v => !v)}
        disabled={exporting}
      >
        <DownloadIcon className="w-3.5 h-3.5" />
        {exporting ? 'Exporting…' : 'Export'}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-58 bg-white border border-border rounded-xl shadow-2xl z-[9999] overflow-hidden">
          <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-border">
            Export {allRows.length.toLocaleString('en-IN')} filtered records
          </div>
          {ITEMS.map(({ type, label, Icon }) => (
            <button key={type}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              onClick={() => handle(type)}
            >
              <Icon className="w-4 h-4 text-gray-400" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ComboBox ─────────────────────────────────────────────────────────────────

function ComboBox({ value, onChange, options = [], placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const q = String(value || '').toLowerCase();
  const filtered = q ? options.filter(o => String(o).toLowerCase().includes(q)) : options;

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <input type="text" className="form-input" value={value || ''} placeholder={placeholder}
        disabled={disabled} autoComplete="off"
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && !disabled && filtered.length > 0 && (
        <ul className="absolute z-[9999] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-0.5 max-h-52 overflow-y-auto text-[12px]" style={{ top: '100%' }}>
          {filtered.slice(0, 80).map((o, i) => (
            <li key={i} className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              onMouseDown={() => { onChange(o); setOpen(false); }}>{o}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Filters panel ────────────────────────────────────────────────────────────

function ExpenseFilters({ filters, setF, suggestions, onClear, loading }) {
  return (
    <div className="bg-white border border-border rounded-lg p-4 mb-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
        <div>
          <label className="form-label">Voucher From Date</label>
          <input type="date" className="form-input" value={filters.VoucherFromDate}
            onChange={e => setF('VoucherFromDate', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Voucher To Date</label>
          <input type="date" className="form-input" value={filters.VoucherToDate}
            onChange={e => setF('VoucherToDate', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Voucher Series</label>
          <ComboBox value={filters.VoucherSeries} options={suggestions.VoucherSeries}
            placeholder="All series..." onChange={v => setF('VoucherSeries', v)} />
        </div>
        <div>
          <label className="form-label">Is Cash Memo</label>
          <select className="form-select" value={filters.IsCashMemo}
            onChange={e => setF('IsCashMemo', e.target.value)}>
            <option value="">All</option>
            <option value="TRUE">Yes</option>
            <option value="FALSE">No</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
        <div>
          <label className="form-label">Expense Group</label>
          <ComboBox value={filters.ExpenseGroupwithCode} options={suggestions.ExpenseGroupwithCode}
            placeholder="Type to filter..." onChange={v => setF('ExpenseGroupwithCode', v)} />
        </div>
        <div>
          <label className="form-label">Expense Head</label>
          <ComboBox value={filters.ExpenseHeadwithCode} options={suggestions.ExpenseHeadwithCode}
            placeholder="Type to filter..." onChange={v => setF('ExpenseHeadwithCode', v)} />
        </div>
        <div>
          <label className="form-label">Expense Sub Head</label>
          <ComboBox value={filters.ExpenseSubHead} options={suggestions.ExpenseSubHead}
            placeholder="Type to filter..." onChange={v => setF('ExpenseSubHead', v)} />
        </div>
        <div>
          <label className="form-label">Fund Source</label>
          <ComboBox value={filters.FundSource} options={suggestions.FundSource}
            placeholder="Type to filter..." onChange={v => setF('FundSource', v)} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="form-label">Event / Place Name</label>
          <ComboBox value={filters.EventPlaceName} options={suggestions.EventPlaceName}
            placeholder="Type to filter..." onChange={v => setF('EventPlaceName', v)} />
        </div>
        <div>
          <label className="form-label">Pay Mode</label>
          <select className="form-select" value={filters.PayMode}
            onChange={e => setF('PayMode', e.target.value)}>
            <option value="">All</option>
            {PAY_MODES.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Given</label>
          <ComboBox value={filters.Given} options={suggestions.Given}
            placeholder="Search person..." onChange={v => setF('Given', v)} />
        </div>
      </div>

      <div className="flex justify-end items-center gap-3">
        {loading && (
          <span className="text-[12px] text-gray-400 flex items-center gap-1.5">
            <svg className="animate-spin w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Searching…
          </span>
        )}
        <button className="btn btn-secondary btn-sm" onClick={onClear} disabled={loading}>Clear Filter</button>
      </div>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

function ExpenseTable({ allRows, onEdit, onDelete, onPrint }) {
  const [pageSize,     setPageSize]   = useState(50);
  const [page,         setPage]       = useState(1);
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  // reset to first page whenever the underlying data or page size changes
  useEffect(() => { setPage(1); }, [allRows, pageSize]);

  const visibleCols  = showMoreInfo ? [...TABLE_COLS, ...MORE_INFO_COLS] : TABLE_COLS;
  const totalRecords = allRows.length;
  const totalAmount  = allRows
    .filter(r => r.RecordStatus !== 'Cancelled')
    .reduce((s, r) => s + (Number(r.Amount) || 0), 0);
  const fmtAmt       = (n) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const displayRows  = pageSize === 0 ? allRows : allRows.slice((page - 1) * pageSize, page * pageSize);
  const totalPages   = pageSize === 0 ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const amountColIdx = visibleCols.findIndex(c => c.key === 'Amount');

  if (!allRows.length) {
    return (
      <div className="text-center py-14 text-gray-400 bg-white border border-border rounded-lg text-[13px]">
        No records found. Use the filters above and click Search.
      </div>
    );
  }

  return (
    <div className="card">
      {/* Card header — pagination controls + export */}
      <div className="card-header flex-wrap gap-2">
        <span className="font-semibold">Expense Details</span>
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          {/* Show More Info toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-[12px] text-gray-600">
            <div
              onClick={() => setShowMoreInfo(v => !v)}
              className={`w-8 h-4 rounded-full transition-colors relative ${showMoreInfo ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${showMoreInfo ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            Show More Info
          </label>

          {/* Rows per page */}
          <div className="flex items-center gap-2 text-[12px] text-gray-600">
            <span className="whitespace-nowrap">Rows per page:</span>
            <select
              className="border border-border rounded-md px-2 py-1 text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZES.map(s => (
                <option key={s} value={s}>{s === 0 ? 'All' : s}</option>
              ))}
            </select>
          </div>

          {/* Record count badge */}
          <span className="px-3 py-1 bg-surface border border-border rounded-full text-[12px] text-gray-600 whitespace-nowrap">
            {totalRecords} record{totalRecords !== 1 ? 's' : ''}
          </span>

          {/* Amount total badge */}
          <span className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-[12px] text-blue-700 font-semibold whitespace-nowrap">
            Total: {fmtAmt(totalAmount)}
          </span>

          <ExportDropdown allRows={allRows} visibleCols={visibleCols} totalAmount={totalAmount} />
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              <th className="th-navy">Actions</th>
              {visibleCols.map(c => (
                <th key={c.key} className="th-navy whitespace-nowrap">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((r, i) => {
              const cancelled = r.RecordStatus === 'Cancelled';
              const rowCls    = cancelled ? 'bg-red-500 text-white' : 'hover:bg-blue-500/[0.025]';
              const cellCls   = `px-3 py-2.5 border-t whitespace-nowrap ${cancelled ? 'border-red-400' : 'border-border'}`;
              return (
                <tr key={i} className={rowCls}>
                  <td className={`px-3 py-2.5 border-t ${cancelled ? 'border-red-400' : 'border-border'}`}>
                    <div className="flex items-center gap-1">
                      {!cancelled && (
                        <button onClick={() => onEdit(r)} className="w-6 h-6 flex items-center justify-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Edit">
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => onPrint(r)} className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${cancelled ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-green-50 text-green-600 hover:bg-green-100'}`} title="Print">
                        <PrintIcon className="w-3.5 h-3.5" />
                      </button>
                      {!cancelled && (
                        <button onClick={() => onDelete(r)} className="w-6 h-6 flex items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete">
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  {visibleCols.map(c => (
                    <td key={c.key} className={cellCls}>
                      {renderCell(c, r)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          {amountColIdx >= 0 && (
            <tfoot>
              <tr className="bg-surface font-semibold text-[12.5px]">
                <td colSpan={1 + amountColIdx} className="px-3 py-2.5 border-t-2 border-border text-right text-navy-900">
                  Grand Total
                </td>
                <td className="px-3 py-2.5 border-t-2 border-border text-navy-900">
                  {fmtAmt(totalAmount)}
                </td>
                {visibleCols.length - amountColIdx - 1 > 0 && (
                  <td colSpan={visibleCols.length - amountColIdx - 1} className="border-t-2 border-border" />
                )}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination footer — only when not showing All */}
      {pageSize !== 0 && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-[12px] text-gray-600">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalRecords)} of {totalRecords}
          </span>
          <div className="flex items-center gap-1">
            <button
              className="px-2.5 py-1 rounded border border-border hover:bg-surface disabled:opacity-40"
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            >‹ Prev</button>
            <span className="px-3">{page} / {totalPages}</span>
            <button
              className="px-2.5 py-1 rounded border border-border hover:bg-surface disabled:opacity-40"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            >Next ›</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExpenseReportPage() {
  const { user } = useAuth();

  const todayStr = () => new Date().toISOString().split('T')[0];

  const [filters,     setFilters]     = useState({ ...EMPTY_FILTERS, VoucherFromDate: todayStr(), VoucherToDate: todayStr() });
  const [rows,        setRows]        = useState([]);
  const [headData,    setHeadData]    = useState([]);
  const [suggestions, setSuggestions] = useState({
    ExpenseGroupwithCode: [], ExpenseHeadwithCode: [], VoucherSeries: [],
    ExpenseSubHead: [], EventPlaceName: [], Given: [], FundSource: [], DocNo: [],
  });
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(true);

  const [addOpen,  setAddOpen]  = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addForm,  setAddForm]  = useState(EMPTY_EXPENSE_FORM);
  const [editForm, setEditForm] = useState(EMPTY_EXPENSE_FORM);
  const [saving,   setSaving]   = useState(false);

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  // ── Load Group / Head / VoucherSeries from LoadExpenseHeadDetails ─────────
  useEffect(() => {
    expenseHeadService.load({})
      .then(res => {
        const data = normalizeArray(res?.data);
        setHeadData(data);
        setSuggestions(prev => ({
          ...prev,
          ExpenseGroupwithCode: uniq(data, 'ExpenseGroupwithCode'),
          ExpenseHeadwithCode:  uniq(data, 'ExpenseHeadwithCode'),
          VoucherSeries: uniq(data, 'VoucherSeries').length
            ? uniq(data, 'VoucherSeries')
            : uniq(data, 'Series'),
        }));
      })
      .catch(() => {});
  }, []);

  // ── Pre-load suggestions for combo fields from existing expense records ────
  useEffect(() => {
    expenseService.loadExpenseDetails({})
      .then(res => {
        const data = normalizeArray(res?.data);
        if (!data.length) return;
        setSuggestions(prev => ({
          ...prev,
          ...Object.fromEntries(LIST_SUGGESTION_KEYS.map(k => [k, uniq(data, k)])),
        }));
      })
      .catch(() => {});
  }, []);

  // ── Auto-search on any filter change (debounced 500 ms) ──────────────────
  useEffect(() => {
    const t = setTimeout(handleSearch, 500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const payload = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      // DB stores IsCashMemo as 1/0 — convert the filter value to match
      if (payload.IsCashMemo !== undefined) {
        payload.IsCashMemo = payload.IsCashMemo === 'TRUE' ? 1 : 0;
      }
      const res  = await expenseService.loadExpenseDetails(payload);
      const data = normalizeArray(res?.data);
      setRows(data);
      setSearched(true);
    } catch {
      toast.error('Failed to load expense details');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleClear = () => {
    setFilters({ ...EMPTY_FILTERS, VoucherFromDate: todayStr(), VoucherToDate: todayStr() });
    // auto-search effect re-fires on filter change
  };

  // ── Add ───────────────────────────────────────────────────────────────────
  const openAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setAddForm({ ...EMPTY_EXPENSE_FORM, VoucherDate: today });
    setAddOpen(true);
  };


  const handleAdd = async () => {
    setSaving(true);
    try {
      await expenseService.addExpenseDetails({
        ...addForm,
        IsCashMemo: addForm.IsCashMemo === 'TRUE' ? 1 : 0,
        CreatedBy: user?.username || '',
      });
      toast.success('Expense added');
      setAddOpen(false);
      handleSearch();
    } catch {
      toast.error('Failed to add expense');
    } finally { setSaving(false); }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = (row) => {
    setEditForm({
      VoucherNo:            row.VoucherNo            || '',
      VoucherDate:          toInputDate(row.VoucherDate),
      ExpenseGroupwithCode: row.ExpenseGroupwithCode || '',
      ExpenseHeadwithCode:  row.ExpenseHeadwithCode  || '',
      VoucherSeries:        row.VoucherSeries        || '',
      EventPlaceName:       row.EventPlaceName       || '',
      ExpenseSubHead:       row.ExpenseSubHead       || '',
      IsCashMemo:           isTruthy(row.IsCashMemo) ? 'TRUE' : 'FALSE',
      Given:                row.Given                || '',
      PayMode:              row.PayMode              || '',
      DocNo:                row.DocNo                || '',
      Amount:               row.Amount               != null ? String(row.Amount) : '',
      FundSource:           row.FundSource           || '',
      ExpenseDescription:   row.ExpenseDescription   || '',
      RecordStatus:         row.RecordStatus         || '',
      RecordUpdateReason:   '',
      _prevUpdateReason:    row.RecordUpdateReason   || '',
      _prevUpdateAt:        row.RecordUpdateAt       || '',
      _id: row.ID || row.Id || row.id || '',
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    setSaving(true);
    // Destructure out internal / non-API fields
    const {
      _prevUpdateReason, _prevUpdateAt,
      VoucherNo, _id,
      IsCashMemo,
      ...rest
    } = editForm;
    try {
      await expenseService.updateExpenseDetails({
        ID:               _id,
        EventPlaceName:   rest.EventPlaceName,
        ExpenseGroupwithCode: rest.ExpenseGroupwithCode,
        ExpenseHeadwithCode:  rest.ExpenseHeadwithCode,
        ExpenseSubHead:   rest.ExpenseSubHead,
        VoucherDate:      rest.VoucherDate,
        VoucherSeries:    rest.VoucherSeries,
        IsCashMemo:       IsCashMemo === 'TRUE' ? 1 : 0,
        Given:            rest.Given,
        PayMode:          rest.PayMode,
        DocNo:            rest.DocNo,
        Amount:           rest.Amount,
        FundSource:       rest.FundSource,
        ExpenseDescription:   rest.ExpenseDescription,
        RecordUpdateReason:   rest.RecordUpdateReason,
        RecordUpdateAt:   toMySQLDateTime(),
        RecordStatus:     rest.RecordStatus,
      });
      toast.success('Expense updated');
      setEditOpen(false);
      handleSearch();
    } catch {
      toast.error('Failed to update expense');
    } finally { setSaving(false); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (row) => {
    if (!confirm('Delete this expense record?')) return;
    try {
      await expenseService.deleteExpenseDetails({ ID: row.ID || row.Id || row.id });
      toast.success('Expense deleted');
      setRows(prev => prev.filter(r => r !== row));
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = (_row) => {
    toast('Print not yet connected to an endpoint', { icon: '🖨️' });
  };

  // Client-side IsCashMemo filter.
  // NULL / empty rows are excluded from both Yes and No — only "All" shows them.
  const visibleRows = !filters.IsCashMemo
    ? rows
    : rows.filter(r => {
        const v = r.IsCashMemo;
        if (v == null || v === '') return false;        // exclude NULL from Yes AND No
        return isTruthy(v) === (filters.IsCashMemo === 'TRUE');
      });

  return (
    <div>
      <PageHeader title="Expense Report" subtitle="Search and manage expense records">
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <PlusIcon className="w-3.5 h-3.5 mr-1.5" />Add Expense
        </button>
      </PageHeader>

      <ExpenseFilters
        filters={filters} setF={setF} suggestions={suggestions}
        onClear={handleClear} loading={loading}
      />

      {searched || rows.length > 0 ? (
        <ExpenseTable
          allRows={visibleRows}
          onEdit={openEdit}
          onDelete={handleDelete}
          onPrint={handlePrint}
        />
      ) : (
        <div className="text-center py-16 text-gray-400 bg-white border border-border rounded-lg text-[13px]">
          Use the filters above and click Search to load records.
        </div>
      )}

      <AddExpenseModal
        open={addOpen} onClose={() => setAddOpen(false)}
        form={addForm} setForm={setAddForm}
        suggestions={suggestions} headData={headData} onSave={handleAdd} saving={saving}
      />
      <EditExpenseModal
        open={editOpen} onClose={() => setEditOpen(false)}
        form={editForm} setForm={setEditForm}
        suggestions={suggestions} headData={headData} onSave={handleEdit} saving={saving}
      />
    </div>
  );
}
