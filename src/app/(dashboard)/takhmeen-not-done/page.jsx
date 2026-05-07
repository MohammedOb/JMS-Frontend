'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PageHeader from '@/components/shared/PageHeader';
import { takhmeenService } from '@/services';
import { SearchIcon, XIcon, DownloadIcon, BarChartIcon, FileTextIcon, PrintIcon } from '@/components/shared/Icons';

const INIT_FILTERS = {
  forYear:      '',
  hubSubHead:   '',
  sabeelType:   '',
  sector:       '',
  subsector:    '',
  stayingIn:    '',
  thaaliStatus: '',
};

const PAGE_SIZE_OPTIONS = [
  { label: '100',    value: 100   },
  { label: '500',    value: 500   },
  { label: '1 000',  value: 1000  },
  { label: '5 000',  value: 5000  },
  { label: '10 000', value: 10000 },
  { label: 'All',    value: 0     },
];

const EXPORT_COLS = [
  { key: 'accno',             label: 'Acc No'      },
  { key: 'fullName',          label: 'Full Name'   },
  { key: 'mobile',            label: 'Mobile'      },
  { key: 'mobile1',           label: 'Mobile 1'    },
  { key: 'sector',            label: 'Sector'      },
  { key: 'subsectorWithName', label: 'Subsector'   },
  { key: 'sabeelType',        label: 'Sabeel Type' },
  { key: 'stayingIn',         label: 'Staying In'  },
  { key: 'thaaliStatus',      label: 'FMB Status'  },
];

const str = (v) => String(v ?? '');
const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();

const normalizeRow = (r) => {
  const subsector     = str(r.Subsector     ?? r.subsector     ?? '');
  const subsectorName = str(r.SubsectorName ?? r.subsectorName ?? '');
  return {
    accno:             str(r.AccNo        ?? r.accno        ?? ''),
    fullName:          str(r.FullName     ?? r.fullName     ?? ''),
    mobile:            str(r.Mobile       ?? r.mobile       ?? ''),
    mobile1:           str(r.Mobile1      ?? r.mobile1      ?? ''),
    sector:            str(r.Sector       ?? r.sector       ?? ''),
    subsector,
    subsectorName,
    subsectorWithName: subsector && subsectorName
      ? `${subsector} - ${subsectorName}`
      : subsectorName || subsector,
    sabeelType:        str(r.SabeelType   ?? r.sabeelType   ?? ''),
    hubSubHead:        str(r.HubSubHead   ?? r.hubSubHead   ?? ''),
    stayingIn:         str(r.StayingIn    ?? r.stayingIn    ?? ''),
    thaaliStatus:      str(r.ThaaliStatus ?? r.FMBStatus    ?? r.fmbStatus ?? ''),
    forYear:           str(r.ForYear      ?? r.forYear      ?? ''),
  };
};

const normalizeResults = (data) => {
  if (!data)                    return [];
  if (Array.isArray(data))      return data.map(normalizeRow);
  if (data.recordset)           return data.recordset.map(normalizeRow);
  if (data.recordsets)          return (data.recordsets[0] || []).map(normalizeRow);
  if (Array.isArray(data.data)) return data.data.map(normalizeRow);
  return [];
};

const download = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
};

