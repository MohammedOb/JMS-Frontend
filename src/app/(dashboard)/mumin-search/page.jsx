'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { memberService } from '@/services';
import { useRouter }     from 'next/navigation';
import toast             from 'react-hot-toast';
import PageHeader        from '@/components/shared/PageHeader';
import { XIcon, RefreshIcon, DownloadIcon, BarChartIcon, FileTextIcon, PrintIcon } from '@/components/shared/Icons';

const ACCOUNT_STATUSES = ['Active', 'Closed', 'BlackList'];
const FMB_STATUSES     = ['Regular', 'Temporary', 'Only Amount Pay', 'Not Taken', 'Temp Closed', 'Closed', 'Closed with Due', 'N/A'];

const EXPORT_COLS = [
  { key: 'accno',            label: 'Acc No'         },
  { key: 'name',             label: 'Full Name'      },
  { key: 'sector',           label: 'Sector'         },
  { key: 'mobile',           label: 'Mobile'         },
  { key: 'mobile1',          label: 'Mobile 1'       },
  { key: 'itsNo',            label: 'ITS No'         },
  { key: 'localHofIts',      label: 'Local HOF ITS'  },
  { key: 'subsectorWithName',label: 'Subsector'      },
  { key: 'stayingIn',        label: 'Staying In'     },
  { key: 'sabeelType',       label: 'Sabeel Type'    },
  { key: 'thaliSize',        label: 'Thali Size'     },
  { key: 'thaliStatus',      label: 'Thali Status'   },
];

const TABLE_COLS = 15;

