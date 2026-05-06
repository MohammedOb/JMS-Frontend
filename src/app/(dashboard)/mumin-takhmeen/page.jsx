'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PageHeader from '@/components/shared/PageHeader';
import { takhmeenService } from '@/services';
import { RefreshIcon, XIcon, DownloadIcon, BarChartIcon, FileTextIcon, PrintIcon } from '@/components/shared/Icons';

const CY = new Date().getFullYear();

const INIT_FILTERS = {
  forYear:      String(CY),
  hubMainHead:  '',
  hubSubHead:   '',
  sector:       '',
  subsector:    '',
  sabeelType:   '',
  thaaliStatus: '',
  thaaliSize:   '',
  amountFrom:   '',
  amountTo:     '',
};

const TABLE_COLS = 14;

const EXPORT_COLS = [
  { key: 'accno',             label: 'Acc No'        },
  { key: 'fullName',          label: 'Full Name'     },
  { key: 'mobile',            label: 'Mobile'        },
  { key: 'localHofIts',       label: 'Local HOF ITS' },
  { key: 'sector',            label: 'Sector'        },
  { key: 'subsectorWithName', label: 'Subsector'     },
  { key: 'sabeelType',        label: 'Sabeel Type'   },
  { key: 'membersCount',      label: 'Members'       },
  { key: 'thaaliStatus',      label: 'Thali Status'  },
  { key: 'thaaliSize',        label: 'Thali Size'    },
  { key: 'hubSubHead',        label: 'Hub Sub Head'  },
  { key: 'forYear',           label: 'For Year'      },
  { key: 'takhmeen',          label: 'Takhmeen (₹)'  },
];

const str = (v) => String(v ?? '');
const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();