function PaginationBar({ currentPage, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('…');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  const btnBase  = 'min-w-[30px] h-[30px] px-1.5 rounded text-[11.5px] font-medium border transition-colors';
  const active   = `${btnBase} bg-navy-800 text-white border-navy-800`;
  const inactive = `${btnBase} bg-white text-gray-600 border-border hover:bg-blue-50 hover:border-blue-300`;
  const nav      = `${btnBase} bg-white text-gray-500 border-border hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed`;

  return (
    <div className="flex items-center justify-center gap-1 py-3 flex-wrap">
      <button className={nav} onClick={() => onPage(1)} disabled={currentPage === 1}>«</button>
      <button className={nav} onClick={() => onPage(currentPage - 1)} disabled={currentPage === 1}>‹</button>
      {pages.map((p, i) =>
        p === '…'
          ? <span key={`e${i}`} className="px-1 text-gray-400 text-[12px] select-none">…</span>
          : <button key={p} className={p === currentPage ? active : inactive} onClick={() => onPage(p)}>{p}</button>
      )}
      <button className={nav} onClick={() => onPage(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
      <button className={nav} onClick={() => onPage(totalPages)} disabled={currentPage === totalPages}>»</button>
    </div>
  );
}

export default function TakhmeenNotDonePage() {
  const router        = useRouter();
  const exportBtnRef  = useRef(null);
  const exportMenuRef = useRef(null);

  const [listType,    setListType]    = useState('notDone');
  const [allRows,     setAllRows]     = useState([]);
  const [refRows,     setRefRows]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [showExport,  setShowExport]  = useState(false);
  const [exportPos,   setExportPos]   = useState({});
  const [filters,     setFilters]     = useState(INIT_FILTERS);
  const [pageSize,    setPageSize]    = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  const setF = useCallback((k, v) => setFilters(p => ({ ...p, [k]: v })), []);

  // Load master data once for dropdown options
  useEffect(() => {
    takhmeenService.loadDetails({})
      .then(res => setRefRows(normalizeResults(res.data)))
      .catch(() => {});
  }, []);

  // load accepts the filter snapshot so it can be called with INIT_FILTERS on list-type switch
  const load = useCallback(async (f) => {
    setLoading(true);
    try {
      const common = {
        ForYear:      f.forYear      || null,
        HubSubHead:   f.hubSubHead   || null,
        SabeelType:   f.sabeelType   || null,
        Sector:       f.sector       || null,
        Subsector:    f.subsector    || null,
        ThaaliStatus: f.thaaliStatus || null,
      };
      const res = listType === 'notDone'
        ? await takhmeenService.loadTakhmeenNotDoneList({ ...common, Stayingin: f.stayingIn || null })
        : await takhmeenService.loadNotContributeList({  ...common, StayingIn:  f.stayingIn || null });
      setAllRows(normalizeResults(res.data));
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [listType]);

  // Re-fetch when listType changes (with reset filters)
  useEffect(() => { load(INIT_FILTERS); }, [load]);

  // Reset to page 1 whenever data or page size changes
  useEffect(() => { setCurrentPage(1); }, [allRows, pageSize]);

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

  // Dropdown options derived from master reference data
  const forYears       = useMemo(() => uniq(refRows.map(r => r.forYear)),      [refRows]);
  const hubSubHeads    = useMemo(() => uniq(refRows.map(r => r.hubSubHead)),   [refRows]);
  const sabeelTypes    = useMemo(() => uniq(refRows.map(r => r.sabeelType)),   [refRows]);
  const sectors        = useMemo(() => uniq(refRows.map(r => r.sector)),       [refRows]);
  const stayingIns     = useMemo(() => uniq(refRows.map(r => r.stayingIn)),    [refRows]);
  const thaaliStatuses = useMemo(() => uniq(refRows.map(r => r.thaaliStatus)), [refRows]);

  const subsectorOptions = useMemo(() => {
    const seen = new Set();
    return refRows
      .filter(r => !filters.sector || r.sector === filters.sector)
      .reduce((acc, r) => {
        if (r.subsector && !seen.has(r.subsector)) {
          seen.add(r.subsector);
          acc.push({ code: r.subsector, name: r.subsectorName || r.subsector });
        }
        return acc;
      }, [])
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [refRows, filters.sector]);

  // ── pagination ─────────────────────────────────────────────────────────────

  const effectivePageSize = pageSize === 0 ? allRows.length || 1 : pageSize;
  const totalPages        = Math.max(1, Math.ceil(allRows.length / effectivePageSize));
  const rowOffset         = (currentPage - 1) * effectivePageSize;
  const pagedRows         = pageSize === 0
    ? allRows
    : allRows.slice(rowOffset, rowOffset + effectivePageSize);

  const pageStart = allRows.length === 0 ? 0 : rowOffset + 1;
  const pageEnd   = Math.min(rowOffset + effectivePageSize, allRows.length);

  // ── misc ──────────────────────────────────────────────────────────────────

  const hasFilters   = Object.keys(INIT_FILTERS).some(k => filters[k] !== '');
  const clearFilters = useCallback(() => {
    setFilters(INIT_FILTERS);
    load(INIT_FILTERS);
  }, [load]);

  const listLabel   = listType === 'notDone' ? 'Takhmeen Not Done' : 'Not Contributed';
  const exportLabel = `${allRows.length} records`;

  const toggleExport = () => {
    if (!showExport && exportBtnRef.current) {
      const rect = exportBtnRef.current.getBoundingClientRect();
      setExportPos({ top: rect.bottom + 4, left: rect.left, minWidth: rect.width });
    }
    setShowExport(p => !p);
  };

  // ── export helpers ────────────────────────────────────────────────────────

  const exportCSV = () => {
    const header = EXPORT_COLS.map(c => c.label).join(',');
    const body   = allRows.map(r =>
      EXPORT_COLS.map(c => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    download(
      new Blob([header + '\n' + body.join('\n')], { type: 'text/csv;charset=utf-8;' }),
      `${listType}.csv`
    );
    setShowExport(false);
  };

  const exportExcel = async () => {
    const { utils, writeFile } = await import('xlsx');
    const ws = utils.aoa_to_sheet([
      EXPORT_COLS.map(c => c.label),
      ...allRows.map(r => EXPORT_COLS.map(c => r[c.key] ?? '')),
    ]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, listLabel);
    writeFile(wb, `${listType}.xlsx`);
    setShowExport(false);
  };

  const exportPDF = async () => {
    const { default: jsPDF }     = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(13);
    doc.text(listLabel, 14, 15);
    doc.setFontSize(9);
    doc.text(`${exportLabel} · ${new Date().toLocaleDateString('en-GB')}`, 14, 21);
    autoTable(doc, {
      startY: 26,
      head:   [EXPORT_COLS.map(c => c.label)],
      body:   allRows.map(r => EXPORT_COLS.map(c => String(r[c.key] ?? '—'))),
      styles:            { fontSize: 7, cellPadding: 2 },
      headStyles:        { fillColor: [15, 40, 80], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles:{ fillColor: [245, 247, 250] },
    });
    doc.save(`${listType}.pdf`);
    setShowExport(false);
  };

  const printList = () => {
    const rows = allRows.map((r, i) =>
      `<tr><td>${i + 1}</td>${EXPORT_COLS.map(c => `<td>${r[c.key] ?? '—'}</td>`).join('')}</tr>`
    ).join('');
    const html = `<html><head><title>${listLabel}</title><style>
      body{font-family:sans-serif;font-size:10px}h2{margin-bottom:4px}p{margin:0 0 10px;color:#666;font-size:9px}
      table{width:100%;border-collapse:collapse}th{background:#0f2850;color:#fff;padding:4px 6px;text-align:left;font-size:9px}
      td{padding:3px 6px;border-bottom:1px solid #e5e7eb}tr:nth-child(even) td{background:#f8fafc}
    </style></head><body>
      <h2>${listLabel}</h2><p>${exportLabel} · ${new Date().toLocaleDateString('en-GB')}</p>
      <table>
        <thead><tr><th>#</th>${EXPORT_COLS.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const win = window.open(url, '_blank');
    win.addEventListener('load', () => { win.print(); URL.revokeObjectURL(url); });
    setShowExport(false);
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader title={listLabel} subtitle="Members list based on takhmeen and contribution status" />

      {/* List type toggle */}
      <div className="mb-4">
        <div className="inline-flex rounded-lg border border-border bg-white p-1 gap-1">
          {[
            { value: 'notDone',        label: 'Takhmeen Not Done List' },
            { value: 'notContributed', label: 'Not Contributed'        },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setListType(value); setFilters(INIT_FILTERS); }}
              className={`px-4 py-1.5 text-[12.5px] font-medium rounded-md transition-all ${
                listType === value
                  ? 'bg-navy-800 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="form-label">For Year</label>
              <select className="form-select" value={filters.forYear} onChange={e => setF('forYear', e.target.value)}>
                <option value="">All Years</option>
                {forYears.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Hub Sub Head</label>
              <select className="form-select" value={filters.hubSubHead} onChange={e => setF('hubSubHead', e.target.value)}>
                <option value="">All</option>
                {hubSubHeads.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Sabeel Type</label>
              <select className="form-select" value={filters.sabeelType} onChange={e => setF('sabeelType', e.target.value)}>
                <option value="">All</option>
                {sabeelTypes.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Sector</label>
              <select className="form-select" value={filters.sector}
                onChange={e => setFilters(p => ({ ...p, sector: e.target.value, subsector: '' }))}>
                <option value="">All</option>
                {sectors.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Subsector</label>
              <select className="form-select" value={filters.subsector} onChange={e => setF('subsector', e.target.value)}>
                <option value="">All</option>
                {subsectorOptions.map(s => (
                  <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Staying In</label>
              <select className="form-select" value={filters.stayingIn} onChange={e => setF('stayingIn', e.target.value)}>
                <option value="">All</option>
                {stayingIns.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">FMB Status</label>
              <select className="form-select" value={filters.thaaliStatus} onChange={e => setF('thaaliStatus', e.target.value)}>
                <option value="">All</option>
                {thaaliStatuses.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn btn-primary btn-sm" onClick={() => load(filters)} disabled={loading}>
              <SearchIcon className="w-3.5 h-3.5 mr-1.5" />{loading ? 'Loading…' : 'Search'}
            </button>
            {hasFilters && (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters} disabled={loading}>
                <XIcon className="w-3.5 h-3.5 mr-1.5" />Clear
              </button>
            )}
            <button
              ref={exportBtnRef}
              className="btn btn-secondary btn-sm"
              onClick={toggleExport}
              disabled={allRows.length === 0}
            >
              <DownloadIcon className="w-3.5 h-3.5 mr-1.5" />Export
            </button>

            {/* Page size selector */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11.5px] text-gray-500 whitespace-nowrap">Rows per page:</span>
              <select
                className="form-select !py-1 !text-[12px] !w-auto"
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <span className="text-[12px] font-medium text-navy-800 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 whitespace-nowrap">
              {allRows.length.toLocaleString()} records
            </span>
          </div>
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
              Export {exportLabel}
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

      {/* Table */}
      <div className="card">
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {['S No','Acc No','Full Name','Mobile','Mobile 1','Sector','Subsector','Sabeel Type','Staying In','FMB Status'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-16 text-gray-400">Loading…</td></tr>
              ) : allRows.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-16 text-gray-400">No records found</td></tr>
              ) : pagedRows.map((r, i) => (
                <tr key={rowOffset + i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border text-gray-400">{rowOffset + i + 1}</td>
                  <td className="px-3 py-2.5 border-t border-border text-blue-500 font-semibold cursor-pointer"
                    onClick={() => router.push(`/mumin-details?accno=${r.accno}`)}>{r.accno || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border font-medium">{r.fullName        || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.mobile           || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.mobile1          || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.sector           || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.subsectorWithName || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.sabeelType       || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.stayingIn        || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.thaaliStatus     || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {allRows.length > 0 && (
          <div className="border-t border-border px-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
              <span className="text-[11.5px] text-gray-500">
                Showing {pageStart.toLocaleString()}–{pageEnd.toLocaleString()} of {allRows.length.toLocaleString()} records
              </span>
              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                onPage={setCurrentPage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
