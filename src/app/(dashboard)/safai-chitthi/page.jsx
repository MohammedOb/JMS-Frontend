'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { safaiService } from '@/services';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PageHeader from '@/components/shared/PageHeader';
import Modal from '@/components/shared/Modal';
import ComboBox from '@/components/shared/ComboBox';
import EditSafaiChitthiModal from '@/app/(dashboard)/mumin-details/components/modals/EditSafaiChitthiModal';
import { PrintIcon, EditIcon, TrashIcon, DownloadIcon, BarChartIcon, FileTextIcon } from '@/components/shared/Icons';
import { useAuth } from '@/context/AuthContext';

const fmtExportDate = (val) => {
  if (!val) return '';
  const iso = String(val).split('T')[0];
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return val;
  return `${d}-${m}-${y}`;
};

const EXPORT_COLS = [
  { key: 'SerialNo',    label: 'Serial No'     },
  { key: 'RequestDate', label: 'Request Date',  fmt: fmtExportDate },
  { key: 'AccNo',       label: 'Acc No'         },
  { key: 'FullName',    label: 'Full Name'      },
  { key: 'Mobile',      label: 'Mobile'         },
  { key: 'Mobile1',     label: 'Mobile 1'       },
  { key: 'ITSNo',       label: 'ITS No'         },
  { key: 'Address',     label: 'Address'        },
  { key: 'EventDate',   label: 'Event Date',    fmt: fmtExportDate },
  { key: 'HijriDate',   label: 'Hijri Date'     },
  { key: 'Razafor',     label: 'Raza For'       },
  { key: 'Place',       label: 'Place'          },
  { key: 'EventTime',   label: 'Event Time'     },
  { key: 'Thaal',       label: 'Thaal'          },
  { key: 'Remark',      label: 'Remark'         },
  { key: 'RazaStatus',  label: 'Raza Status'    },
  { key: 'Requestby',   label: 'Request By'     },
  { key: 'Createdby',   label: 'Created By'     },
];

const exportVal = (col, row) => col.fmt ? col.fmt(row[col.key]) : (row[col.key] ?? '');

const toArabicNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
// Converts stored "1447-ذي الحجة-30" OR new "٣٠ ذي الحجة ١٤٤٧" → "٣٠ ذي الحجة ١٤٤٧"
const fmtHijri = (val) => {
  if (!val) return '';
  const m = String(val).match(/^(\d+)-(.+)-(\d+)$/);
  return m ? `${toArabicNum(m[3])}-${m[2]}-${toArabicNum(m[1])}` : val;
};