export default function MuminSearchPage() {
  const router        = useRouter();
  const exportBtnRef  = useRef(null);
  const exportMenuRef = useRef(null);

  const [allRows,  setAllRows]  = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [loaded,          setLoaded]          = useState(false);
  const [showExport,      setShowExport]      = useState(false);
  const [exportPos,       setExportPos]       = useState({});

  const [filters, setFilters] = useState({
    search: '', sector: '', subsector: '', stayingIn: '', status: '', fmbStatus: '', sabeelType: '',
  });
  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  const str = (v) => String(v ?? '');
  const normalizeRow = (m = {}) => {
    const subsector     = str(m.Subsector     ?? m.subsector     ?? '');
    const subsectorName = str(m.SubsectorName ?? m.subsectorName ?? '');
    return {
      accno:            str(m.AccNo        ?? m.accno        ?? ''),
      name:             str(m.FullName     ?? m.fullName     ?? ''),
      itsNo:            str(m.ITSNo        ?? m.itsNo        ?? ''),
      mobile:           str(m.Mobile       ?? m.mobile       ?? ''),
      mobile1:          str(m.Mobile1      ?? m.mobile1      ?? ''),
      localHofIts:      str(m.LocalHOFITS  ?? m.LocalHOFITSNo ?? m.localHofIts ?? ''),
      sector:           str(m.Sector       ?? m.sector       ?? ''),
      subsector,
      subsectorName,
      subsectorWithName: subsector && subsectorName
        ? `${subsector} - ${subsectorName}`
        : subsectorName || subsector,
      stayingIn:        str(m.StayingIn    ?? m.stayingIn    ?? ''),
      sabeelType:       str(m.SabeelType   ?? m.sabeelType   ?? ''),
      thaliSize:        str(m.ThaliSize    ?? m.ThaaliSize   ?? m.thaliSize  ?? ''),
      thaliStatus:      str(m.ThaaliStatus ?? m.FMBStatus    ?? m.fmbStatus  ?? ''),
      status:           str(m.Status       ?? m.status       ?? m.AccountStatus ?? ''),
      membersCount:     m.FamilyMembersCount ?? m.familyMembersCount ?? null,
    };
  };

  const normalizeResults = (data) => {
    if (!data)                     return [];
    if (Array.isArray(data))       return data.map(normalizeRow);
    if (data.recordset)            return data.recordset.map(normalizeRow);
    if (data.recordsets)           return (data.recordsets[0] || []).map(normalizeRow);
    if (Array.isArray(data.data))  return data.data.map(normalizeRow);
    return [];
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await memberService.loadMuminDetails({ Search: '' });
      setAllRows(normalizeResults(res.data));
      setLoaded(true);
    } catch {
      toast.error('Failed to load member list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

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

  const sectors = useMemo(() =>
    [...new Set(allRows.map(r => r.sector).filter(Boolean))].sort(),
    [allRows]
  );

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

  const stayingIns  = useMemo(() => [...new Set(allRows.map(r => r.stayingIn).filter(Boolean))].sort(),  [allRows]);
  const sabeelTypes = useMemo(() => [...new Set(allRows.map(r => r.sabeelType).filter(Boolean))].sort(), [allRows]);

  const filteredRows = useMemo(() => {
    let rows = allRows;
    const q = filters.search.toLowerCase().trim();
    if (q) rows = rows.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.accno.includes(q) ||
      r.mobile.includes(q) ||
      r.itsNo.includes(q)
    );
    if (filters.sector)     rows = rows.filter(r => r.sector      === filters.sector);
    if (filters.subsector)  rows = rows.filter(r => r.subsector   === filters.subsector);
    if (filters.stayingIn)  rows = rows.filter(r => r.stayingIn   === filters.stayingIn);
    if (filters.status)     rows = rows.filter(r => r.status      === filters.status);
    if (filters.fmbStatus)  rows = rows.filter(r => r.thaliStatus === filters.fmbStatus);
    if (filters.sabeelType) rows = rows.filter(r => r.sabeelType  === filters.sabeelType);
    return rows;
  }, [allRows, filters]);

  const clearFilters = () => setFilters({ search: '', sector: '', subsector: '', stayingIn: '', status: '', fmbStatus: '', sabeelType: '' });
  const hasFilters   = Object.values(filters).some(v => v !== '');
  const exportLabel  = `${filteredRows.length} ${hasFilters ? 'filtered ' : ''}members`;

  // ── Export helpers ────────────────────────────────────────────────────────
  const download = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: filename }).click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const header = EXPORT_COLS.map(c => c.label).join(',');
    const body   = filteredRows.map(r =>
      EXPORT_COLS.map(c => `"${(r[c.key] || '').replace(/"/g, '""')}"`).join(',')
    );
    download(new Blob([header + '\n' + body.join('\n')], { type: 'text/csv;charset=utf-8;' }), 'members.csv');
    setShowExport(false);
  };

  const exportExcel = async () => {
    const { utils, writeFile } = await import('xlsx');
    const ws = utils.aoa_to_sheet([
      EXPORT_COLS.map(c => c.label),
      ...filteredRows.map(r => EXPORT_COLS.map(c => r[c.key] || '')),
    ]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Members');
    writeFile(wb, 'members.xlsx');
    setShowExport(false);
  };

  const exportPDF = async () => {
    const { default: jsPDF }     = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(13);
    doc.text('Member List', 14, 15);
    doc.setFontSize(9);
    doc.text(`${exportLabel} · ${new Date().toLocaleDateString('en-GB')}`, 14, 21);
    autoTable(doc, {
      startY: 26,
      head:   [EXPORT_COLS.map(c => c.label)],
      body:   filteredRows.map(r => EXPORT_COLS.map(c => r[c.key] || '—')),
      styles:            { fontSize: 8, cellPadding: 2 },
      headStyles:        { fillColor: [15, 40, 80], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles:{ fillColor: [245, 247, 250] },
    });
    doc.save('members.pdf');
    setShowExport(false);
  };

  const printList = () => {
    const rows = filteredRows.map((r, i) =>
      `<tr><td>${i + 1}</td>${EXPORT_COLS.map(c => `<td>${r[c.key] || '—'}</td>`).join('')}</tr>`
    ).join('');
    const html = `<html><head><title>Member List</title><style>
      body{font-family:sans-serif;font-size:11px}h2{margin-bottom:4px}p{margin:0 0 10px;color:#666;font-size:10px}
      table{width:100%;border-collapse:collapse}th{background:#0f2850;color:#fff;padding:5px 8px;text-align:left;font-size:10px}
      td{padding:4px 8px;border-bottom:1px solid #e5e7eb}tr:nth-child(even) td{background:#f8fafc}
    </style></head><body>
      <h2>Member List</h2><p>${exportLabel} · ${new Date().toLocaleDateString('en-GB')}</p>
      <table><thead><tr><th>#</th>${EXPORT_COLS.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody></table>
    </body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const win = window.open(url, '_blank');
    win.addEventListener('load', () => { win.print(); URL.revokeObjectURL(url); });
    setShowExport(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Member List"
        subtitle={loaded ? `${allRows.length.toLocaleString()} total · ${filteredRows.length.toLocaleString()} shown` : 'Loading…'}
      />

      {/* Filter bar */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div>
              <label className="form-label">Search</label>
              <input className="form-input" placeholder="Name, Acc#, ITS, Mobile…"
                value={filters.search} onChange={e => setF('search', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Sector</label>
              <select className="form-select" value={filters.sector}
                onChange={e => setFilters(p => ({ ...p, sector: e.target.value, subsector: '' }))}>
                <option value="">All</option>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
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
                {stayingIns.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Account Status</label>
              <select className="form-select" value={filters.status} onChange={e => setF('status', e.target.value)}>
                <option value="">All</option>
                {ACCOUNT_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">FMB Status</label>
              <select className="form-select" value={filters.fmbStatus} onChange={e => setF('fmbStatus', e.target.value)}>
                <option value="">All</option>
                {FMB_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Sabeel Type</label>
              <select className="form-select" value={filters.sabeelType} onChange={e => setF('sabeelType', e.target.value)}>
                <option value="">All</option>
                {sabeelTypes.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasFilters && (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                <XIcon className="w-3.5 h-3.5 mr-1.5" />Clear Filters
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={loadAll} disabled={loading}>
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

      {/* Export dropdown — portal escapes card overflow:hidden */}
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

      {/* Results table */}
      <div className="card">
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {['S No','Acc No','Full Name','Sector','Mobile','Mobile 1','ITS No','Local HOF ITS','Subsector','Members','Staying In','Sabeel Type','Thali Size','Thali Status','Action'].map(h => (
                  <th key={h} className="th-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={TABLE_COLS} className="text-center py-16 text-gray-400">Loading members…</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan={TABLE_COLS} className="text-center py-16 text-gray-400">
                  {hasFilters ? 'No members match the current filters' : 'No members found'}
                </td></tr>
              ) : filteredRows.map((m, i) => (
                <tr key={i} className="hover:bg-blue-500/[0.025]">
                  <td className="px-3 py-2.5 border-t border-border text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2.5 border-t border-border text-blue-500 font-semibold">{m.accno}</td>
                  <td className="px-3 py-2.5 border-t border-border font-medium">{m.name}</td>
                  <td className="px-3 py-2.5 border-t border-border">{m.sector           || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{m.mobile           || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{m.mobile1          || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{m.itsNo            || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{m.localHofIts      || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{m.subsectorWithName || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border text-center">{m.membersCount ?? '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{m.stayingIn        || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{m.sabeelType       || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{m.thaliSize        || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">{m.thaliStatus      || '—'}</td>
                  <td className="px-3 py-2.5 border-t border-border">
                    <button className="btn btn-primary btn-sm"
                      onClick={() => router.push(`/mumin-details?accno=${m.accno}`)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