const normalizeRow = (r) => {
  const subsector     = str(r.Subsector     ?? r.subsector     ?? '');
  const subsectorName = str(r.SubsectorName ?? r.subsectorName ?? '');
  return {
    id:                r.ID           || r.Id          || r.id,
    accno:             str(r.AccNo    ?? r.accno        ?? ''),
    fullName:          str(r.FullName ?? r.fullName     ?? ''),
    mobile:            str(r.Mobile   ?? r.mobile       ?? ''),
    localHofIts:       str(r.LocalHOFITS ?? r.LocalHOFITSNo ?? r.localHofIts ?? ''),
    sector:            str(r.Sector   ?? r.sector       ?? ''),
    subsector,
    subsectorName,
    subsectorWithName: subsector && subsectorName
      ? `${subsector} - ${subsectorName}`
      : subsectorName || subsector,
    sabeelType:        str(r.SabeelType  ?? r.sabeelType  ?? ''),
    membersCount:      r.FamilyMembersCount ?? r.familyMembersCount ?? null,
    thaaliStatus:      str(r.ThaaliStatus ?? r.FMBStatus  ?? r.fmbStatus  ?? ''),
    thaaliSize:        str(r.ThaaliSize   ?? r.ThaliSize  ?? r.thaliSize  ?? ''),
    hubSubHead:        str(r.HubSubHead   ?? r.hubSubHead ?? ''),
    hubMainHead:       str(r.HubMainHead  ?? r.hubMainHead ?? ''),
    forYear:           str(r.ForYear ?? r.forYear ?? ''),
    takhmeen:          Number(r.Takhmeen  ?? r.takhmeen  ?? 0),
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

export default function MuminTakhmeenPage() {
  const router        = useRouter();
  const exportBtnRef  = useRef(null);
  const exportMenuRef = useRef(null);

  const [allRows,    setAllRows]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportPos,  setExportPos]  = useState({});
  const [filters,    setFilters]    = useState(INIT_FILTERS);

  const setF = useCallback((k, v) => setFilters(p => ({ ...p, [k]: v })), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await takhmeenService.loadDetails({});
      setAllRows(normalizeResults(res.data));
    } catch {
      toast.error('Failed to load takhmeen data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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

  // ── filter options — all derived from DB data ─────────────────────────────

  const forYears = useMemo(() =>
    uniq(allRows.map(r => r.forYear)), [allRows]);

  const hubMainHeads = useMemo(() =>
    uniq(allRows.map(r => r.hubMainHead)), [allRows]);

  const hubSubHeadOptions = useMemo(() =>
    uniq(
      allRows
        .filter(r => !filters.hubMainHead || r.hubMainHead === filters.hubMainHead)
        .map(r => r.hubSubHead)
    ), [allRows, filters.hubMainHead]);

  const sectors = useMemo(() =>
    uniq(allRows.map(r => r.sector)), [allRows]);

  const subsectorOptions = useMemo(() => {
    const seen = new Set();
    return allRows
      .filter(r => !filters.sector || r.sector === filters.sector)
      .reduce((acc, r) => {
        if (r.subsector && !seen.has(r.subsector)) {
          seen.add(r.subsector);
          acc.push({ code: r.subsector, name: r.subsectorName || r.subsector });
        }
        return acc;
      }, [])
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allRows, filters.sector]);

  const sabeelTypes    = useMemo(() => uniq(allRows.map(r => r.sabeelType)),    [allRows]);
  const thaaliStatuses = useMemo(() => uniq(allRows.map(r => r.thaaliStatus)),  [allRows]);
  const thaaliSizes    = useMemo(() => uniq(allRows.map(r => r.thaaliSize)),    [allRows]);

  // ── client-side filtering ─────────────────────────────────────────────────

  const filteredRows = useMemo(() => {
    let rows = allRows;
    if (filters.forYear)           rows = rows.filter(r => r.forYear      === filters.forYear);
    if (filters.hubMainHead)       rows = rows.filter(r => r.hubMainHead  === filters.hubMainHead);
    if (filters.hubSubHead)        rows = rows.filter(r => r.hubSubHead   === filters.hubSubHead);
    if (filters.sector)            rows = rows.filter(r => r.sector       === filters.sector);
    if (filters.subsector)         rows = rows.filter(r => r.subsector    === filters.subsector);
    if (filters.sabeelType)        rows = rows.filter(r => r.sabeelType   === filters.sabeelType);
    if (filters.thaaliStatus)      rows = rows.filter(r => r.thaaliStatus === filters.thaaliStatus);
    if (filters.thaaliSize)        rows = rows.filter(r => r.thaaliSize   === filters.thaaliSize);
    if (filters.amountFrom !== '') rows = rows.filter(r => r.takhmeen >= Number(filters.amountFrom));
    if (filters.amountTo   !== '') rows = rows.filter(r => r.takhmeen <= Number(filters.amountTo));
    return rows;
  }, [allRows, filters]);

  const hasFilters   = Object.keys(INIT_FILTERS).some(k => String(filters[k]) !== String(INIT_FILTERS[k]));
  const clearFilters = useCallback(() => setFilters(INIT_FILTERS), []);

  const fmt         = (n) => Number(n || 0).toLocaleString('en-IN');
  const totTakhmeen = useMemo(() => filteredRows.reduce((s, r) => s + r.takhmeen, 0), [filteredRows]);

  const exportLabel = `${filteredRows.length}${hasFilters ? ' filtered' : ''} records`;

  const toggleExport = () => {
    if (!showExport && exportBtnRef.current) {
      const rect = exportBtnRef.current.getBoundingClientRect();
      setExportPos({ top: rect.bottom + 4, left: rect.left, minWidth: rect.width });
    }
    setShowExport(p => !p);
  };

  // ── export helpers ────────────────────────────────────────────────────────

  const exportCSV = () => {
    const header   = EXPORT_COLS.map(c => c.label).join(',');
    const body     = filteredRows.map(r =>
      EXPORT_COLS.map(c => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const totalRow = [
      `"Total (${filteredRows.length} records)"`,
      ...Array(EXPORT_COLS.length - 2).fill('""'),
      `"₹${fmt(totTakhmeen)}"`,
    ].join(',');
    download(
      new Blob([header + '\n' + body.join('\n') + '\n' + totalRow], { type: 'text/csv;charset=utf-8;' }),
      'takhmeen.csv'
    );
    setShowExport(false);
  };

  const exportExcel = async () => {
    const { utils, writeFile } = await import('xlsx');
    const totalRow = [
      `Total (${filteredRows.length} records)`,
      ...Array(EXPORT_COLS.length - 2).fill(''),
      totTakhmeen,
    ];
    const ws = utils.aoa_to_sheet([
      EXPORT_COLS.map(c => c.label),
      ...filteredRows.map(r => EXPORT_COLS.map(c => r[c.key] ?? '')),
      totalRow,
    ]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Takhmeen');
    writeFile(wb, 'takhmeen.xlsx');
    setShowExport(false);
  };

  const exportPDF = async () => {
    const { default: jsPDF }     = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(13);
    doc.text('Mumin Takhmeen', 14, 15);
    doc.setFontSize(9);
    doc.text(`${exportLabel} · ${new Date().toLocaleDateString('en-GB')}`, 14, 21);
    autoTable(doc, {
      startY: 26,
      head:   [EXPORT_COLS.map(c => c.label)],
      body:   filteredRows.map(r => EXPORT_COLS.map(c => String(r[c.key] ?? '—'))),
      foot:   [[
        `Total (${filteredRows.length} records)`,
        ...Array(EXPORT_COLS.length - 2).fill(''),
        `₹${fmt(totTakhmeen)}`,
      ]],
      styles:            { fontSize: 7, cellPadding: 2 },
      headStyles:        { fillColor: [15, 40, 80], textColor: 255, fontStyle: 'bold' },
      footStyles:        { fillColor: [15, 40, 80], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles:{ fillColor: [245, 247, 250] },
      showFoot:          'lastPage',
    });
    doc.save('takhmeen.pdf');
    setShowExport(false);
  };

  const printList = () => {
    const rows = filteredRows.map((r, i) =>
      `<tr><td>${i + 1}</td>${EXPORT_COLS.map(c => `<td>${r[c.key] ?? '—'}</td>`).join('')}</tr>`
    ).join('');
    const html = `<html><head><title>Mumin Takhmeen</title><style>
      body{font-family:sans-serif;font-size:10px}h2{margin-bottom:4px}p{margin:0 0 10px;color:#666;font-size:9px}
      table{width:100%;border-collapse:collapse}th{background:#0f2850;color:#fff;padding:4px 6px;text-align:left;font-size:9px}
      td{padding:3px 6px;border-bottom:1px solid #e5e7eb}tr:nth-child(even) td{background:#f8fafc}
      tfoot td{background:#0f2850;color:#fff;font-weight:bold;padding:4px 6px}
    </style></head><body>
      <h2>Mumin Takhmeen</h2><p>${exportLabel} · ${new Date().toLocaleDateString('en-GB')}</p>
      <table>
        <thead><tr><th>#</th>${EXPORT_COLS.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr>
          <td colspan="${EXPORT_COLS.length}">Total (${filteredRows.length} records)</td>
          <td style="text-align:right">₹${fmt(totTakhmeen)}</td>
        </tr></tfoot>
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
      <PageHeader title="Mumin Takhmeen" subtitle="Takhmeen report" />

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="form-label">For Year</label>
              <select className="form-select" value={filters.forYear} onChange={e => setF('forYear', e.target.value)}>
                <option value="">All Years</option>
                {forYears.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Hub Main Head</label>
              <select className="form-select" value={filters.hubMainHead}
                onChange={e => setFilters(p => ({ ...p, hubMainHead: e.target.value, hubSubHead: '' }))}>
                <option value="">All</option>
                {hubMainHeads.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Hub Sub Head</label>
              <select className="form-select" value={filters.hubSubHead} onChange={e => setF('hubSubHead', e.target.value)}>
                <option value="">All</option>
                {hubSubHeadOptions.map(h => <option key={h}>{h}</option>)}
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
              <label className="form-label">Sabeel Type</label>
              <select className="form-select" value={filters.sabeelType} onChange={e => setF('sabeelType', e.target.value)}>
                <option value="">All</option>
                {sabeelTypes.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">FMB Status</label>
              <select className="form-select" value={filters.thaaliStatus} onChange={e => setF('thaaliStatus', e.target.value)}>
                <option value="">All</option>
                {thaaliStatuses.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Thali Size</label>
              <select className="form-select" value={filters.thaaliSize} onChange={e => setF('thaaliSize', e.target.value)}>
                <option value="">All</option>
                {thaaliSizes.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Amount From (₹)</label>
              <input type="number" className="form-input" placeholder="0"
                value={filters.amountFrom} onChange={e => setF('amountFrom', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Amount To (₹)</label>
              <input type="number" className="form-input" placeholder="∞"
                value={filters.amountTo} onChange={e => setF('amountTo', e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasFilters && (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                <XIcon className="w-3.5 h-3.5 mr-1.5" />Clear Filters
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
              {loading ? 'Loading…' : <><RefreshIcon className="w-3.5 h-3.5 mr-1.5" />Refresh</>}
            </button>
            <button
              ref={exportBtnRef}
              className="btn btn-secondary btn-sm"
              onClick={toggleExport}
              disabled={filteredRows.length === 0}
            >
              <DownloadIcon className="w-3.5 h-3.5 mr-1.5" />Export
            </button>
            <span className="text-[12px] font-medium text-navy-800 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 whitespace-nowrap">
              {filteredRows.length.toLocaleString()} records
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
                {['S No','Acc No','Full Name','Mobile','Local HOF ITS','Sector','Subsector','Sabeel Type','Members','Thali Status','Thali Size','Hub Sub Head','For Year','Takhmeen (₹)'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={TABLE_COLS} className="text-center py-16 text-gray-400">Loading…</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan={TABLE_COLS} className="text-center py-16 text-gray-400">
                  {hasFilters ? 'No records match the current filters' : 'No records found'}
                </td></tr>
              ) : filteredRows.map((r, i) => (
                <tr key={r.id ?? i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2.5 border-t border-border text-blue-500 font-semibold cursor-pointer"
                    onClick={() => router.push(`/mumin-details?accno=${r.accno}`)}>{r.accno || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border font-medium">{r.fullName        || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.mobile           || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.localHofIts      || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.sector           || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.subsectorWithName || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.sabeelType       || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border text-center">{r.membersCount ?? '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.thaaliStatus     || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.thaaliSize       || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{r.hubSubHead       || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border text-center">{r.forYear         || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border text-right font-semibold">₹{fmt(r.takhmeen)}</td>
                </tr>
              ))}
            </tbody>
            {filteredRows.length > 0 && (
              <tfoot>
                <tr className="bg-navy-800/[0.04] font-bold text-[12px]">
                  <td colSpan={13} className="px-3 py-2.5 border-t-2 border-navy-800/20">
                    Total ({filteredRows.length} records)
                  </td>
                  <td className="px-3 py-2.5 border-t-2 border-navy-800/20 text-right">₹{fmt(totTakhmeen)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