const pad2         = (n) => String(n).padStart(2, '0');
const today        = () => new Date().toISOString().split('T')[0];
const fmtDate      = (iso) => iso ? iso.split('T')[0] : '';
// Timezone-safe: date-only strings ("2026-05-30") are returned as-is (already local).
// Datetime strings ("2026-05-29T18:30:00.000Z") are converted via local getters.
const toLocalDate  = (iso) => {
  if (!iso) return '';
  const s = String(iso);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d)) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
};
const fmtDisplay   = (iso) => { if (!iso) return '—'; const p = toLocalDate(iso).split('-'); return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : iso; };
const firstOfMonth = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`; };
const lastOfMonth  = () => { const d = new Date(); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0); return `${last.getFullYear()}-${pad2(last.getMonth() + 1)}-${pad2(last.getDate())}`; };

const PAGE_SIZES = [20, 50, 100, 250, 500, 'All'];

const makeEmptyFilters = () => ({
  RazaFor:       [],
  Place:         '',
  RazaStatus:    '',
  EventDateFrom: firstOfMonth(),
  EventDateTo:   lastOfMonth(),
  EventTime:     '',
});

// ─── Multi-select tag input ───────────────────────────────────────────────────

function MultiTagInput({ values, onChange, options, placeholder }) {
  const [inputVal, setInputVal] = useState('');
  const [open,     setOpen]     = useState(false);
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  const q        = inputVal.toLowerCase();
  const filtered = options
    .filter(o => !values.includes(o) && (!q || o.toLowerCase().includes(q)))
    .slice(0, 80);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const addTag    = (val) => { if (!values.includes(val)) onChange([...values, val]); setInputVal(''); setOpen(false); inputRef.current?.focus(); };
  const removeTag = (val) => onChange(values.filter(v => v !== val));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputVal.trim()) addTag(inputVal.trim());
    else if (e.key === 'Backspace' && !inputVal && values.length > 0) removeTag(values[values.length - 1]);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="form-input min-h-[34px] flex flex-wrap gap-1 p-1.5 cursor-text h-auto" onClick={() => inputRef.current?.focus()}>
        {values.map(v => (
          <span key={v} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[11px] px-2 py-0.5 rounded-full shrink-0">
            {v}
            <button type="button" className="hover:text-blue-900 leading-none" onMouseDown={e => { e.stopPropagation(); removeTag(v); }}>×</button>
          </span>
        ))}
        <input ref={inputRef} type="text"
          className="flex-1 min-w-[100px] outline-none bg-transparent text-[12px] py-0.5"
          value={inputVal} placeholder={values.length === 0 ? placeholder : ''} autoComplete="off"
          onChange={e => { setInputVal(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)} onKeyDown={handleKeyDown} />
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-[9999] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-0.5 max-h-52 overflow-y-auto text-[12px]" style={{ top: '100%' }}>
          {filtered.map((o, i) => <li key={i} className="px-3 py-2 hover:bg-blue-50 cursor-pointer" onMouseDown={() => addTag(o)}>{o}</li>)}
        </ul>
      )}
    </div>
  );
}

// ─── Filters panel ────────────────────────────────────────────────────────────

function RazaFilters({ filters, setF, suggestions, loading, onLoad, onClear }) {
  return (
    <div className="bg-white border border-border rounded-lg p-4 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="form-label">Raza For</label>
          <MultiTagInput values={filters.RazaFor} onChange={v => setF('RazaFor', v)}
            options={suggestions.RazaFor} placeholder="Type to add…" />
        </div>
        <div>
          <label className="form-label">Place</label>
          <ComboBox value={filters.Place} options={suggestions.Place}
            placeholder="Type to filter…" onChange={v => setF('Place', v)} />
        </div>
        <div>
          <label className="form-label">Raza Status</label>
          <select className="form-select" value={filters.RazaStatus} onChange={e => setF('RazaStatus', e.target.value)}>
            <option value="">All</option>
            <option value="Raza Done">Raza Done</option>
            <option value="Raza Pending">Raza Pending</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="form-label">Event From</label>
          <input type="date" className="form-input" value={filters.EventDateFrom}
            onChange={e => setF('EventDateFrom', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Event To</label>
          <input type="date" className="form-input" value={filters.EventDateTo}
            onChange={e => setF('EventDateTo', e.target.value)} />
        </div>
        <div>
          <label className="form-label">Event Time</label>
          <ComboBox value={filters.EventTime} options={suggestions.EventTime}
            placeholder="Type to filter…" onChange={v => setF('EventTime', v)} />
        </div>
      </div>

      <div className="flex justify-end items-center gap-2">
        {loading && (
          <span className="text-[12px] text-gray-400 flex items-center gap-1.5">
            <svg className="animate-spin w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading…
          </span>
        )}
        <button className="btn btn-secondary btn-sm" onClick={onClear} disabled={loading}>Clear</button>
        <button className="btn btn-primary btn-sm" onClick={onLoad} disabled={loading}>Reload</button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function SafaiChitthiInner() {
  const router = useRouter();
  const { can } = useAuth();

  const [filters,      setFilters]      = useState(makeEmptyFilters);
  const [allRows,      setAllRows]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [suggestions,  setSuggestions]  = useState({ RazaFor: [], Place: [], EventTime: [] });
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [pageSize,     setPageSize]     = useState(20);
  const [page,         setPage]         = useState(1);

  const [editModal,    setEditModal]    = useState(false);
  const [deleteModal,  setDeleteModal]  = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);

  const [form,         setForm]         = useState({});
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Export dropdown ───────────────────────────────────────────────────────────
  const exportBtnRef  = useRef(null);
  const exportMenuRef = useRef(null);
  const [showExport, setShowExport] = useState(false);
  const [exportPos,  setExportPos]  = useState({});

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }));
  const set  = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Load ALL records — suggestions always from full set
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await safaiService.loadRazaDetails({});
      const raw  = res.data;
      const data = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      setAllRows(data);
      setPage(1);
      const unique = (arr) => [...new Set(arr.filter(Boolean))].sort();
      setSuggestions({
        RazaFor:   unique(data.map(r => r.Razafor)),
        Place:     unique(data.map(r => r.Place)),
        EventTime: unique(data.map(r => r.EventTime)),
      });
    } catch {
      toast.error('Failed to load Raza details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleClear = () => { setFilters(makeEmptyFilters()); setPage(1); };

  // ── Client-side filtering ─────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let result = allRows;
    if (filters.RazaFor?.length)  result = result.filter(r => filters.RazaFor.includes(r.Razafor));
    if (filters.Place)            result = result.filter(r => r.Place?.toLowerCase().includes(filters.Place.toLowerCase()));
    if (filters.RazaStatus)       result = result.filter(r => r.RazaStatus === filters.RazaStatus);
    if (filters.EventDateFrom)    result = result.filter(r => fmtDate(r.EventDate) >= filters.EventDateFrom);
    if (filters.EventDateTo)      result = result.filter(r => fmtDate(r.EventDate) <= filters.EventDateTo);
    if (filters.EventTime)        result = result.filter(r => r.EventTime?.toLowerCase().includes(filters.EventTime.toLowerCase()));
    return result;
  }, [allRows, filters]);

  useEffect(() => { setPage(1); }, [filteredRows]);

  // ── Pagination ────────────────────────────────────────────────────────────────
  const totalRows  = filteredRows.length;
  const pagedRows  = pageSize === 'All' ? filteredRows : filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = pageSize === 'All' ? 1 : Math.max(1, Math.ceil(totalRows / pageSize));

  const handlePageSize = (val) => { setPageSize(val === 'All' ? 'All' : Number(val)); setPage(1); };

  // ── Edit (opens EditSafaiChitthiModal) ───────────────────────────────────────
  const openEdit = (row) => {
    setEditTarget(row);
    setForm({
      RequestDate: toLocalDate(row.RequestDate) || today(),
      EventDate:   toLocalDate(row.EventDate)   || '',
      HijriDate:   row.HijriDate   || '',
      Razafor:     row.Razafor     || '',
      Place:       row.Place       || '',
      EventTime:   row.EventTime   || '',
      Thaal:       row.Thaal       || '',
      Remark:      row.Remark      || '',
      RazaStatus:  row.RazaStatus  || 'Raza Pending',
      Requestby:   row.Requestby   || '',
      Mobile:      row.Mobile      || '',
      Mobile1:     row.Mobile1     || '',
      Address:     row.Address     || '',
    });
    setEditModal(true);
  };

  const handleEdit = async () => {
    if (!form.EventDate) { toast.error('Event Date is required'); return; }
    if (!form.Razafor)   { toast.error('Raza For is required'); return; }
    setSaving(true);
    try {
      await safaiService.updateRazaDetails({ ID: editTarget.ID, ...form });
      toast.success('Raza updated successfully');
      setEditModal(false);
      load();
    } catch {
      toast.error('Failed to update Raza');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const openDelete = (row) => { setDeleteTarget(row); setDeleteModal(true); };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await safaiService.deleteRazaDetails({ ID: deleteTarget.ID });
      toast.success('Raza deleted');
      setDeleteModal(false);
      load();
    } catch {
      toast.error('Failed to delete Raza');
    } finally {
      setDeleting(false);
    }
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
    const body   = filteredRows.map(r =>
      EXPORT_COLS.map(c => `"${String(exportVal(c, r)).replace(/"/g, '""')}"`).join(',')
    );
    download(new Blob([header + '\n' + body.join('\n')], { type: 'text/csv;charset=utf-8;' }), 'safai-chitthi.csv');
    setShowExport(false);
  };

  const exportExcel = async () => {
    const { utils, writeFile } = await import('xlsx');
    const ws = utils.aoa_to_sheet([
      EXPORT_COLS.map(c => c.label),
      ...filteredRows.map(r => EXPORT_COLS.map(c => exportVal(c, r))),
    ]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Safai Chitthi');
    writeFile(wb, 'safai-chitthi.xlsx');
    setShowExport(false);
  };

  const exportPDF = async () => {
    const { default: jsPDF }     = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(13);
    doc.text('Safai Chitthi', 14, 15);
    doc.setFontSize(9);
    doc.text(`${filteredRows.length.toLocaleString()} records · ${new Date().toLocaleDateString('en-GB')}`, 14, 21);
    autoTable(doc, {
      startY: 26,
      head:   [EXPORT_COLS.map(c => c.label)],
      body:   filteredRows.map(r => EXPORT_COLS.map(c => String(exportVal(c, r) || '—'))),
      styles:             { fontSize: 7, cellPadding: 2 },
      headStyles:         { fillColor: [15, 40, 80], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    doc.save('safai-chitthi.pdf');
    setShowExport(false);
  };

  const printList = () => {
    const tableRows = filteredRows.map((r, i) =>
      `<tr><td>${i + 1}</td>${EXPORT_COLS.map(c => `<td>${exportVal(c, r) || '—'}</td>`).join('')}</tr>`
    ).join('');
    const html = `<html><head><title>Safai Chitthi</title><style>
      body{font-family:sans-serif;font-size:10px}h2{margin-bottom:4px}
      p{margin:0 0 10px;color:#666;font-size:9px}
      table{width:100%;border-collapse:collapse}
      th{background:#0f2850;color:#fff;padding:4px 6px;text-align:left;font-size:9px}
      td{padding:3px 6px;border-bottom:1px solid #e5e7eb}
      tr:nth-child(even) td{background:#f8fafc}
    </style></head><body>
      <h2>Safai Chitthi</h2>
      <p>${filteredRows.length.toLocaleString()} records · ${new Date().toLocaleDateString('en-GB')}</p>
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

  // ── Columns ───────────────────────────────────────────────────────────────────
  const MAIN_COLS = ['Action', 'Serial No', 'Request Date', 'Acc No', 'Full Name', 'Mobile', 'Mobile1', 'ITS No', 'Address', 'Event Date', 'Hijri Date', 'Raza for', 'Place', 'Event Time', 'Thaal', 'Remark', 'Raza Status'];
  const MORE_COLS = ['Request by', 'Created by', 'Update Reason', 'Updated At'];
  const visibleCols = showMoreInfo ? [...MAIN_COLS, ...MORE_COLS] : MAIN_COLS;

  return (
    <div>
      <PageHeader title="Safai Chitthi" subtitle="Raza request list" />

      <RazaFilters filters={filters} setF={setF} suggestions={suggestions}
        loading={loading} onLoad={load} onClear={handleClear} />

      <div className="card">
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-border">
          {/* Record count badge */}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-[12px] font-medium text-gray-700 whitespace-nowrap">
            {loading ? '…' : `${totalRows} records`}
          </span>

          {/* Export button */}
          <button
            ref={exportBtnRef}
            className="btn btn-secondary btn-sm"
            onClick={toggleExport}
            disabled={filteredRows.length === 0}
          >
            <DownloadIcon className="w-3.5 h-3.5 mr-1.5" />Export
          </button>

          {/* Page size */}
          <select
            className="border border-border rounded-md text-[12px] px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
            value={pageSize}
            onChange={e => handlePageSize(e.target.value)}
          >
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Show more info checkbox */}
          <label className="flex items-center gap-1.5 text-[12px] text-gray-600 cursor-pointer select-none">
            <input type="checkbox" className="rounded border-gray-300 text-blue-600"
              checked={showMoreInfo} onChange={e => setShowMoreInfo(e.target.checked)} />
            Update info
          </label>

          {/* Pagination controls */}
          {pageSize !== 'All' && totalPages > 1 && (
            <div className="flex items-center gap-1 ml-auto text-[12px] text-gray-500">
              <span className="mr-1">{((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalRows)} / {totalRows}</span>
              <button className="btn btn-secondary btn-sm px-1.5 py-0.5" onClick={() => setPage(1)} disabled={page === 1}>«</button>
              <button className="btn btn-secondary btn-sm px-1.5 py-0.5" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
              <button className="btn btn-secondary btn-sm px-1.5 py-0.5" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
              <button className="btn btn-secondary btn-sm px-1.5 py-0.5" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
            </div>
          )}
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px] whitespace-nowrap">
            <thead>
              <tr>{visibleCols.map(h => <th key={h} className="th-navy">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={visibleCols.length} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : pagedRows.length === 0 ? (
                <tr><td colSpan={visibleCols.length} className="text-center py-10 text-gray-400">No records found</td></tr>
              ) : pagedRows.map((r, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025]">
                  {/* Action — icon only */}
                  <td className="px-2 py-1.5 border-t border-border">
                    <div className="flex gap-1">
                      {can('safai.edit') && (
                        <button className="btn btn-secondary btn-sm p-1.5" title="Edit" onClick={() => openEdit(r)}>
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {can('safai.print') && (
                        <button className="btn btn-secondary btn-sm p-1.5" title="Print" onClick={() => window.print()}>
                          <PrintIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {can('safai.delete') && (
                        <button className="btn btn-sm p-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" title="Delete" onClick={() => openDelete(r)}>
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 border-t border-border font-semibold">{r.SerialNo}</td>
                  <td className="px-3 py-2 border-t border-border">{fmtDisplay(r.RequestDate)}</td>
                  {/* AccNo — clickable, opens Safai Chitthi tab */}
                  <td className="px-3 py-2 border-t border-border font-medium text-blue-600 cursor-pointer hover:underline"
                    onClick={() => router.push(`/mumin-details?accno=${r.AccNo}&tab=safai`)}>
                    {r.AccNo}
                  </td>
                  <td className="px-3 py-2 border-t border-border">{r.FullName}</td>
                  <td className="px-3 py-2 border-t border-border">{r.Mobile}</td>
                  <td className="px-3 py-2 border-t border-border">{r.Mobile1}</td>
                  <td className="px-3 py-2 border-t border-border">{r.ITSNo}</td>
                  <td className="px-3 py-2 border-t border-border">{r.Address}</td>
                  <td className="px-3 py-2 border-t border-border">{fmtDisplay(r.EventDate)}</td>
                  <td className="px-3 py-2 border-t border-border" dir="rtl" style={{ fontFamily: "'AL-KANZ', serif", fontSize: '14px' }}>{fmtHijri(r.HijriDate)}</td>
                  <td className="px-3 py-2 border-t border-border">{r.Razafor}</td>
                  <td className="px-3 py-2 border-t border-border">{r.Place}</td>
                  <td className="px-3 py-2 border-t border-border">{r.EventTime}</td>
                  <td className="px-3 py-2 border-t border-border">{r.Thaal ?? '-'}</td>
                  <td className="px-3 py-2 border-t border-border max-w-[160px] truncate">{r.Remark}</td>
                  <td className="px-3 py-2 border-t border-border">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      r.RazaStatus === 'Raza Done'     ? 'bg-green-600 text-white' :
                      r.RazaStatus === 'Raza Approved' ? 'bg-green-600 text-white' :
                      r.RazaStatus === 'Raza Pending'  ? 'bg-red-600 text-white'   :
                      r.RazaStatus === 'Raza Rejected' ? 'bg-red-400 text-white'   :
                      'bg-gray-400 text-white'
                    }`}>{r.RazaStatus}</span>
                  </td>
                  {showMoreInfo && <>
                    <td className="px-3 py-2 border-t border-border">{r.Requestby ?? '-'}</td>
                    <td className="px-3 py-2 border-t border-border">{r.Createdby ?? '-'}</td>
                    <td className="px-3 py-2 border-t border-border">{r.UpdateReason ?? '-'}</td>
                    <td className="px-3 py-2 border-t border-border">{fmtDisplay(r.UpdatedAt)}</td>
                  </>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export dropdown portal */}
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
              Export {filteredRows.length.toLocaleString()} records
            </div>
            {[
              { icon: BarChartIcon,  label: 'Excel (.xlsx)', action: exportExcel },
              { icon: FileTextIcon,  label: 'CSV (.csv)',    action: exportCSV   },
              { icon: DownloadIcon,  label: 'PDF (.pdf)',    action: exportPDF   },
              { icon: PrintIcon,     label: 'Print',         action: printList   },
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

      {/* Edit Modal — reuses EditSafaiChitthiModal from mumin-details */}
      <EditSafaiChitthiModal
        open={editModal}
        onClose={() => setEditModal(false)}
        editTarget={editTarget}
        form={form}
        set={set}
        saving={saving}
        onSave={handleEdit}
        razaOpts={suggestions.RazaFor}
        placeOpts={suggestions.Place}
        timeOpts={suggestions.EventTime}
      />

      {/* Delete Confirm Modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Raza" size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteModal(false)}>Cancel</button>
            <button className="btn btn-sm bg-red-600 text-white hover:bg-red-700 border-0" onClick={handleDelete} disabled={deleting}>
              <TrashIcon className="w-3.5 h-3.5 mr-1.5" />{deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-[13px] text-gray-600">
          Are you sure you want to delete Sr# <strong>{deleteTarget?.ID}</strong>?
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

export default function SafaiChitthiPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading…</div>}>
      <SafaiChitthiInner />
    </Suspense>
  );
}
