'use client';

import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Modal from '@/components/shared/Modal';
import ComboBox from '../ComboBox';
import { memberService } from '@/services';

const SOURCES = [
  { key: 'system', label: 'From System' },
  { key: 'excel',  label: 'From Excel'  },
  { key: 'both',   label: 'Both'        },
];

const SORT_OPTIONS = [
  { key: 'none',         label: 'None / As Loaded'       },
  { key: 'age_asc',      label: 'Age ↑ (Youngest First)' },
  { key: 'age_desc',     label: 'Age ↓ (Oldest First)'   },
  { key: 'name_asc',     label: 'Name A–Z'               },
  { key: 'gender_male',  label: 'Gender (Male first)'    },
  { key: 'gender_female',label: 'Gender (Female first)'  },
  { key: 'misaq_done',   label: 'Misaq (Done first)'     },
  { key: 'misaq_not',    label: 'Misaq (Not Done first)' },
  { key: 'sector_asc',   label: 'Sector A–Z'             },
];

function SourceTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${
        active ? 'bg-white shadow text-navy-800' : 'text-gray-500 hover:text-navy-800'
      }`}
    >
      {children}
    </button>
  );
}

function downloadSampleExcel() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['ITSNo',      'FullName',       'AccNo',   'Gender', 'Sector'],
    ['12345678',   'Ahmed Ali',      'ACC001',  'Male',   'S01'   ],
    ['87654321',   'Fatima Husain',  '',        'Female', 'S02'   ],
    ['11223344',   'Maryam Zahir',   'ACC003',  'Female', 'S01'   ],
  ]);
  ws['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 8 }, { wch: 8 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Members');
  XLSX.writeFile(wb, 'seat_allocation_sample.xlsx');
}

export default function AutoAssignModal({
  open, onClose,
  autoPreview, autoMembers, loadingAuto, stats,
  onFetchMembers, onPreview, onClearPreview, onConfirm,
}) {
  const [source,      setSource]      = useState('system');
  const [gender,      setGender]      = useState('');
  const [ageMin,      setAgeMin]      = useState('');
  const [ageMax,      setAgeMax]      = useState('');
  const [misaq,       setMisaq]       = useState('');
  const [sector,      setSector]      = useState('');
  const [mohallaDesc, setMohallaDesc] = useState('');
  const [sortBy,      setSortBy]      = useState('none');
  const [sortBy2,     setSortBy2]     = useState('none');

  const [sectorOptions,  setSectorOptions]  = useState([]);
  const [mohallaOptions, setMohallaOptions] = useState([]);
  const [mohallaRows,    setMohallaRows]    = useState([]);

  // "S01A — Qutbi Masjid" label for each mohalla row
  const mohallaLabel = (r) =>
    r.Subsector && r.MohallaDescription
      ? `${r.Subsector} — ${r.MohallaDescription}`
      : r.MohallaDescription || r.Subsector || '';

  // Load sector/mohallah options when modal opens
  useEffect(() => {
    if (!open) return;
    memberService.loadMohallaDetails({})
      .then(res => {
        const rows = res.data?.data || [];
        setMohallaRows(rows);
        setSectorOptions([...new Set(rows.map(r => r.Sector).filter(Boolean))].sort());
        setMohallaOptions([...new Set(rows.map(mohallaLabel).filter(Boolean))].sort());
      })
      .catch(() => {});
  }, [open]);

  // Reset ALL internal state when modal closes
  useEffect(() => {
    if (open) return;
    setSource('system'); setGender(''); setAgeMin(''); setAgeMax('');
    setMisaq(''); setSector(''); setMohallaDesc('');
    setSortBy('none'); setSortBy2('none');
    setExcelMembers([]); setExcelFileName(''); setExcelError(null);
  }, [open]);

  const [excelMembers,  setExcelMembers]  = useState([]);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelError,    setExcelError]    = useState(null);
  const fileRef = useRef(null);

  const clearExcel = () => { setExcelMembers([]); setExcelFileName(''); setExcelError(null); };

  const parseExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb    = XLSX.read(e.target.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows  = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        const norm  = (key) => key.toLowerCase().replace(/[\s_\-.]/g, '');
        const mapped = rows.map(row => {
          const r = {};
          for (const k of Object.keys(row)) r[norm(k)] = String(row[k]).trim();
          return {
            AccNo:    r['accno']    || r['accountno'] || r['account']    || '',
            FullName: r['fullname'] || r['name']      || r['membername'] || '',
            ITSNo:    r['itsno']    || r['its']        || r['itsid']      || '',
            Sector:   r['sector']   || '',
            Gender:   r['gender']   || '',
          };
        }).filter(m => m.FullName || m.AccNo || m.ITSNo);
        setExcelMembers(mapped); setExcelFileName(file.name); setExcelError(null);
      } catch {
        setExcelError('Could not parse file. Ensure it is a valid .xlsx / .xls / .csv.');
        setExcelMembers([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => { const f = e.target.files?.[0]; if (f) parseExcel(f); };
  const handleDrop = (e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) parseExcel(f); };

  const showExcel  = source === 'excel' || source === 'both';
  const canSearch  = source === 'system' || source === 'both' || (showExcel && excelMembers.length > 0);
  const hasMembers = (autoMembers?.length > 0) && !autoPreview;
  const hasPreview = !!autoPreview;

  // Extract the pure MohallaDescription from a combined "Subsector — Description" label
  const resolveMohallaDesc = (label) => {
    if (!label) return undefined;
    const row = mohallaRows.find(r => mohallaLabel(r) === label);
    return row?.MohallaDescription || label;
  };

  const handleSearch  = () =>
    onFetchMembers({ gender, ageMin, ageMax, misaq, sector, mohallaDescription: resolveMohallaDesc(mohallaDesc), source, excelMembers });
  const handlePreview = () => onPreview(sortBy, sortBy2);

  const handleSectorChange = (val) => { setSector(val); setMohallaDesc(''); };

  const filteredMohallaOptions = sector
    ? [...new Set(mohallaRows.filter(r => r.Sector === sector).map(mohallaLabel).filter(Boolean))].sort()
    : mohallaOptions;

  // Stats
  const membersCount   = autoMembers?.length || 0;
  const seatsAvailable = stats?.available || 0;
  const overflow       = Math.max(0, membersCount - seatsAvailable);
  const willAssign     = Math.min(membersCount, seatsAvailable);

  // Overflow members (those not in preview)
  const overflowMembers = hasPreview && overflow > 0
    ? (() => {
        const previewITS = new Set(autoPreview.map(p => p.ITSNo).filter(Boolean));
        return (autoMembers || []).filter(m => !m.ITSNo || !previewITS.has(m.ITSNo));
      })()
    : [];

  const downloadOverflowExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['#', 'Name', 'ITS', 'Age', 'Gender', 'Misaq', 'Sector'],
      ...overflowMembers.map((m, i) => [i + 1, m.FullName, m.ITSNo, m.Age ?? '', m.Gender, m.Misaq, m.Sector]),
    ]);
    ws['!cols'] = [{ wch: 4 }, { wch: 22 }, { wch: 12 }, { wch: 5 }, { wch: 8 }, { wch: 10 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'No Seat');
    XLSX.writeFile(wb, 'members_without_seat.xlsx');
  };

  const downloadOverflowPDF = () => {
    const w = window.open('', '_blank');
    const rows = overflowMembers.map((m, i) => `
      <tr>
        <td>${i + 1}</td><td>${m.FullName}</td><td>${m.ITSNo}</td>
        <td>${m.Age ?? '—'}</td><td>${m.Gender || '—'}</td><td>${m.Misaq || '—'}</td>
      </tr>`).join('');
    w.document.write(`<html><head><title>Members Without Seat</title>
      <style>
        body{font-family:sans-serif;padding:20px;font-size:11px}
        h2{margin-bottom:8px}
        table{border-collapse:collapse;width:100%}
        th,td{border:1px solid #ccc;padding:5px 8px;text-align:left}
        th{background:#1e3a5f;color:#fff}
        tr:nth-child(even){background:#f9f9f9}
        @media print{body{margin:10mm}}
      </style></head>
      <body>
        <h2>Members Without Seat (${overflowMembers.length})</h2>
        <table>
          <thead><tr><th>#</th><th>Name</th><th>ITS</th><th>Age</th><th>Gender</th><th>Misaq</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <script>window.onload=()=>{window.print();}<\/script>
      </body></html>`);
    w.document.close();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Auto-Assign Seats"
      size="lg"
      footer={<>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        {hasPreview ? (
          <button className="btn-primary" onClick={onConfirm}>
            Confirm Assign {autoPreview.length} Seats
          </button>
        ) : hasMembers ? (
          <button className="btn-secondary" onClick={handlePreview}>
            Preview Assignment
          </button>
        ) : (
          <button className="btn-secondary" onClick={handleSearch} disabled={loadingAuto || !canSearch}>
            {loadingAuto ? 'Searching…' : 'Search Members'}
          </button>
        )}
      </>}
    >
      <div className="space-y-4">

        {/* Data Source */}
        <div>
          <label className="form-label mb-2">Data Source</label>
          <div className="flex gap-1 bg-surface border border-border rounded-lg p-1 w-fit">
            {SOURCES.map(s => (
              <SourceTab key={s.key} active={source === s.key} onClick={() => setSource(s.key)}>
                {s.label}
              </SourceTab>
            ))}
          </div>
        </div>

        {/* Member Filters */}
        {(source === 'system' || source === 'both') && (
          <div className="bg-surface rounded-lg border border-border p-3 space-y-3">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Member Filters</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="form-label">Gender</label>
                <select className="form-select" value={gender} onChange={e => setGender(e.target.value)}>
                  <option value="">Any</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div>
                <label className="form-label">Misaq</label>
                <select className="form-select" value={misaq} onChange={e => setMisaq(e.target.value)}>
                  <option value="">Any</option>
                  <option value="Done">Done (Adults)</option>
                  <option value="Not Done">Not Done</option>
                </select>
              </div>
              <div>
                <label className="form-label">Age Range</label>
                <div className="flex gap-1.5">
                  <input type="number" min={0} placeholder="Min" className="form-input w-full"
                    value={ageMin} onChange={e => setAgeMin(e.target.value)} />
                  <input type="number" min={0} placeholder="Max" className="form-input w-full"
                    value={ageMax} onChange={e => setAgeMax(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="form-label">Sector</label>
                <ComboBox value={sector} onChange={handleSectorChange} options={sectorOptions} placeholder="e.g. S01" />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Mohallah</label>
                <ComboBox value={mohallaDesc} onChange={setMohallaDesc}
                  options={filteredMohallaOptions} placeholder="Type or select mohallah…" />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button className="btn-secondary text-xs px-4 py-1.5" onClick={handleSearch} disabled={loadingAuto}>
                {loadingAuto ? 'Searching…' : 'Search Members'}
              </button>
            </div>
          </div>
        )}

        {/* Excel Upload */}
        {showExcel && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="form-label mb-0">Upload Excel / CSV</label>
              <button
                type="button"
                onClick={downloadSampleExcel}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                ↓ Download sample template
              </button>
            </div>
            <div
              onDrop={handleDrop} onDragOver={e => e.preventDefault()}
              onClick={() => !excelFileName && fileRef.current?.click()}
              className={`border-2 border-dashed border-border rounded-lg p-4 text-center transition-colors ${
                excelFileName ? 'cursor-default' : 'cursor-pointer hover:border-blue-400'
              }`}
            >
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
              {excelFileName ? (
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm font-medium text-navy-800">{excelFileName}</p>
                    <p className="text-xs text-green-600 mt-0.5">{excelMembers.length} members parsed</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); clearExcel(); }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500">Drop Excel / CSV here or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Required columns: <span className="font-mono">ITSNo</span> or <span className="font-mono">AccNo</span>,{' '}
                    <span className="font-mono">FullName</span>
                    {' '}· Optional: <span className="font-mono">Gender</span>, <span className="font-mono">Sector</span>
                  </p>
                </>
              )}
            </div>
            {excelError && <p className="text-xs text-red-500 mt-1">{excelError}</p>}
          </div>
        )}

        {/* After search: stats + sort + member list */}
        {hasMembers && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
                <p className="text-xl font-bold text-blue-700">{membersCount}</p>
                <p className="text-[10px] text-blue-500 uppercase tracking-wide">Members Found</p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-lg p-2">
                <p className="text-xl font-bold text-green-700">{seatsAvailable}</p>
                <p className="text-[10px] text-green-500 uppercase tracking-wide">Seats Available</p>
              </div>
              <div className={`rounded-lg p-2 border ${overflow > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-xl font-bold ${overflow > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                  {overflow > 0 ? overflow : willAssign}
                </p>
                <p className={`text-[10px] uppercase tracking-wide ${overflow > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                  {overflow > 0 ? "Won't Get Seat" : 'Will Assign'}
                </p>
              </div>
            </div>

            {/* Allocation order (2-level sort) */}
            <div className="bg-surface border border-border rounded-lg p-3 space-y-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Allocation Order</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="form-label">Primary Sort</label>
                  <select className="form-select text-xs" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Then by</label>
                  <select className="form-select text-xs" value={sortBy2} onChange={e => setSortBy2(e.target.value)}>
                    {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button className="btn-secondary text-xs px-3 py-1.5" onClick={handlePreview}>
                  Preview Assignment
                </button>
              </div>
            </div>

            {/* Member list */}
            <div className="border border-border rounded-lg overflow-auto max-h-48">
              <table className="w-full text-xs">
                <thead className="bg-surface sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">#</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Name</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">ITS</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Age</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Gender</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Misaq</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {autoMembers.map((m, i) => (
                    <tr key={i} className="hover:bg-surface">
                      <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-1.5 font-medium text-navy-800">{m.FullName}</td>
                      <td className="px-3 py-1.5 text-gray-500">{m.ITSNo}</td>
                      <td className="px-3 py-1.5 text-gray-500">{m.Age ?? '—'}</td>
                      <td className="px-3 py-1.5 text-gray-500">{m.Gender || '—'}</td>
                      <td className="px-3 py-1.5 text-gray-500">{m.Misaq || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Preview table */}
        {hasPreview && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-navy-800">
                Preview — {autoPreview.length} assignments
              </p>
              <button className="text-xs text-blue-600 hover:underline" onClick={onClearPreview}>
                ← Back to member list
              </button>
            </div>

            {/* Overflow warning + download */}
            {overflowMembers.length > 0 && (
              <div className="mb-2 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                <p className="text-xs text-red-700 font-medium">
                  {overflowMembers.length} member{overflowMembers.length !== 1 ? 's' : ''} won't get a seat
                </p>
                <div className="flex gap-2">
                  <button onClick={downloadOverflowExcel}
                    className="text-xs bg-white border border-red-200 text-red-700 px-2 py-1 rounded hover:bg-red-50">
                    Excel
                  </button>
                  <button onClick={downloadOverflowPDF}
                    className="text-xs bg-white border border-red-200 text-red-700 px-2 py-1 rounded hover:bg-red-50">
                    PDF
                  </button>
                </div>
              </div>
            )}

            <div className="border border-border rounded-lg overflow-auto max-h-60">
              <table className="w-full text-xs">
                <thead className="bg-surface sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">#</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Member</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">ITS</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Seat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {autoPreview.map((p, i) => (
                    <tr key={i} className="hover:bg-surface">
                      <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-1.5 font-medium text-navy-800">{p.FullName}</td>
                      <td className="px-3 py-1.5 text-gray-500">{p.ITSNo}</td>
                      <td className="px-3 py-1.5 font-mono font-bold text-blue-700">{p.RowLabel}{p.ColNo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
}
