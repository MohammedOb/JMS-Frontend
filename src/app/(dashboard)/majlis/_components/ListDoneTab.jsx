'use client';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { majlisService, lookupService } from '@/services';
import toast from 'react-hot-toast';
import { RefreshIcon, EditIcon, TrashIcon, DownloadIcon, BarChartIcon, FileTextIcon, PrintIcon } from '@/components/shared/Icons';
import { StatusPill, td, th } from './ui';
import FilterBarDone from './FilterBarDone';
import RegistrationModal, { cleanDate, fmtDate } from './RegistrationModal';

// Per-member columns used in grouped export (Sadar/Zakereen/Tazeen/BGI go in group header)
const EXPORT_COLS = [
  { label: 'Reg No',      key: 'RegistrationNo'    },
  { label: 'AccNo',       key: 'AccNo'              },
  { label: 'Full Name',   key: 'FullName'           },
  { label: 'Mobile',      key: 'Mobile'             },
  { label: 'Sector',      key: 'Sector'             },
  { label: 'Mohalla',     key: 'MohallaDescription' },
  { label: 'Majlis Date', key: 'MajlisDate'         },
  { label: 'Majlis Time', key: 'MajlisTime'         },
  { label: 'Slot Type',   key: 'SlotType'           },
  { label: 'Majlis Type', key: 'MajlisType'         },
  { label: 'Care Taker',  key: 'CareTaker'          },
  { label: 'Clearance',   key: 'ClearanceStatus'    },
  { label: 'Status',      key: 'MajlisStatus'       },
];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function ListDoneTab() {
  const [allRows, setAllRows]             = useState([]);
  const [loading, setLoading]             = useState(false);
  const [editRow, setEditRow]             = useState(null);
  const [opts, setOpts]                   = useState({});
  const [mohallaLookup, setMohallaLookup] = useState({ sectors: [], mohallas: [] });

  useEffect(() => {
    lookupService.getMajlisData().then(res => setOpts(res?.data?.data || {})).catch(() => {});
    lookupService.getMohallaData().then(res => setMohallaLookup(res?.data?.data || { sectors: [], mohallas: [] })).catch(() => {});
  }, []);

  // Server-side filters — Majlis Date range + Status
  const [apiFilters, setApiFilters] = useState({
    MajlisDateFrom: today(),
    MajlisDateTo:   today(),
    MajlisStatus:   'Done',
  });

  // Client-side filters
  const [localFilters, setLocalFilters] = useState({
    text:        '',
    Sector:      '',
    Subsector:   '',
    MajlisRaza:  '',
    SlotType:    '',
    MajlisTime:  '',
    MajlisType:  '',
    Sadar:       '',
  });

  // Export dropdown
  const [showExport, setShowExport] = useState(false);
  const [exportPos,  setExportPos]  = useState({});
  const exportBtnRef  = useRef(null);
  const exportMenuRef = useRef(null);

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

  const load = useCallback(async (params) => {
    setLoading(true);
    try {
      const active = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
      const res = await majlisService.load(active);
      const list = res?.data?.data ?? res?.data;
      setAllRows(Array.isArray(list) ? list : []);
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  }, []);

  const handleLocalChange = (k, v) => {
    setLocalFilters(p => {
      const next = { ...p, [k]: v };
      if (k === 'Sector')    { next.Subsector = ''; next.MajlisRaza = ''; }
      if (k === 'Subsector') { next.MajlisRaza = ''; }
      return next;
    });
  };

  const filteredRows = useMemo(() => {
    let r = allRows;
    if (localFilters.Sector)     r = r.filter(x => x.Sector === localFilters.Sector);
    if (localFilters.Subsector)  r = r.filter(x => x.Subsector === localFilters.Subsector);
    if (localFilters.MajlisRaza) r = r.filter(x => x.MajlisRaza === localFilters.MajlisRaza);
    if (localFilters.SlotType)   r = r.filter(x => x.SlotType === localFilters.SlotType);
    if (localFilters.MajlisTime) r = r.filter(x => x.MajlisTime === localFilters.MajlisTime);
    if (localFilters.MajlisType) r = r.filter(x => x.MajlisType === localFilters.MajlisType);
    if (localFilters.Sadar)      r = r.filter(x => x.Sadar === localFilters.Sadar);
    if (localFilters.text) {
      const q = localFilters.text.toLowerCase();
      r = r.filter(x =>
        (x.FullName && x.FullName.toLowerCase().includes(q)) ||
        (x.AccNo    && String(x.AccNo).includes(q))           ||
        (x.ITSNo    && String(x.ITSNo).includes(q))           ||
        (x.Mobile   && String(x.Mobile).includes(q))
      );
    }
    return r;
  }, [allRows, localFilters]);

  // Sector/Mohalla options from mohalladetails
  const sectorOpts = useMemo(() =>
    mohallaLookup.sectors.length > 0 ? mohallaLookup.sectors : (opts.Sector || [])
  , [mohallaLookup.sectors, opts.Sector]);

  const mohallaOpts = useMemo(() => {
    if (mohallaLookup.mohallas.length > 0) {
      const base = localFilters.Sector
        ? mohallaLookup.mohallas.filter(m => m.Sector === localFilters.Sector)
        : mohallaLookup.mohallas;
      return base.filter(m => m.Subsector).map(m => ({
        value: m.Subsector,
        label: `${m.Subsector} – ${m.MohallaDescription}`,
      }));
    }
    return (opts.MohallaDescription || []).map(v => ({ value: v, label: v }));
  }, [mohallaLookup.mohallas, localFilters.Sector, opts.MohallaDescription]);

  const razaOpts = useMemo(() => {
    if (allRows.length > 0) {
      let base = allRows;
      if (localFilters.Sector)    base = base.filter(r => r.Sector === localFilters.Sector);
      if (localFilters.Subsector) base = base.filter(r => r.Subsector === localFilters.Subsector);
      return [...new Set(base.map(r => r.MajlisRaza).filter(Boolean))].sort();
    }
    return opts.MajlisRaza || [];
  }, [allRows, localFilters.Sector, localFilters.Subsector, opts.MajlisRaza]);

  // Extra opts from majlisdetails DISTINCT (via getMajlisData)
  const statusOpts   = useMemo(() => opts.MajlisStatus || ['Pending', 'Done', 'Not Done'], [opts.MajlisStatus]);
  const slotTypeOpts = useMemo(() => opts.SlotType   || [], [opts.SlotType]);
  const majlisTimeOpts = useMemo(() => opts.MajlisTime || [], [opts.MajlisTime]);
  const majlisTypeOpts = useMemo(() => opts.MajlisType || [], [opts.MajlisType]);
  const sadarOpts    = useMemo(() => opts.Sadar      || [], [opts.Sadar]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const r of filteredRows) {
      const key = `${r.MajlisDate || ''}|||${r.Sadar || '(Unassigned)'}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          date:     r.MajlisDate,
          sadar:    r.Sadar || '(Unassigned)',
          zakereen: r.Zakereen,
          tazeen:   r.Tazeen,
          bgi:      r.BGI,
          slotType: r.SlotType,
          rows:     [],
        });
      }
      map.get(key).rows.push(r);
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.date > b.date) return -1;
      if (a.date < b.date) return 1;
      return a.sadar.localeCompare(b.sadar);
    });
  }, [filteredRows]);

  const stats = useMemo(() => ({
    total:   filteredRows.length,
    pending: filteredRows.filter(r => r.MajlisStatus === 'Pending').length,
    done:    filteredRows.filter(r => r.MajlisStatus === 'Done').length,
    notDone: filteredRows.filter(r => r.MajlisStatus === 'Not Done').length,
    sadars:  groups.length,
  }), [filteredRows, groups]);

  const deleteRow = async (r) => {
    if (!confirm(`Delete registration for ${r.FullName}?`)) return;
    try {
      await majlisService.delete({ ID: r.ID });
      toast.success('Deleted');
      setAllRows(p => p.filter(x => x.ID !== r.ID));
    } catch { toast.error('Failed to delete'); }
  };

  // ── export ────────────────────────────────────────────────────────────────

  const toggleExport = () => {
    if (!showExport && exportBtnRef.current) {
      const rect = exportBtnRef.current.getBoundingClientRect();
      setExportPos({ top: rect.bottom + 4, left: rect.left, minWidth: rect.width });
    }
    setShowExport(p => !p);
  };

  const groupHeader = (g) => {
    const parts = [fmtDate(g.date), g.sadar];
    if (g.zakereen) parts.push(`Zakereen: ${g.zakereen}`);
    if (g.tazeen)   parts.push(`Tazeen: ${g.tazeen}`);
    if (g.bgi)      parts.push(`BGI: ${g.bgi}`);
    parts.push(`${g.rows.length} member${g.rows.length !== 1 ? 's' : ''}`);
    return parts.join(' · ');
  };

  const exportCSV = () => {
    const lines = [];
    for (const g of groups) {
      lines.push(`"${groupHeader(g)}"`);
      lines.push(['#', ...EXPORT_COLS.map(c => `"${c.label}"`)].join(','));
      g.rows.forEach((r, i) => {
        lines.push([i + 1, ...EXPORT_COLS.map(c => `"${r[c.key] ?? ''}"`)].join(','));
      });
      lines.push('');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'majlis-done.csv' });
    a.click(); URL.revokeObjectURL(a.href);
    setShowExport(false);
  };

  const exportExcel = async () => {
    const { utils, writeFile } = await import('xlsx');
    const aoa = [];
    for (const g of groups) {
      aoa.push([groupHeader(g)]);
      aoa.push(['#', ...EXPORT_COLS.map(c => c.label)]);
      g.rows.forEach((r, i) => aoa.push([i + 1, ...EXPORT_COLS.map(c => r[c.key] ?? '')]));
      aoa.push([]);
    }
    const ws = utils.aoa_to_sheet(aoa);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Majlis Done');
    writeFile(wb, 'majlis-done.xlsx');
    setShowExport(false);
  };

  const exportPDF = async () => {
    const { default: jsPDF }     = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(13);
    doc.text('Majlis List — Done', 14, 15);
    doc.setFontSize(9);
    doc.text(`${filteredRows.length} records · ${groups.length} groups · ${new Date().toLocaleDateString('en-GB')}`, 14, 21);
    let y = 26;
    for (const g of groups) {
      doc.setFontSize(10); doc.setFont(undefined, 'bold');
      doc.text(`${fmtDate(g.date)} — ${g.sadar}`, 14, y);
      doc.setFont(undefined, 'normal'); doc.setFontSize(8);
      const sub = [g.zakereen && `Zakereen: ${g.zakereen}`, g.tazeen && `Tazeen: ${g.tazeen}`, g.bgi && `BGI: ${g.bgi}`].filter(Boolean).join(' · ');
      if (sub) { y += 4; doc.text(sub, 14, y); }
      autoTable(doc, {
        startY:             y + 4,
        head:               [['#', ...EXPORT_COLS.map(c => c.label)]],
        body:               g.rows.map((r, i) => [i + 1, ...EXPORT_COLS.map(c => r[c.key] ?? '')]),
        styles:             { fontSize: 6, cellPadding: 1.5 },
        headStyles:         { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin:             { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }
    doc.save('majlis-done.pdf');
    setShowExport(false);
  };

  const printList = () => {
    const groupsHtml = groups.map(g => {
      const sub = [g.zakereen && `Zakereen: ${g.zakereen}`, g.tazeen && `Tazeen: ${g.tazeen}`, g.bgi && `BGI: ${g.bgi}`].filter(Boolean).join(' · ');
      const rows = g.rows.map((r, i) =>
        `<tr><td>${i + 1}</td>${EXPORT_COLS.map(c => `<td>${r[c.key] ?? '—'}</td>`).join('')}</tr>`
      ).join('');
      return `<div class="group">
        <div class="gh"><div><div class="gd">${fmtDate(g.date)}</div><div class="gs">${g.sadar}</div>${sub ? `<div class="gi">${sub}</div>` : ''}</div>
        <div class="gc">${g.rows.length} member${g.rows.length !== 1 ? 's' : ''}</div></div>
        <table><thead><tr><th>#</th>${EXPORT_COLS.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody></table></div>`;
    }).join('');
    const html = `<html><head><title>Majlis Done</title><style>
      body{font-family:sans-serif;font-size:10px;margin:16px}h2{margin:0 0 3px;font-size:14px}p{margin:0 0 12px;color:#666;font-size:9px}
      .group{margin-bottom:14px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;page-break-inside:avoid}
      .gh{background:#334155;color:#fff;padding:7px 12px;display:flex;justify-content:space-between;align-items:center}
      .gd{font-size:9px;opacity:.7;margin-bottom:1px}.gs{font-weight:bold;font-size:12px}.gi{font-size:9px;opacity:.8;margin-top:2px}
      .gc{font-size:11px;font-weight:bold;background:rgba(255,255,255,.2);padding:3px 10px;border-radius:20px;white-space:nowrap}
      table{width:100%;border-collapse:collapse}th{background:#f1f5f9;padding:4px 6px;text-align:left;font-size:8.5px;border-bottom:1px solid #e2e8f0}
      td{padding:3px 6px;border-bottom:1px solid #f1f5f9;font-size:8.5px}tr:last-child td{border-bottom:none}tr:nth-child(even) td{background:#f8fafc}
    </style></head><body>
      <h2>Majlis List — Done</h2>
      <p>${filteredRows.length} records · ${groups.length} sadar groups · ${new Date().toLocaleDateString('en-GB')}</p>
      ${groupsHtml}
    </body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const win = window.open(url, '_blank');
    win.addEventListener('load', () => { win.print(); URL.revokeObjectURL(url); });
    setShowExport(false);
  };

  return (
    <div>
      <FilterBarDone
        apiFilters={apiFilters}
        onApiChange={(k, v) => setApiFilters(p => ({ ...p, [k]: v }))}
        localFilters={localFilters}
        onLocalChange={handleLocalChange}
        sectorOpts={sectorOpts}
        mohallaOpts={mohallaOpts}
        razaOpts={razaOpts}
        statusOpts={statusOpts}
        slotTypeOpts={slotTypeOpts}
        majlisTimeOpts={majlisTimeOpts}
        majlisTypeOpts={majlisTypeOpts}
        sadarOpts={sadarOpts}
        onSearch={() => load(apiFilters)}
        loading={loading}
      />

      {/* Summary bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          {loading ? (
            <span className="text-gray-400">Loading…</span>
          ) : filteredRows.length > 0 ? (
            <>
              <span className="font-semibold text-gray-700">{stats.total} record{stats.total !== 1 ? 's' : ''}</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500">{stats.sadars} sadar group{stats.sadars !== 1 ? 's' : ''}</span>
              {stats.pending > 0 && <span className="bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">{stats.pending} Pending</span>}
              {stats.done > 0    && <span className="bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">{stats.done} Done</span>}
              {stats.notDone > 0 && <span className="bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">{stats.notDone} Not Done</span>}
            </>
          ) : (
            <span className="text-gray-400">No records</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            ref={exportBtnRef}
            className="btn btn-secondary btn-sm"
            onClick={toggleExport}
            disabled={filteredRows.length === 0}
          >
            <DownloadIcon className="w-3.5 h-3.5 mr-1.5" />Export
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => load(apiFilters)} disabled={loading}>
            <RefreshIcon className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <div className="flex flex-col items-center gap-2">
            <RefreshIcon className="w-6 h-6 animate-spin opacity-30" />
            <span className="text-[13px]">Loading…</span>
          </div>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-3xl">📋</span>
            <span className="font-medium text-[14px]">No records found</span>
            <span className="text-[11px]">
              {allRows.length > 0 ? 'No results match the current filters' : 'Set a date range and click the search icon'}
            </span>
          </div>
        </div>
      ) : groups.map((g, gi) => (
        <div key={gi} className="rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">

          {/* Sadar group header */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                {g.date && (
                  <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded">
                    {fmtDate(g.date)}
                  </span>
                )}
              </div>
              <div className="text-white font-bold text-[16px] leading-tight">{g.sadar}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                {g.zakereen && <span className="text-slate-300 text-[11.5px]">Zakereen: <strong className="text-white">{g.zakereen}</strong></span>}
                {g.tazeen   && <span className="text-slate-300 text-[11.5px]">Tazeen: <strong className="text-white">{g.tazeen}</strong></span>}
                {g.bgi      && <span className="text-slate-300 text-[11.5px]">BGI: <strong className="text-white">{g.bgi}</strong></span>}
              </div>
            </div>
            <span className="shrink-0 bg-white/20 text-white text-[12px] font-bold px-3 py-1.5 rounded-full">
              {g.rows.length} member{g.rows.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Members table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  {['#', 'Reg No', 'AccNo', 'Full Name', 'Mobile', 'Sector', 'Mohalla', 'Majlis Date', 'Time', 'Care Taker', 'Clearance', 'Status', ''].map(h => (
                    <th key={h} className={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r, i) => (
                  <tr key={i} className={`transition-colors ${
                    r.MajlisStatus === 'Done'     ? 'bg-emerald-50/60 hover:bg-emerald-100/60' :
                    r.MajlisStatus === 'Not Done' ? 'bg-red-50/60 hover:bg-red-100/60'         :
                    'hover:bg-slate-50'
                  }`}>
                    <td className={`${td} text-gray-400 text-[11px]`}>{i + 1}</td>
                    <td className={`${td} font-mono text-[11px] text-blue-600 font-bold`}>{r.RegistrationNo || '—'}</td>
                    <td className={`${td} text-blue-600 font-semibold`}>{r.AccNo}</td>
                    <td className={`${td} font-medium text-gray-800`}>{r.FullName}</td>
                    <td className={`${td} text-gray-500`}>{r.Mobile || '—'}</td>
                    <td className={`${td} text-gray-500`}>{r.Sector || '—'}</td>
                    <td className={`${td} text-gray-500`}>{r.MohallaDescription || r.Subsector || '—'}</td>
                    <td className={`${td} text-gray-600 font-medium whitespace-nowrap`}>{fmtDate(r.MajlisDate)}</td>
                    <td className={`${td} text-gray-500`}>{r.MajlisTime || '—'}</td>
                    <td className={`${td} text-gray-500`}>{r.CareTaker || '—'}</td>
                    <td className={td}>
                      {r.ClearanceStatus
                        ? <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            r.ClearanceStatus === 'Cleared'     ? 'bg-emerald-100 text-emerald-700' :
                            r.ClearanceStatus === 'Not Cleared' ? 'bg-red-100 text-red-700'         :
                            'bg-gray-100 text-gray-600'
                          }`}>{r.ClearanceStatus}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className={td}><StatusPill status={r.MajlisStatus} /></td>
                    <td className={`${td} text-right`}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                          onClick={() => setEditRow({ ...r, MajlisDate: cleanDate(r.MajlisDate) })}
                        >
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                          onClick={() => deleteRow(r)}
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {editRow && (
        <RegistrationModal
          key={editRow.ID}
          initialData={editRow}
          onClose={() => setEditRow(null)}
          onSaved={() => load(apiFilters)}
        />
      )}

      {/* Export dropdown portal */}
      {typeof document !== 'undefined' && createPortal(
        showExport && (
          <div
            ref={exportMenuRef}
            style={{
              position: 'fixed', ...exportPos, zIndex: 9999,
              background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: '0.5rem', boxShadow: '0 8px 20px rgba(0,0,0,0.13)',
            }}
          >
            <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              Export {filteredRows.length} records
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
    </div>
  );
}
