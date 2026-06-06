'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PageHeader from '@/components/shared/PageHeader';
import { takhmeenService, memberService, lookupService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { SearchIcon, XIcon, DownloadIcon, BarChartIcon, FileTextIcon, PrintIcon, SendIcon } from '@/components/shared/Icons';
import WAReminderModal from './components/WAReminderModal';
import WABulkModal     from './components/WABulkModal';
import WAQueuePanel    from './components/WAQueuePanel';

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
  const { user, hasScope } = useAuth();

  const allowedSubHeadSet = useMemo(() => {
    if (!user) return null;
    if (Array.isArray(user.roles) && user.roles.includes('super_admin')) return null;
    if (!user.scopes) return null;
    const skip = new Set(['sector', 'Sector', 'ForYear', 'createdBy', 'HubMainHead']);
    const allowed = [];
    Object.entries(user.scopes).forEach(([type, arr]) => {
      if (!skip.has(type) && Array.isArray(arr) && arr.length > 0)
        allowed.push(...arr.map(v => v.toLowerCase()));
    });
    return allowed.length > 0 ? new Set(allowed) : null;
  }, [user]);

  const [listType,      setListType]      = useState('notDone');
  const [allRows,       setAllRows]       = useState([]);
  const [hubHeadRows,   setHubHeadRows]   = useState([]);
  const [mohallaRows,   setMohallaRows]   = useState([]);
  const [forYears,      setForYears]      = useState([]);
  const [sabeelTypes,   setSabeelTypes]   = useState([]);
  const [stayingIns,    setStayingIns]    = useState([]);
  const [thaaliStatuses,setThaaliStatuses]= useState([]);
  const [loading,      setLoading]      = useState(false);
  const [showExport,   setShowExport]   = useState(false);
  const [exportPos,    setExportPos]    = useState({});
  const [filters,      setFilters]      = useState(INIT_FILTERS);
  const [pageSize,     setPageSize]     = useState(100);
  const [currentPage,  setCurrentPage]  = useState(1);

  // ── WhatsApp reminder state ───────────────────────────────────────────────
  const [selectedAccnos, setSelectedAccnos] = useState(new Set());
  const [waReminderRow,  setWaReminderRow]  = useState(null);
  const [waBulkRows,     setWaBulkRows]     = useState([]);
  const [waBulkOpen,     setWaBulkOpen]     = useState(false);

  const setF = useCallback((k, v) => setFilters(p => ({ ...p, [k]: v })), []);

  // Load lookup data once for dropdown options
  useEffect(() => {
    takhmeenService.loadHubHeadDetails({})
      .then(res => {
        const data = res.data;
        const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : data?.recordset ?? data?.recordsets?.[0] ?? [];
        setHubHeadRows(raw);
      })
      .catch(() => {});
    memberService.loadMohallaDetails({ Sector: '', Subsector: '', MohallaDescription: '' })
      .then(res => {
        const data = res.data;
        const raw = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : data?.recordset ?? data?.recordsets?.[0] ?? [];
        setMohallaRows(raw);
      })
      .catch(() => {});
    lookupService.getYears()         .then(res => setForYears(Array.isArray(res.data?.data) ? res.data.data : [])).catch(() => {});
    lookupService.getSabeelTypes()   .then(res => setSabeelTypes(Array.isArray(res.data?.data) ? res.data.data : [])).catch(() => {});
    lookupService.getStayingIn()     .then(res => setStayingIns(Array.isArray(res.data?.data) ? res.data.data : [])).catch(() => {});
    lookupService.getThaliStatuses() .then(res => setThaaliStatuses(Array.isArray(res.data?.data) ? res.data.data : [])).catch(() => {});
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

  // Dropdown options
  const hubSubHeads    = useMemo(() => {
    const seen = new Map();
    hubHeadRows.forEach(r => {
      const name = String(r.HubSubHead ?? '').trim();
      if (!name) return;
      const active = r.IsActive === 1 || r.IsActive === '1';
      seen.set(name, (seen.get(name) ?? false) || active);
    });
    return [...seen.entries()]
      .map(([name, active]) => ({ name, active }))
      .filter(h => !allowedSubHeadSet || allowedSubHeadSet.has(h.name.toLowerCase()))
      .sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [hubHeadRows, allowedSubHeadSet]);

  const scopedForYears = useMemo(() =>
    forYears.filter(y => hasScope('ForYear', y)),
    [forYears, hasScope]);

  const sectors        = useMemo(() =>
    uniq(mohallaRows.map(r => String(r.Sector ?? r.sector ?? '').trim()))
      .filter(s => hasScope('sector', s)),
    [mohallaRows, hasScope]);

  const subsectorOptions = useMemo(() => {
    const seen = new Set();
    return mohallaRows
      .filter(r => {
        const s = String(r.Sector ?? r.sector ?? '').trim();
        if (filters.sector) return s === filters.sector;
        return hasScope('sector', s);
      })
      .reduce((acc, r) => {
        const code = String(r.Subsector ?? r.subsector ?? '').trim();
        const name = String(r.MohallaDescription ?? r.SubsectorName ?? r.subsectorName ?? '').trim();
        if (code && !seen.has(code)) {
          seen.add(code);
          acc.push({ code, name: name || code });
        }
        return acc;
      }, [])
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [mohallaRows, filters.sector, hasScope]);

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

  // ── Checkbox helpers ──────────────────────────────────────────────────────
  const isAllSelected = allRows.length > 0 && allRows.every(r => selectedAccnos.has(r.accno));

  const toggleRow = useCallback((accno) => {
    setSelectedAccnos(prev => {
      const next = new Set(prev);
      next.has(accno) ? next.delete(accno) : next.add(accno);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedAccnos(prev => {
      const allSelected = allRows.every(r => prev.has(r.accno));
      if (allSelected) return new Set();
      return new Set(allRows.map(r => r.accno));
    });
  }, [allRows]);

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
              onClick={() => { setListType(value); setFilters(INIT_FILTERS); setSelectedAccnos(new Set()); }}
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
                {scopedForYears.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Hub Sub Head</label>
              <select className="form-select" value={filters.hubSubHead} onChange={e => setF('hubSubHead', e.target.value)}>
                <option value="">All</option>
                {hubSubHeads.map(h => (
                  <option key={h.name} value={h.name}>{h.name}{!h.active ? ' (Inactive)' : ''}</option>
                ))}
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

      {/* WhatsApp queue status panel */}
      <WAQueuePanel />

      {/* WhatsApp bulk action bar */}
      {allRows.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[11.5px] text-gray-500">
            {selectedAccnos.size > 0
              ? `${selectedAccnos.size} selected`
              : 'Select rows for bulk reminder'}
          </span>
          <button
            className="btn btn-sm bg-green-600 text-white border-green-600 hover:bg-green-700"
            disabled={selectedAccnos.size === 0}
            onClick={() => {
              setWaBulkRows(allRows.filter(r => selectedAccnos.has(r.accno)));
              setWaBulkOpen(true);
            }}
          >
            <SendIcon className="w-3.5 h-3.5 mr-1.5" />
            Send Selected ({selectedAccnos.size})
          </button>
          <button
            className="btn btn-sm bg-green-700 text-white border-green-700 hover:bg-green-800"
            onClick={() => {
              setWaBulkRows(allRows);
              setWaBulkOpen(true);
            }}
          >
            <SendIcon className="w-3.5 h-3.5 mr-1.5" />
            Send All ({allRows.length})
          </button>
          {selectedAccnos.size > 0 && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setSelectedAccnos(new Set())}
            >
              <XIcon className="w-3 h-3 mr-1" />Clear
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th className="th-navy px-2 w-8">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleAll}
                    className="cursor-pointer"
                    title={isAllSelected ? 'Deselect all' : 'Select all'}
                  />
                </th>
                {['S No','Acc No','Full Name','Mobile','Mobile 1','Sector','Subsector','Sabeel Type','Staying In','FMB Status'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
                <th className="th-navy px-2 w-8" title="Send WhatsApp reminder">WA</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="text-center py-16 text-gray-400">Loading…</td></tr>
              ) : allRows.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-16 text-gray-400">No records found</td></tr>
              ) : pagedRows.map((r, i) => (
                <tr
                  key={rowOffset + i}
                  className={selectedAccnos.has(r.accno)
                    ? 'bg-green-50 hover:bg-green-100'
                    : 'hover:bg-blue-500/[0.025]'}
                >
                  <td className="px-2 py-2.5 border-t border-border text-center">
                    <input
                      type="checkbox"
                      checked={selectedAccnos.has(r.accno)}
                      onChange={() => toggleRow(r.accno)}
                      className="cursor-pointer"
                    />
                  </td>
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
                  <td className="px-2 py-2.5 border-t border-border text-center">
                    <button
                      title={`Send reminder to ${r.fullName}`}
                      onClick={() => setWaReminderRow(r)}
                      className="inline-flex items-center justify-center w-6 h-6 rounded text-green-600 hover:bg-green-100 transition-colors"
                    >
                      <SendIcon className="w-3.5 h-3.5" />
                    </button>
                  </td>
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

      {/* ── WhatsApp reminder modals ─────────────────────────────────────── */}
      <WAReminderModal
        open={!!waReminderRow}
        onClose={() => setWaReminderRow(null)}
        row={waReminderRow}
      />
      <WABulkModal
        open={waBulkOpen}
        onClose={() => setWaBulkOpen(false)}
        rows={waBulkRows}
        batchLabel={listLabel}
      />
    </div>
  );
}
