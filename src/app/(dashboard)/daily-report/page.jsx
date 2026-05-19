'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { receiptService, takhmeenService, memberService } from '@/services';
import toast from 'react-hot-toast';
import PageHeader from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/Badge';
import EditReceiptModal from '@/app/(dashboard)/mumin-details/components/modals/EditReceiptModal';
import PrintReceiptModal from '@/app/(dashboard)/mumin-details/components/modals/PrintReceiptModal';
import {
  DownloadIcon, PrintIcon, SearchIcon, XIcon, EditIcon, TrashIcon,
  BarChartIcon, FileTextIcon,
} from '@/components/shared/Icons';
import { useAuth } from '@/context/AuthContext';

const today = () => new Date().toISOString().split('T')[0];
const fmt   = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  const dd   = String(dt.getDate()).padStart(2, '0');
  const mm   = String(dt.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${dt.getFullYear()}`;
};

const PAGE_SIZES = [100, 200, 500, 1000, 2500, 5000, 'All'];

const EXPORT_COLS = [
  { key: 'ReceiptNo',          label: 'Receipt No'        },
  { key: 'ReceivedDate',       label: 'Received Date'     },
  { key: 'AccNo',              label: 'Acc No'            },
  { key: 'ReceivedFrom',       label: 'Received From'     },
  { key: 'ITSNo',              label: 'ITS No'            },
  { key: 'Mobile',             label: 'Mobile'            },
  { key: 'Sector',             label: 'Masjid Area'       },
  { key: 'Subsector',          label: 'Mohalla Code'      },
  { key: 'Amount',             label: 'Amount'            },
  { key: 'Mode',               label: 'Mode'              },
  { key: 'HubMainHead',        label: 'Main Head'         },
  { key: 'HubSubHead',         label: 'Sub Head'          },
  { key: 'ForYear',            label: 'For Year'          },
  { key: 'Remark',             label: 'Remark'            },
  { key: 'RecordUpdateReason', label: 'Update Reason'     },
  { key: 'RecordUpdateDate',   label: 'Update Date'       },
  { key: 'Status',             label: 'Status'            },
  { key: 'Createdby',          label: 'Created By'        },
  { key: 'ContributionType',   label: 'Contribution Type' },
];

// base columns excluding the two Update columns
const BASE_COL_COUNT = 17; // Actions + 16 data cols

const normalizeArr = (data) => {
  if (!data) return [];
  if (Array.isArray(data))       return data;
  if (Array.isArray(data.data))  return data.data;
  if (data.recordset)            return data.recordset;
  if (data.recordsets)           return data.recordsets[0] ?? [];
  return [];
};

export default function DailyReportPage() {
  const router = useRouter();
  const { can, user } = useAuth();

  // ── Lookup data ──────────────────────────────────────────────────────────────
  const [hubHeads,    setHubHeads]    = useState([]);
  const [mohallaRows, setMohallaRows] = useState([]);

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    ReceivedFromDate: today(),
    ReceivedToDate:   today(),
    Mode:        '',
    HubMainHead: '',
    HubSubHead:  '',
    ForYear:     '',
    Sector:      '',
    Subsector:   '',
  });

  // ── Results ──────────────────────────────────────────────────────────────────
  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  // ── Pagination ───────────────────────────────────────────────────────────────
  const [pageSize,    setPageSize]    = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  // ── UI toggles ───────────────────────────────────────────────────────────────
  const [showUpdateInfo, setShowUpdateInfo] = useState(false);

  // ── Edit modal ───────────────────────────────────────────────────────────────
  const [editModal,  setEditModal]  = useState(false);
  const [editRow,    setEditRow]    = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [rcForm,     setRcForm]     = useState(null);

  // ── Print modal ──────────────────────────────────────────────────────────────
  const [printModal, setPrintModal] = useState(false);
  const [printData,  setPrintData]  = useState(null);

  // ── Export dropdown ──────────────────────────────────────────────────────────
  const exportBtnRef  = useRef(null);
  const exportMenuRef = useRef(null);
  const [showExport, setShowExport] = useState(false);
  const [exportPos,  setExportPos]  = useState({});

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  // ── Load lookup data on mount ────────────────────────────────────────────────
  useEffect(() => {
    takhmeenService.loadHubHeadDetails({})
      .then(res => setHubHeads(normalizeArr(res.data)))
      .catch(() => {});

    memberService.loadMohallaDetails({ Sector: '', Subsector: '', MohallaDescription: '' })
      .then(res => setMohallaRows(normalizeArr(res.data)))
      .catch(() => {});
  }, []);

  // ── Cascaded dropdown options ────────────────────────────────────────────────
  const mainHeadOptions = useMemo(() => {
    const map = new Map(); // mainHead -> isActive (true if any sub head is active)
    hubHeads.forEach(h => {
      if (!h.HubMainHead) return;
      const active = h.IsActive === 1 || h.IsActive === '1';
      map.set(h.HubMainHead, (map.get(h.HubMainHead) ?? false) || active);
    });
    return [...map.entries()]
      .map(([name, active]) => ({ name, active }))
      .sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [hubHeads]);

  const subHeadOptions = useMemo(() => {
    const seen = new Map(); // subHead -> isActive
    hubHeads
      .filter(h => !filters.HubMainHead || h.HubMainHead === filters.HubMainHead)
      .forEach(h => {
        if (!h.HubSubHead) return;
        const active = h.IsActive === 1 || h.IsActive === '1';
        seen.set(h.HubSubHead, (seen.get(h.HubSubHead) ?? false) || active);
      });
    return [...seen.entries()]
      .map(([name, active]) => ({ name, active }))
      .sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [hubHeads, filters.HubMainHead]);

  const sectorOptions = useMemo(() =>
    [...new Set(mohallaRows.map(r => String(r.Sector ?? r.sector ?? '')).filter(Boolean))].sort(),
    [mohallaRows]
  );

  const subsectorOptions = useMemo(() => {
    const seen = new Set();
    return mohallaRows
      .filter(r => !filters.Sector || String(r.Sector ?? r.sector ?? '') === filters.Sector)
      .reduce((acc, r) => {
        const code = String(r.Subsector ?? r.subsector ?? '').trim();
        const name = String(r.MohallaDescription ?? r.SubsectorName ?? '').trim();
        if (code && !seen.has(code)) {
          seen.add(code);
          acc.push({ code, name: name || code });
        }
        return acc;
      }, [])
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [mohallaRows, filters.Sector]);

  const yearOptions = useMemo(() => {
    const now = new Date();
    const fy  = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return Array.from({ length: 6 }, (_, i) => {
      const y = fy - i;
      return (y % 100).toString().padStart(2, '0') + ((y + 1) % 100).toString().padStart(2, '0');
    });
  }, []);

  // ── Search ───────────────────────────────────────────────────────────────────
  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.ReceivedFromDate) params.ReceivedFromDate = filters.ReceivedFromDate;
      if (filters.ReceivedToDate)   params.ReceivedToDate   = filters.ReceivedToDate;
      if (filters.Mode)             params.Mode             = filters.Mode;
      if (filters.HubMainHead)      params.HubMainHead      = filters.HubMainHead;
      if (filters.HubSubHead)       params.HubSubHead       = filters.HubSubHead;
      if (filters.ForYear)          params.ForYear          = filters.ForYear;
      if (filters.Sector)           params.Sector           = filters.Sector;
      if (filters.Subsector)        params.Subsector        = filters.Subsector;

      const res  = await receiptService.loadTransactionDetails(params);
      const data = normalizeArr(res.data);
      setRows(data);
      setSearched(true);
      setCurrentPage(1);
    } catch {
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const clearFilters = () => setFilters({
    ReceivedFromDate: today(), ReceivedToDate: today(),
    Mode: '', HubMainHead: '', HubSubHead: '', ForYear: '', Sector: '', Subsector: '',
  });

  // ── Pagination ───────────────────────────────────────────────────────────────
  const totalPages = pageSize === 'All' ? 1 : Math.ceil(rows.length / pageSize);

  const pagedRows = useMemo(() => {
    if (pageSize === 'All') return rows;
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, pageSize, currentPage]);

  // ── Summary data ─────────────────────────────────────────────────────────────
  const grandTotal = useMemo(() =>
    rows.reduce((s, r) => s + (Number(r.Amount) || 0), 0),
    [rows]
  );

  const headSummary = useMemo(() => {
    const map = new Map();
    rows.forEach(r => {
      const key = `${r.HubSubHead || '—'}|${r.ForYear || '—'}`;
      if (!map.has(key)) map.set(key, { headType: r.HubSubHead || '—', forYear: r.ForYear || '—', total: 0 });
      map.get(key).total += Number(r.Amount) || 0;
    });
    return Array.from(map.values())
      .sort((a, b) => a.headType.localeCompare(b.headType) || String(a.forYear).localeCompare(String(b.forYear)));
  }, [rows]);

  const modeSummary = useMemo(() => {
    const map = new Map();
    rows.forEach(r => {
      const key = r.Mode || 'Unknown';
      if (!map.has(key)) map.set(key, { mode: key, total: 0 });
      map.get(key).total += Number(r.Amount) || 0;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [rows]);

  // ── Edit handlers ─────────────────────────────────────────────────────────────
  const handleEdit = (row) => {
    setEditRow(row);
    setEditMember({
      accno:  row.AccNo,
      name:   row.ReceivedFrom || '',
      mobile: row.Mobile || '',
      itsNo:  row.ITSNo  || '',
      hofIts: '',
      sector: row.Sector || '',
    });
    setRcForm({
      receiptNo:          row.ReceiptNo,
      receivedDate:       row.ReceivedDate,
      mode:               row.Mode || 'Cash',
      status:             row.Status || 'Clear',
      updateReason:       '',
      RecordUpdateReason: row.RecordUpdateReason || '',
      RecordUpdateDate:   row.RecordUpdateDate   || '',
      fullName:           row.ReceivedFrom || '',
      itsNo:              row.ITSNo   || '',
      mobile:             row.Mobile  || '',
      amount:             Number(row.Amount) || 0,
      items: [{
        subHead:  row.HubSubHead  || '',
        mainHead: row.HubMainHead || '',
        forYear:  row.ForYear     || '',
        amount:   Number(row.Amount) || 0,
        remark:   row.Remark || '',
        grade:    row.Grade  || '',
      }],
    });
    setEditModal(true);
  };

  const saveEdit = async () => {
    if (!rcForm?.updateReason?.trim()) {
      toast.error('Please enter a reason for this update');
      return;
    }
    try {
      await receiptService.updateTransaction({
        ID:                 editRow.ID,
        ReceivedFrom:       rcForm.fullName || editRow.ReceivedFrom,
        Mobile:             rcForm.mobile   || editRow.Mobile,
        ITSNo:              rcForm.itsNo    || editRow.ITSNo,
        ReceivedDate:       rcForm.receivedDate,
        Mode:               rcForm.mode,
        Status:             rcForm.status,
        RecordUpdateReason: rcForm.updateReason,
        RecordUpdateDate:   new Date().toISOString(),
        ReceivedAmount:     rcForm.items?.reduce((s, it) => s + (Number(it.amount) || 0), 0) ?? rcForm.amount,
        Remark:             rcForm.items?.[0]?.remark ?? '',
      });
      toast.success('Receipt updated');
      setEditModal(false);
      search();
    } catch {
      toast.error('Failed to update receipt');
    }
  };

  const handleCancel = async (row) => {
    if (!window.confirm(`Cancel receipt #${row.ReceiptNo}? This cannot be undone.`)) return;
    try {
      await receiptService.cancel(row.ID);
      toast.success(`Receipt #${row.ReceiptNo} cancelled`);
      search();
    } catch {
      toast.error('Failed to cancel receipt');
    }
  };

  // ── Print handler ─────────────────────────────────────────────────────────────
  const handlePrint = (row) => {
    setPrintData({
      member: {
        name:   row.ReceivedFrom || '',
        accno:  row.AccNo,
        mobile: row.Mobile || '',
      },
      receipt: {
        receiptNo:    row.ReceiptNo,
        receivedDate: row.ReceivedDate,
        mode:         row.Mode,
        status:       row.Status,
        mainHead:     row.HubMainHead,
        subHead:      row.HubSubHead,
        forYear:      row.ForYear,
        amount:       Number(row.Amount) || 0,
      },
    });
    setPrintModal(true);
  };

  // ── Export helpers ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (
        exportBtnRef.current  && !exportBtnRef.current.contains(e.target) &&
        exportMenuRef.current && !exportMenuRef.current.contains(e.target)
      ) setShowExport(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleExport = () => {
    if (!showExport && exportBtnRef.current) {
      const r = exportBtnRef.current.getBoundingClientRect();
      setExportPos({ top: r.bottom + 4, left: r.left, minWidth: r.width });
    }
    setShowExport(p => !p);
  };

  const download = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: filename }).click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const header = EXPORT_COLS.map(c => c.label).join(',');
    const body   = rows.map(r =>
      EXPORT_COLS.map(c => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    download(new Blob([header + '\n' + body.join('\n')], { type: 'text/csv;charset=utf-8;' }), 'receipts.csv');
    setShowExport(false);
  };

  const exportExcel = async () => {
    const { utils, writeFile } = await import('xlsx');
    const ws = utils.aoa_to_sheet([
      EXPORT_COLS.map(c => c.label),
      ...rows.map(r => EXPORT_COLS.map(c => r[c.key] ?? '')),
    ]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Receipts');
    writeFile(wb, 'receipts.xlsx');
    setShowExport(false);
  };

  const exportPDF = async () => {
    const { default: jsPDF }     = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(13);
    doc.text('Receipt List', 14, 15);
    doc.setFontSize(9);
    doc.text(`${rows.length.toLocaleString()} records · ${new Date().toLocaleDateString('en-GB')}`, 14, 21);
    autoTable(doc, {
      startY: 26,
      head:   [EXPORT_COLS.map(c => c.label)],
      body:   rows.map(r => EXPORT_COLS.map(c => String(r[c.key] ?? '—'))),
      styles:             { fontSize: 7, cellPadding: 2 },
      headStyles:         { fillColor: [15, 40, 80], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    doc.save('receipts.pdf');
    setShowExport(false);
  };

  const printList = () => {
    const tableRows = rows.map((r, i) =>
      `<tr><td>${i + 1}</td>${EXPORT_COLS.map(c => `<td>${r[c.key] ?? '—'}</td>`).join('')}</tr>`
    ).join('');
    const html = `<html><head><title>Receipt List</title><style>
      body{font-family:sans-serif;font-size:10px}h2{margin-bottom:4px}
      p{margin:0 0 10px;color:#666;font-size:9px}
      table{width:100%;border-collapse:collapse}
      th{background:#0f2850;color:#fff;padding:4px 6px;text-align:left;font-size:9px}
      td{padding:3px 6px;border-bottom:1px solid #e5e7eb}
      tr:nth-child(even) td{background:#f8fafc}
    </style></head><body>
      <h2>Receipt List</h2>
      <p>${rows.length.toLocaleString()} records · ${new Date().toLocaleDateString('en-GB')}</p>
      <table>
        <thead><tr><th>#</th>${EXPORT_COLS.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const win = window.open(url, '_blank');
    win.addEventListener('load', () => { win.print(); URL.revokeObjectURL(url); });
    setShowExport(false);
  };

  const colCount = BASE_COL_COUNT + (showUpdateInfo ? 2 : 0);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Receipt List" subtitle="SP: LoadTransactionDetails" />

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-border rounded-lg p-4 mb-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="form-label">From Date</label>
            <input type="date" className="form-input w-[130px]"
              value={filters.ReceivedFromDate}
              onChange={e => setF('ReceivedFromDate', e.target.value)} />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input type="date" className="form-input w-[130px]"
              value={filters.ReceivedToDate}
              onChange={e => setF('ReceivedToDate', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Mode</label>
            <select className="form-select w-[90px]" value={filters.Mode} onChange={e => setF('Mode', e.target.value)}>
              <option value="">All</option>
              {['Cash', 'Bank', 'Cheque', 'Online', 'UPI'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Main Head</label>
            <select className="form-select w-[110px]" value={filters.HubMainHead}
              onChange={e => setFilters(p => ({ ...p, HubMainHead: e.target.value, HubSubHead: '' }))}>
              <option value="">All</option>
              {mainHeadOptions.map(h => (
                <option key={h.name} value={h.name}>{h.name}{!h.active ? ' (Inactive)' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Sub Head</label>
            <select className="form-select w-[160px]" value={filters.HubSubHead}
              onChange={e => setF('HubSubHead', e.target.value)}>
              <option value="">All</option>
              {subHeadOptions.map(h => (
                <option key={h.name} value={h.name}>{h.name}{!h.active ? ' (Inactive)' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">For Year</label>
            <select className="form-select w-[95px]" value={filters.ForYear}
              onChange={e => setF('ForYear', e.target.value)}>
              <option value="">All</option>
              {yearOptions.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Sector</label>
            <select className="form-select w-[85px]" value={filters.Sector}
              onChange={e => setFilters(p => ({ ...p, Sector: e.target.value, Subsector: '' }))}>
              <option value="">All</option>
              {sectorOptions.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Subsector</label>
            <select className="form-select w-[160px]" value={filters.Subsector}
              onChange={e => setF('Subsector', e.target.value)}>
              <option value="">All</option>
              {subsectorOptions.map(s => (
                <option key={s.code} value={s.code}>{s.code} – {s.name}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
            <XIcon className="w-3.5 h-3.5 mr-1.5" />Clear
          </button>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        {/* Left: Search + Export + checkbox */}
        <div className="flex items-center gap-2">
          <button className="btn btn-primary btn-sm" onClick={search} disabled={loading}>
            <SearchIcon className="w-3.5 h-3.5 mr-1.5" />
            {loading ? 'Loading…' : 'Search'}
          </button>
          {can('daily_report.export') && (
          <button
            ref={exportBtnRef}
            className="btn btn-secondary btn-sm"
            onClick={toggleExport}
            disabled={rows.length === 0}
          >
            <DownloadIcon className="w-3.5 h-3.5 mr-1.5" />Export
          </button>
          )}
          <label className="flex items-center gap-1.5 ml-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showUpdateInfo}
              onChange={e => setShowUpdateInfo(e.target.checked)}
              className="w-3.5 h-3.5 accent-blue-600"
            />
            <span className="text-[12px] text-gray-600">Show Updated by</span>
          </label>
        </div>

        {/* Right: Rows per page + record count badge */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-500">Rows per page:</span>
          <select
            className="form-select w-[75px] py-1 text-[12px]"
            value={pageSize}
            onChange={e => {
              setPageSize(e.target.value === 'All' ? 'All' : Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {searched && (
            <span className="text-[12px] font-semibold text-navy-800 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md whitespace-nowrap">
              {rows.length.toLocaleString()} records
            </span>
          )}
        </div>
      </div>

      {/* ── Export dropdown portal ────────────────────────────────────────────── */}
      {typeof document !== 'undefined' && createPortal(
        showExport && (
          <div
            ref={exportMenuRef}
            style={{
              position: 'fixed', ...exportPos, zIndex: 9999,
              background: '#fff', border: '1px solid var(--border,#e2e8f0)',
              borderRadius: '0.5rem', boxShadow: '0 8px 20px rgba(0,0,0,0.13)',
            }}
          >
            <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-border">
              Export {rows.length.toLocaleString()} records
            </div>
            {[
              { icon: BarChartIcon, label: 'Excel (.xlsx)', action: exportExcel },
              { icon: FileTextIcon, label: 'CSV (.csv)',    action: exportCSV   },
              { icon: DownloadIcon, label: 'PDF (.pdf)',    action: exportPDF   },
              { icon: PrintIcon,    label: 'Print',         action: printList   },
            ].map(({ icon: Icon, label, action }) => (
              <button key={label} onClick={action}
                className="w-full text-left px-4 py-2 text-[12.5px] hover:bg-blue-500/[0.08] flex items-center gap-2">
                <Icon className="w-4 h-4 text-gray-500" />{label}
              </button>
            ))}
          </div>
        ),
        document.body
      )}

      {/* ── Main table ───────────────────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12px] min-w-max">
            <thead>
              <tr>
                <th className="th-navy">Actions</th>
                <th className="th-navy">Receipt #</th>
                <th className="th-navy">Received Date</th>
                <th className="th-navy">Acc No</th>
                <th className="th-navy">Received From</th>
                <th className="th-navy">ITS No</th>
                <th className="th-navy">Mobile</th>
                <th className="th-navy">Masjid Area</th>
                <th className="th-navy">Mohalla Code</th>
                <th className="th-navy">Amount</th>
                <th className="th-navy">Mode</th>
                <th className="th-navy">Main Head</th>
                <th className="th-navy">Sub Head</th>
                <th className="th-navy">For Year</th>
                <th className="th-navy">Remark</th>
                <th className="th-navy">Status</th>
                <th className="th-navy">Created By</th>
                {showUpdateInfo && <>
                  <th className="th-navy">Update Reason</th>
                  <th className="th-navy">Update Date</th>
                </>}
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan={colCount} className="text-center py-12 text-gray-400">
                  Set filters and click Search
                </td></tr>
              ) : loading ? (
                <tr><td colSpan={colCount} className="text-center py-12 text-gray-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={colCount} className="text-center py-12 text-gray-400">No receipts found</td></tr>
              ) : pagedRows.map((r, i) => {
                const cancelled = String(r.Status ?? '').toLowerCase().includes('cancel');
                const td = `px-3 py-2.5 border-t border-border whitespace-nowrap`;
                return (
                  <tr key={i} className={cancelled ? 'bg-red-50' : 'hover:bg-blue-500/[0.025]'}>

                    {/* Actions */}
                    <td className={`${td} w-[76px]`}>
                      <div className="flex items-center gap-0.5">
                        {can('daily_report.edit') && (
                        <button
                          title="Edit receipt"
                          onClick={() => handleEdit(r)}
                          className="p-1.5 rounded text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                          )}
                        <button
                          title="Print preview"
                          onClick={() => handlePrint(r)}
                          className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <PrintIcon className="w-3.5 h-3.5" />
                        </button>
                        {can('daily_report.cancel') && !cancelled && (
                          <button
                            title="Cancel receipt"
                            onClick={() => handleCancel(r)}
                            className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className={`${td} text-blue-500 font-semibold`}>#{r.ReceiptNo}</td>
                    <td className={td}>{fmtDate(r.ReceivedDate)}</td>

                    {/* AccNo → navigate to mumin profile */}
                    <td
                      className={`${td} text-blue-500 cursor-pointer hover:underline underline-offset-2`}
                      onClick={() => router.push(`/mumin-details?accno=${r.AccNo}`)}
                    >
                      {r.AccNo}
                    </td>

                    <td className={`${td} !whitespace-normal max-w-[180px]`}>{r.ReceivedFrom || '—'}</td>
                    <td className={td}>{r.ITSNo    || '—'}</td>
                    <td className={td}>{r.Mobile   || '—'}</td>
                    <td className={td}>{r.Sector   || '—'}</td>
                    <td className={td}>{r.Subsector || '—'}</td>
                    <td className={`${td} font-semibold`}>{fmt(r.Amount)}</td>
                    <td className={td}>{r.Mode      || '—'}</td>
                    <td className={td}>{r.HubMainHead || '—'}</td>
                    <td className={td}>{r.HubSubHead  || '—'}</td>
                    <td className={td}>{r.ForYear     || '—'}</td>
                    <td className={`${td} !whitespace-normal max-w-[160px]`} title={r.Remark || ''}>
                      {r.Remark || '—'}
                    </td>
                    <td className={td}><StatusBadge status={r.Status} /></td>
                    <td className={td}>{r.Createdby || '—'}</td>

                    {/* Update Info — only visible when checkbox ON, full text shown */}
                    {showUpdateInfo && <>
                      <td className={`${td} !whitespace-normal max-w-[220px]`}>
                        {r.RecordUpdateReason || '—'}
                      </td>
                      <td className={td}>
                        {r.RecordUpdateDate ? fmtDate(r.RecordUpdateDate) : '—'}
                      </td>
                    </>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {searched && rows.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
            <span className="text-[11px] text-gray-500">
              Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, rows.length)} of {rows.length.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              <button className="btn btn-secondary btn-sm px-2 disabled:opacity-40"
                disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>«</button>
              <button className="btn btn-secondary btn-sm px-2 disabled:opacity-40"
                disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹</button>
              <span className="text-[11px] text-gray-500 px-2">Page {currentPage} of {totalPages}</span>
              <button className="btn btn-secondary btn-sm px-2 disabled:opacity-40"
                disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>›</button>
              <button className="btn btn-secondary btn-sm px-2 disabled:opacity-40"
                disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>»</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Summary tables ────────────────────────────────────────────────────── */}
      {searched && rows.length > 0 && (
        <div className="grid grid-cols-2 gap-4">

          {/* Head Summary */}
          <div className="card">
            <div className="card-header text-[12px]">Head Summary</div>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  <th className="th-navy">Head Type</th>
                  <th className="th-navy">For Year</th>
                  <th className="th-navy">Amount</th>
                </tr>
              </thead>
              <tbody>
                {headSummary.map((s, i) => (
                  <tr key={i} className="hover:bg-blue-500/[0.025]">
                    <td className="px-3 py-2 border-t border-border">{s.headType}</td>
                    <td className="px-3 py-2 border-t border-border">{s.forYear}</td>
                    <td className="px-3 py-2 border-t border-border font-semibold">{fmt(s.total)}</td>
                  </tr>
                ))}
                <tr className="bg-surface font-semibold">
                  <td className="px-3 py-2 border-t border-border" colSpan={2}>Grand Total</td>
                  <td className="px-3 py-2 border-t border-border">{fmt(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount / Mode Summary */}
          <div className="card">
            <div className="card-header text-[12px]">Amount Summary</div>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  <th className="th-navy">Mode</th>
                  <th className="th-navy">Amount</th>
                </tr>
              </thead>
              <tbody>
                {modeSummary.map((s, i) => (
                  <tr key={i} className="hover:bg-blue-500/[0.025]">
                    <td className="px-3 py-2 border-t border-border">{s.mode}</td>
                    <td className="px-3 py-2 border-t border-border font-semibold">{fmt(s.total)}</td>
                  </tr>
                ))}
                <tr className="bg-surface font-semibold">
                  <td className="px-3 py-2 border-t border-border">Grand Total</td>
                  <td className="px-3 py-2 border-t border-border">{fmt(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ── Edit Receipt Modal ────────────────────────────────────────────────── */}
      {editModal && rcForm && (
        <EditReceiptModal
          open={editModal}
          onClose={() => setEditModal(false)}
          member={editMember}
          rcForm={rcForm}
          setRcForm={setRcForm}
          onSave={saveEdit}
          onPrint={() => { setEditModal(false); handlePrint(editRow); }}
        />
      )}

      {/* ── Print Receipt Modal ───────────────────────────────────────────────── */}
      {printModal && printData && (
        <PrintReceiptModal
          open={printModal}
          onClose={() => setPrintModal(false)}
          member={printData.member}
          receipt={printData.receipt}
        />
      )}
    </div>
  );
}
